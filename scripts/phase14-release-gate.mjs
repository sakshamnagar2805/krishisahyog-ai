/**
 * Phase 14D: truthful, repeatable hackathon release gate.
 * Usage (PowerShell or bash, project root):  npm run phase14:gate
 *   Optional: start `npm run dev` in another window first so the runtime API checks can run.
 * The script never contacts government websites and never changes data.
 * Exit code 0 only when the Code Quality and Runtime gates both PASS.
 */
import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import dotenv from 'dotenv';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({path: path.join(root, '.env.local'), quiet: true});
dotenv.config({path: path.join(root, '.env'), quiet: true});
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const BASE = process.env.GATE_BASE_URL || 'http://127.0.0.1:3000';

function run(args, timeout = 600_000) {
  const r = spawnSync(npm, args, {cwd: root, encoding: 'utf8', timeout, shell: process.platform === 'win32', env: {...process.env, FORCE_COLOR: '0'}});
  return {ok: r.status === 0, out: `${r.stdout ?? ''}${r.stderr ?? ''}`};
}
const gates = {codeQuality: [], runtime: [], browserDemo: [], governmentLiveData: []};
const add = (gate, check, status, detail) => gates[gate].push({check, status, detail});
const tail = s => s.trim().split(/\r?\n/).slice(-3).join(' | ').slice(0, 300);

// ---- Code Quality Gate ----
const nodeMajor = Number(process.versions.node.split('.')[0]);
add('codeQuality', 'Node.js >= 22', nodeMajor >= 22 ? 'PASS' : 'FAIL', process.version);
add('codeQuality', 'Dependencies installed (npm ci)', existsSync(path.join(root, 'node_modules', 'vite')) ? 'PASS' : 'FAIL', 'run `npm ci` if FAIL');
let r = run(['run', 'lint']);
add('codeQuality', 'TypeScript (npm run lint)', r.ok ? 'PASS' : 'FAIL', r.ok ? 'tsc --noEmit clean' : tail(r.out));
r = run(['run', 'test:all']);
const counts = r.out.match(/# pass (\d+)[\s\S]*?# fail (\d+)[\s\S]*?# skipped (\d+)/);
add('codeQuality', 'Automated tests (npm run test:all)', r.ok ? 'PASS' : 'FAIL', counts ? `pass ${counts[1]}, fail ${counts[2]}, skipped ${counts[3]}` : tail(r.out));
r = run(['run', 'build']);
add('codeQuality', 'Production build + bundle verification (npm run build)', r.ok ? 'PASS' : 'FAIL', r.ok ? 'no demo chunk, no synthetic IDs, no React dev runtime' : tail(r.out));
r = run(['audit', '--omit=dev']);
add('codeQuality', 'npm audit (runtime dependencies)', r.ok ? 'PASS' : 'WARN', tail(r.out));

// ---- Runtime Gate ----
let pg;
try { pg = (await import('pg')).default; } catch { /* not installed */ }
if (!process.env.DATABASE_URL || !pg) add('runtime', 'Database configured', 'FAIL', 'Set DATABASE_URL in .env.local');
else {
  const pool = new pg.Pool({connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 4000, max: 1});
  pool.on('error', () => {});
  try {
    const m = await pool.query('SELECT version FROM schema_migrations ORDER BY version');
    const versions = m.rows.map(x => x.version);
    add('runtime', 'Migrations 0001–0006 applied', versions.includes('0006_research_staging') ? 'PASS' : 'FAIL', versions.join(', '));
    const rs = await pool.query(`SELECT count(*)::int n, count(*) FILTER (WHERE production_status='PENDING_EDITOR_AND_LEGAL_REVIEW')::int staged FROM research_catalog_records`);
    add('runtime', 'Research import: 12 records in STAGING only', rs.rows[0].n === 12 && rs.rows[0].staged === 12 ? 'PASS' : 'FAIL', `${rs.rows[0].n} records, ${rs.rows[0].staged} pending editor/legal review (run npm run research:import)`);
    const ap = await pool.query(`SELECT (SELECT count(*)::int FROM government_sources WHERE access_policy='PERMITTED') s,(SELECT count(*)::int FROM scheme_versions WHERE verification_status='APPROVED') v`);
    add('runtime', 'Approved public catalog', 'INFO', `${ap.rows[0].s} permitted sources, ${ap.rows[0].v} approved scheme versions (0 is expected for the supervised demo)`);
  } catch (e) { add('runtime', 'Database reachable', 'FAIL', String(e.code || e.message)); }
  finally { await pool.end().catch(() => {}); }
}
async function probe(pathname, init) {
  try { const res = await fetch(BASE + pathname, {...init, signal: AbortSignal.timeout(5000)}); return {status: res.status, body: await res.json().catch(() => null)}; }
  catch (e) { return {status: 0, body: String(e.cause?.code || e.message)}; }
}
const status = await probe('/api/v1/public/status');
if (status.status === 0) add('runtime', `Backend API at ${BASE}`, 'NOT_VERIFIED', 'Server not running. Start `npm run dev` in another window and re-run.');
else {
  add('runtime', 'GET /api/v1/public/status', status.status === 200 ? 'PASS' : 'FAIL', `HTTP ${status.status} ${JSON.stringify(status.body)}`);
  const sch = await probe('/api/v1/public/schemes?limit=5');
  add('runtime', 'GET /api/v1/public/schemes', sch.status === 200 ? 'PASS' : 'FAIL', `HTTP ${sch.status} status=${sch.body?.status}`);
  const bad = await probe('/api/v1/public/schemes?limit=abc');
  add('runtime', 'Invalid filter -> 400 JSON', bad.status === 400 ? 'PASS' : 'FAIL', `HTTP ${bad.status}`);
  const priv = await probe('/api/v1/private/demo-farmer');
  add('runtime', 'Private API requires authentication', priv.status === 401 ? 'PASS' : 'FAIL', `HTTP ${priv.status}`);
  const nf = await probe('/api/v1/no-such-route');
  add('runtime', 'Unknown API path -> 404 JSON', nf.status === 404 ? 'PASS' : 'FAIL', `HTTP ${nf.status}`);
  const ask = await probe('/api/v1/public/assistant/ask', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({question: 'PMFBY claim kab milega?', language: 'hi'})});
  add('runtime', 'AI with zero approved sources -> honest NO_VERIFIED_SOURCES', ask.body?.status === 'NO_VERIFIED_SOURCES' ? 'PASS' : (ask.body?.status === 'ANSWERED' ? 'INFO' : 'FAIL'), `HTTP ${ask.status} ${ask.body?.status ?? ask.body?.error}`);
  const rp = await probe('/api/v1/internal/research-preview');
  add('runtime', 'Research preview (local only)', rp.status === 200 && rp.body?.verified === false && rp.body?.total === 12 ? 'PASS' : 'INFO', `HTTP ${rp.status} total=${rp.body?.total ?? '-'} verified=${rp.body?.verified ?? '-'}`);
}

// ---- Browser Demo Gate (human) ----
add('browserDemo', 'Supervised click-through of every P0 flow (docs/PHASE_14_HACKATHON_DEMO.md checklist)', 'MANUAL_REQUIRED',
  'This script cannot click through Chrome/Edge on your laptop. Tick the checklist personally before presenting.');

// ---- Government Live Data Gate ----
r = run(['run', 'pilot:preflight'], 120_000);
const blockers = (r.out.match(/"blockers":\s*\[([^\]]*)\]/)?.[1] ?? '').replace(/[\s"]/g, '');
add('governmentLiveData', 'Live official-source ingestion (pilot:preflight)', r.ok ? 'PASS' : 'BLOCKED', blockers ? `blockers: ${blockers}` : tail(r.out));
const key = (process.env.GEMINI_API_KEY ?? '').trim();
add('governmentLiveData', 'Server-side Gemini key configured', key && !/^(MY_|YOUR_|<)/i.test(key) ? 'CONFIGURED_NOT_EVALUATED' : 'BLOCKED', 'Grounded answers also need >=1 independently approved, permitted source');

const gateOk = list => list.every(c => ['PASS', 'INFO', 'WARN'].includes(c.status));
const summary = {
  codeQualityGate: gateOk(gates.codeQuality) ? 'PASS' : 'FAIL',
  runtimeGate: gates.runtime.some(c => c.status === 'NOT_VERIFIED') ? 'INCOMPLETE' : gateOk(gates.runtime) ? 'PASS' : 'FAIL',
  browserDemoGate: 'MANUAL_REQUIRED',
  governmentLiveDataGate: gates.governmentLiveData.every(c => c.status === 'PASS') ? 'PASS' : 'BLOCKED',
};
const supervisedDemo = summary.codeQualityGate === 'PASS' && summary.runtimeGate === 'PASS'
  ? 'CONDITIONAL GO — pending your browser checklist; live government data remains blocked and must be disclosed'
  : 'NO-GO until Code Quality and Runtime gates pass';
console.log(JSON.stringify({phase: '14', summary, decisions: {supervisedSihDemo: supervisedDemo, publicProductionDeployment: 'NO-GO'}, gates}, null, 2));
process.exitCode = summary.codeQualityGate === 'PASS' && summary.runtimeGate === 'PASS' ? 0 : 2;
