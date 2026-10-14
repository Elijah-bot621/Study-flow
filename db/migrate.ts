import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { PoolClient } from 'pg';
import { getPool, closePool } from '../db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface MigrationResult {
  success: boolean;
  applied: string[];
  alreadyApplied: string[];
  error?: string;
}

/**
 * Ensures the schema_migrations tracking table exists.
 */
async function ensureMigrationsTable(client: PoolClient): Promise<void> {
  const sql = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await client.query(sql);
}

/**
 * Retrieves the list of already applied migration filenames.
 */
async function getAppliedMigrations(client: PoolClient): Promise<Set<string>> {
  const res = await client.query<{ name: string }>('SELECT name FROM schema_migrations ORDER BY id ASC;');
  return new Set(res.rows.map((r) => r.name));
}

/**
 * Reads and sorts available .sql migration files from the migrations folder.
 */
async function getMigrationFiles(): Promise<string[]> {
  const migrationsDir = path.resolve(__dirname, 'migrations');
  const entries = await fs.readdir(migrationsDir);
  return entries
    .filter((file) => file.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Executes all pending database schema migrations inside transactions.
 * Safe, idempotent, and transactional per migration.
 */
export async function runMigrations(): Promise<MigrationResult> {
  const pool = getPool();
  if (!pool) {
    const errorMsg = 'DATABASE_URL is not configured. Cannot run database migrations.';
    console.error(`[StudyFlow Migration] ${errorMsg}`);
    return {
      success: false,
      applied: [],
      alreadyApplied: [],
      error: errorMsg,
    };
  }

  const applied: string[] = [];
  const alreadyApplied: string[] = [];
  const client: PoolClient = await pool.connect();

  try {
    console.log('[StudyFlow Migration] Checking database schema status...');
    await ensureMigrationsTable(client);

    const appliedSet = await getAppliedMigrations(client);
    const migrationFiles = await getMigrationFiles();

    for (const file of migrationFiles) {
      if (appliedSet.has(file)) {
        alreadyApplied.push(file);
      } else {
        console.log(`[StudyFlow Migration] Applying migration: ${file}...`);
        const filePath = path.resolve(__dirname, 'migrations', file);
        const sql = await fs.readFile(filePath, 'utf-8');

        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query('INSERT INTO schema_migrations (name) VALUES ($1);', [file]);
          await client.query('COMMIT');
          applied.push(file);
          console.log(`[StudyFlow Migration] Successfully applied: ${file}`);
        } catch (err: unknown) {
          await client.query('ROLLBACK');
          const errMsg = err instanceof Error ? err.message : 'Unknown migration error';
          console.error(`[StudyFlow Migration] Failed to apply ${file}: ${errMsg}`);
          return {
            success: false,
            applied,
            alreadyApplied,
            error: `Failed applying ${file}: ${errMsg}`,
          };
        }
      }
    }

    if (applied.length === 0) {
      console.log('[StudyFlow Migration] Database schema is already up to date. No pending migrations.');
    } else {
      console.log(`[StudyFlow Migration] Successfully completed. ${applied.length} migration(s) applied.`);
    }

    return {
      success: true,
      applied,
      alreadyApplied,
    };
  } finally {
    client.release();
  }
}

// CLI entry point
const isCli = process.argv[1] && (
  process.argv[1].endsWith('migrate.ts') || 
  process.argv[1].endsWith('migrate.js')
);

if (isCli) {
  runMigrations()
    .then(async (result) => {
      await closePool();
      if (!result.success) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch(async (err: unknown) => {
      const errMsg = err instanceof Error ? err.message : 'Migration runner failure';
      console.error('[StudyFlow Migration] Fatal error:', errMsg);
      await closePool();
      process.exit(1);
    });
}
