import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { PoolClient } from 'pg';
import { getPool, closePool } from '../db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constant 64-bit advisory lock key dedicated to StudyFlow schema migrations.
// Chosen as a distinct signed 64-bit integer.
const MIGRATION_ADVISORY_LOCK_ID = '847291048192014';

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
 * Executes pending database schema migrations with safe transaction-level locking.
 * Compatible with Neon's pooled connection strings (PgBouncer in transaction mode).
 * Uses pg_advisory_xact_lock to ensure exclusive migration execution without leaking
 * session-level locks across pooled connections.
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
    console.log('[StudyFlow Migration] Beginning migration process with transaction-level locking...');
    await client.query('BEGIN');

    // 1. Transaction-level advisory lock:
    // Safe with Neon transaction poolers (PgBouncer). Automatically released upon COMMIT or ROLLBACK.
    await client.query('SELECT pg_advisory_xact_lock($1);', [MIGRATION_ADVISORY_LOCK_ID]);

    // 2. Ensure schema_migrations exists
    await ensureMigrationsTable(client);

    // 3. Acquire exclusive table lock on schema_migrations for defense-in-depth serialization
    await client.query('LOCK TABLE schema_migrations IN ACCESS EXCLUSIVE MODE;');

    const appliedSet = await getAppliedMigrations(client);
    const migrationFiles = await getMigrationFiles();

    for (const file of migrationFiles) {
      if (appliedSet.has(file)) {
        alreadyApplied.push(file);
      } else {
        console.log(`[StudyFlow Migration] Applying migration: ${file}...`);
        const filePath = path.resolve(__dirname, 'migrations', file);
        const sql = await fs.readFile(filePath, 'utf-8');

        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1);', [file]);
        applied.push(file);
        console.log(`[StudyFlow Migration] Successfully applied: ${file}`);
      }
    }

    await client.query('COMMIT');

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
  } catch (err: unknown) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr: unknown) {
      console.error('[StudyFlow Migration] Rollback error:', rollbackErr);
    }

    const errMsg = err instanceof Error ? err.message : 'Unknown migration error';
    console.error(`[StudyFlow Migration] Migration failed: ${errMsg}`);
    return {
      success: false,
      applied,
      alreadyApplied,
      error: errMsg,
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
