import pg from 'pg';

const { Pool } = pg;

export type DatabaseStatus = 'not_configured' | 'connected' | 'error';

let pool: pg.Pool | null = null;
let currentConnectionString: string | undefined;

/**
 * Returns the pg Pool instance lazily, or null if DATABASE_URL is not set.
 */
export function getPool(): pg.Pool | null {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    return null;
  }

  // If connection string was modified during runtime, recreate the pool
  if (pool && currentConnectionString !== databaseUrl) {
    pool.end().catch(() => {});
    pool = null;
  }

  if (!pool) {
    currentConnectionString = databaseUrl;
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: true,
      },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000,
    });

    pool.on('error', (err: Error) => {
      console.error('Unexpected error on idle PostgreSQL client:', err.message);
    });
  }

  return pool;
}

/**
 * Checks database connectivity by executing `SELECT 1` with a short timeout (~3 seconds).
 *
 * Returns:
 * - 'not_configured' when DATABASE_URL is missing/empty
 * - 'connected' when SELECT 1 succeeds
 * - 'error' when connection or query fails
 *
 * Safe: never throws, never leaks connection string or database credentials.
 */
export async function checkDatabaseConnection(): Promise<DatabaseStatus> {
  const currentPool = getPool();
  if (!currentPool) {
    return 'not_configured';
  }

  let timeoutId: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Database connectivity check timed out'));
    }, 3000);
  });

  try {
    await Promise.race([
      currentPool.query('SELECT 1'),
      timeoutPromise,
    ]);
    return 'connected';
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown database error';
    console.error('Database connectivity check failed:', errorMsg);
    return 'error';
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Gracefully ends the current pool if open.
 */
export async function closePool(): Promise<void> {
  if (pool) {
    const activePool = pool;
    pool = null;
    currentConnectionString = undefined;
    await activePool.end().catch(() => {});
  }
}
