import '../config/loadEnv';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPool, closePool } from './pool';
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');
/** Execute the existing transaction-wrapped SQL migrations atomically together
 * with schema_migrations bookkeeping, without changing the SQL files. */
export function migrationBody(sql: string): string {
  const lines = sql.replace(/^\uFEFF/, '').split(/\r?\n/);
  const statements = lines.filter(line => !/^\s*(BEGIN|COMMIT)\s*;\s*(?:--.*)?$/i.test(line));
  if (statements.length === lines.length) throw new Error('MIGRATION_TRANSACTION_MARKERS_MISSING');
  return statements.join('\n');
}
async function main() {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock(17439021)');
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())');
    for (const name of (await readdir(dir)).filter(x => /^\d+_.*\.sql$/.test(x)).sort()) {
      const version = name.slice(0, -4);
      if ((await client.query('SELECT 1 FROM schema_migrations WHERE version=$1', [version])).rowCount) continue;
      const sql = migrationBody(await readFile(path.join(dir, name), 'utf8'));
      await client.query('BEGIN');
      try {
        await client.query(sql);
           await client.query('INSERT INTO schema_migrations(version) VALUES($1) ON CONFLICT DO NOTHING', [version]);
        await client.query('COMMIT');
        console.log('Applied:', version);
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`MIGRATION_FAILED_${version}`, { cause: error });
      }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock(17439021)').catch(() => {});
    client.release();
    await closePool();
  }
}
main().catch(e => {console.error('DATABASE_MIGRATION_FAILED:', e); process.exitCode = 1;});
