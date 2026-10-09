import { Pool } from 'pg';
let pool: Pool | undefined;
/** Lazy connection: no database access or fake fallback at module initialization. */
export function getPool(): Pool {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL_NOT_CONFIGURED');
  if (pool) return pool;
  pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10,
    connectionTimeoutMillis: 4000, idleTimeoutMillis: 30000,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined });
  // Phase 14: without this listener, a PostgreSQL restart/network drop makes an IDLE pooled client
  // emit an unhandled 'error' event and the whole web server process exits. The pool discards the
  // broken client itself; requests then get the existing 503 responses until the DB is back.
  pool.on('error', (err: Error & { code?: string }) => {
    console.error('[db] idle PostgreSQL client error:', err.code ?? 'UNKNOWN', '-', err.message);
  });
  return pool;
}
export async function closePool(): Promise<void> { if (pool) await pool.end(); pool = undefined; }
