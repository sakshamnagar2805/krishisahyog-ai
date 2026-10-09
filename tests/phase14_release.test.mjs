/**
 * Phase 14 release-hardening regression tests.
 *  - Runs without a database by default.
 *  - Set TEST_DATABASE_URL to a DISPOSABLE, already-migrated PostgreSQL database to also run the
 *    approval -> publication -> grounded-answer integration test. That test inserts a clearly
 *    labelled TEST FIXTURE (example.gov.test) and deletes it afterwards. Never point it at a real DB.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {tsImport} from 'tsx/esm/api';
import {LocalDemoWorkflow, DEMO_STORAGE_KEY, createSeed} from '../src/demo/workflow.ts';
import {isLocalPreviewAllowed, isDirectLoopbackRequest} from '../server/research/access.ts';
import {verifyProductionBundle} from '../scripts/verify-production-bundle.mjs';

const read = p => readFileSync(new URL(p, import.meta.url), 'utf8');
const load = p => tsImport(p, import.meta.url);

/** Serve the API exactly the way Vite does: a plain connect-style chain, no express app around it. */
async function startConnectStyleServer(middleware) {
  const server = http.createServer((req, res) => middleware(req, res, err => {
    res.statusCode = err ? 500 : 299;
    res.setHeader('content-type', 'text/plain');
    res.end(err ? 'connect-error' : `fallthrough:${Object.getPrototypeOf(req) === http.IncomingMessage.prototype}:${Object.getPrototypeOf(res) === http.ServerResponse.prototype}`);
  }));
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  return {server, base: `http://127.0.0.1:${server.address().port}`};
}
async function call(base, path, init = {}) {
  const res = await fetch(base + path, init);
  const text = await res.text();
  let body; try { body = JSON.parse(text); } catch { body = text; }
  return {status: res.status, body, headers: res.headers};
}

test('14A P0: API routers survive a connect (Vite) mount and return JSON error semantics without a database', async () => {
  const saved = process.env.DATABASE_URL;
  process.env.DATABASE_URL = '';
  const {createApiApp, toConnectMiddleware} = await load('../server/http/apiApp.ts');
  const {server, base} = await startConnectStyleServer(toConnectMiddleware(createApiApp({includeResearchPreview: true})));
  try {
    const status = await call(base, '/api/v1/public/status');
    assert.equal(status.status, 503); assert.equal(status.body.status, 'NOT_CONFIGURED');
    const schemes = await call(base, '/api/v1/public/schemes?limit=20&offset=0');
    assert.equal(schemes.status, 503); assert.deepEqual(schemes.body.items, []);
    assert.equal((await call(base, '/api/v1/public/schemes?limit=abc')).body.error, 'INVALID_FILTER');
    assert.equal((await call(base, '/api/v1/public/policies?limit=101')).status, 400);
    assert.equal((await call(base, '/api/v1/public/scheme-discovery?landAreaHectares=x')).body.error, 'INVALID_LAND_AREA');
    const json = {'content-type': 'application/json'};
    const bad = await call(base, '/api/v1/public/assistant/ask', {method: 'POST', headers: json, body: '{bad'});
    assert.equal(bad.status, 400); assert.equal(bad.body.error, 'INVALID_JSON');
    assert.doesNotMatch(JSON.stringify(bad.body), /at |node_modules|SyntaxError/);
    const big = await call(base, '/api/v1/public/assistant/ask', {method: 'POST', headers: json, body: JSON.stringify({question: 'a'.repeat(9000)})});
    assert.equal(big.status, 413);
    assert.equal((await call(base, '/api/v1/public/assistant/ask', {method: 'POST', headers: json, body: JSON.stringify({question: 'x', language: 'fr'})})).body.error, 'INVALID_LANGUAGE');
    const noDb = await call(base, '/api/v1/public/assistant/ask', {method: 'POST', headers: json, body: JSON.stringify({question: 'PMFBY premium kya hai?', language: 'hi'})});
    assert.equal(noDb.status, 503); assert.equal(noDb.body.error, 'VERIFIED_ASSISTANCE_UNAVAILABLE');
    assert.equal((await call(base, '/api/v1/private/demo-farmer')).status, 401);
    assert.equal((await call(base, '/api/v1/admin/sources')).status, 401);
    const unknown = await call(base, '/api/v1/not-a-route');
    assert.equal(unknown.status, 404); assert.equal(unknown.body.error, 'NOT_FOUND');
    assert.equal(unknown.headers.get('x-powered-by'), null);
    assert.equal(unknown.headers.get('x-content-type-options'), 'nosniff');
    // Research preview stays hidden unless explicitly enabled (flag is unset in this test process).
    const savedFlag = process.env.RESEARCH_PREVIEW_ENABLED; delete process.env.RESEARCH_PREVIEW_ENABLED;
    assert.equal((await call(base, '/api/v1/internal/research-preview')).status, 404);
    if (savedFlag !== undefined) process.env.RESEARCH_PREVIEW_ENABLED = savedFlag;
    // Non-API requests reach the next (Vite) middleware with the original prototypes restored.
    const page = await call(base, '/');
    assert.equal(page.status, 299); assert.equal(page.body, 'fallthrough:true:true');
  } finally {
    server.close();
    if (saved === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = saved;
  }
});

test('14A: vite dev/preview servers mount the API through the express application wrapper', () => {
  const config = read('../vite.config.ts');
  assert.match(config, /toConnectMiddleware\(createApiApp\(/);
  assert.doesNotMatch(config, /server\.middlewares\.use\(api\)/);
  assert.match(read('../server/index.ts'), /createApiApp\(/);
});

test('14C: research preview requires a direct loopback request (no proxy headers, loopback Host)', () => {
  const env = {NODE_ENV: 'development', RESEARCH_PREVIEW_ENABLED: 'true'};
  assert.equal(isLocalPreviewAllowed(env, '127.0.0.1', {host: '127.0.0.1:3000'}), true);
  assert.equal(isLocalPreviewAllowed(env, '::1', {host: '[::1]:3000'}), true);
  assert.equal(isLocalPreviewAllowed(env, '127.0.0.1', {host: 'localhost:3000', 'x-forwarded-for': '203.0.113.9'}), false);
  assert.equal(isLocalPreviewAllowed(env, '127.0.0.1', {host: 'localhost', forwarded: 'for=203.0.113.9'}), false);
  assert.equal(isLocalPreviewAllowed(env, '127.0.0.1', {host: 'attacker.example:3000'}), false, 'DNS rebinding Host');
  assert.equal(isLocalPreviewAllowed(env, '127.0.0.1', {}), false, 'missing Host');
  assert.equal(isLocalPreviewAllowed({...env, NODE_ENV: 'production'}, '127.0.0.1', {host: 'localhost'}), false);
  assert.equal(isDirectLoopbackRequest({host: 'localhost.attacker.example'}), false);
  assert.match(read('../server/research/previewApi.ts'), /isLocalPreviewAllowed\(process\.env,req\.socket\.remoteAddress,req\.headers\)/);
});

test('14C: production bundles compile the synthetic demo out and are verified', () => {
  const app = read('../src/App.tsx');
  assert.match(app, /const DemoWorkspace = import\.meta\.env\.DEV \? lazy\(/);
  assert.match(app, /demoEnabled && DemoWorkspace !== null/);
  const pkg = JSON.parse(read('../package.json'));
  assert.equal(pkg.scripts.build, 'node scripts/build-production.mjs');
  assert.match(read('../scripts/build-production.mjs'), /process\.env\.NODE_ENV = 'production';[\s\S]*await import\('vite'\)/);
  assert.doesNotMatch(read('../.env.example'), /^NODE_ENV=/m, '.env.example must not set NODE_ENV (it turns vite build into a dev build)');
});

test('14C: bundle verifier rejects demo chunks, synthetic IDs and the React dev runtime', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ks-bundle-'));
  try {
    mkdirSync(join(dir, 'assets'));
    writeFileSync(join(dir, 'index.html'), '<div id="root"></div>');
    writeFileSync(join(dir, 'assets', 'index-abc.js'), 'console.log("public mode")');
    assert.equal(verifyProductionBundle(dir).ok, true);
    writeFileSync(join(dir, 'assets', 'DemoWorkspace-x.js'), 'const id="DEMO-FRM-1001";');
    writeFileSync(join(dir, 'assets', 'index-def.js'), 'jsxDEV(App)');
    const result = verifyProductionBundle(dir);
    assert.equal(result.ok, false);
    assert.ok(result.problems.some(p => p.startsWith('DEMO_CHUNK_EMITTED')));
    assert.ok(result.problems.some(p => p.startsWith('SYNTHETIC_FARMER_ID')));
    assert.ok(result.problems.some(p => p.startsWith('REACT_DEV_RUNTIME')));
  } finally { rmSync(dir, {recursive: true, force: true}); }
});

test('14B: corrupt or foreign saved demo state falls back to the seed; reset clears only the demo key', () => {
  const store = new Map([['unrelated-app-key', 'keep-me']]);
  const storage = {getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k)};
  const seed = createSeed();
  const bad = [
    '{not json',
    JSON.stringify({...seed, schemaVersion: 2}),
    JSON.stringify({...seed, farmer: {...seed.farmer, id: 'REAL-FARMER-1'}}),
    JSON.stringify({...seed, claims: [{...seed.claims[0], isDemo: false}]}),
    JSON.stringify({...seed, grievances: [{...seed.grievances[0], farmerId: 'SOMEONE-ELSE'}]}),
    JSON.stringify({...seed, notifications: Array.from({length: 76}, (_, i) => ({isDemo: true, id: `N${i}`}))}),
    'x'.repeat(600_000),
  ];
  for (const raw of bad) {
    store.set(DEMO_STORAGE_KEY, raw);
    assert.deepEqual(new LocalDemoWorkflow(storage).snapshot(), seed);
  }
  const wf = new LocalDemoWorkflow(storage, () => new Date('2026-10-09T06:00:00Z'));
  wf.createGrievance('Documents', 'Missing land record', 'Synthetic note for a demo grievance');
  assert.ok(store.has(DEMO_STORAGE_KEY));
  wf.reset();
  assert.equal(store.has(DEMO_STORAGE_KEY), false);
  assert.equal(store.get('unrelated-app-key'), 'keep-me');
});

test('14B: a render crash inside the demo offers a demo-only reset instead of an endless reload', () => {
  const ws = read('../src/demo/DemoWorkspace.tsx');
  assert.match(ws, /<ErrorBoundary onReset=\{resetBrokenDemoState\}/);
  assert.match(ws, /function resetBrokenDemoState\(\)\{\n try\{window\.localStorage\.removeItem\(DEMO_STORAGE_KEY\);\}/);
  assert.doesNotMatch(ws, /localStorage\.clear\(\)/);
});

test('14C: staged research links render only for https URLs', () => {
  const panel = read('../src/components/public/ResearchPreviewPanel.tsx');
  assert.match(panel, /const isHttps=/);
  assert.match(panel, /isHttps\(item\.sourceUrl\)\?<a/);
  assert.match(panel, /isHttps\(item\.secondaryUrl\)&&/);
});

test('14B: grounded answers require valid citations; research-only records are never evidence', async () => {
  const {answerGrounded} = await load('../server/assistant/grounded.ts');
  const approved = {id: randomUUID(), code: 'TEST_FIXTURE_SCHEME', title: 'Test fixture scheme', summary: 'Fixture excerpt: farmers may apply through the district office.', version: 1,
    effectiveFrom: null, effectiveTo: null, verificationStatus: 'VERIFIED', authority: 'Test authority', officialUrl: 'https://example.gov.test/doc',
    retrievedAt: '2026-10-09T00:00:00.000Z', publishedAt: null, evidence: {sourceId: 's', sourceUrl: 'https://example.gov.test/doc', documentId: 'd', retrievedAt: '2026-10-09T00:00:00.000Z', publishedAt: null, sha256: 'a'.repeat(64)}};
  const repo = items => ({listPublished: async (kind) => ({status: 'AVAILABLE', items: kind === 'schemes' ? items : [], total: items.length})});
  let called = 0;
  const empty = await answerGrounded(repo([]), 'What is the PMFBY premium?', 'en', async () => { called++; return 'x [1]'; });
  assert.equal(empty.status, 'NO_VERIFIED_SOURCES'); assert.equal(called, 0, 'model must not be called without approved sources');
  const hindiEmpty = await answerGrounded(repo([]), 'फसल बीमा कैसे मिलेगा?', 'hi', async () => 'x');
  assert.match(hindiEmpty.answer, /सत्यापित/);
  const ok = await answerGrounded(repo([approved]), 'How do I apply for the test fixture scheme?', 'en', async () => 'Apply through the district office [1].');
  assert.equal(ok.status, 'ANSWERED'); assert.equal(ok.sources[0].url, 'https://example.gov.test/doc');
  assert.equal(ok.eligibility, 'NOT_ASSESSED'); assert.equal(ok.officialStatus, 'NOT_CHECKED');
  for (const output of ['You get a 50% subsidy.', 'See source [7].', '', 'x'.repeat(4600) + ' [1]']) {
    const r = await answerGrounded(repo([approved]), 'How do I apply for the test fixture scheme?', 'en', async () => output);
    assert.equal(r.status, 'NO_VERIFIED_SOURCES', `uncited or invalid output must be refused: ${output.slice(0, 30)}`);
  }
  assert.doesNotMatch(read('../server/assistant/grounded.ts'), /research_catalog_records/);
});

const TEST_DB = process.env.TEST_DATABASE_URL;
test('14A/14B DB: independent review gates publication; approved fixture is served and cited; research stays staged',
  {skip: TEST_DB ? false : 'set TEST_DATABASE_URL to a disposable migrated database to run'}, async () => {
  const pg = (await import('pg')).default;
  const pool = new pg.Pool({connectionString: TEST_DB, max: 3});
  const {applyReview} = await load('../server/review/workflow.ts');
  const {PublicContentRepository} = await load('../server/publicContent/repository.ts');
  const {answerGrounded} = await load('../server/assistant/grounded.ts');
  const ids = {source: randomUUID(), doc: randomUUID(), scheme: randomUUID(), version: randomUUID()};
  const code = `TEST_FIXTURE_${Date.now()}`;
  try {
    const before = await pool.query('SELECT count(*)::int n FROM research_catalog_records');
    await pool.query(`INSERT INTO government_sources(id,authority,name,canonical_url,verified_host,access_policy,collection_method,license_or_permission_notes,permission_reviewed_at,reviewed_by,robots_reviewed_at)
      VALUES($1,'TEST FIXTURE AUTHORITY','TEST FIXTURE — not a government source',$2,'example.gov.test','PERMITTED','DOCUMENT','Automated test fixture only',now(),'test-permission-reviewer',now())`, [ids.source, `https://example.gov.test/${ids.source}`]);
    await pool.query(`INSERT INTO source_documents(id,source_id,original_url,title,document_type,retrieved_at,sha256) VALUES($1,$2,$3,'TEST FIXTURE document','GUIDELINE',now(),$4)`,
      [ids.doc, ids.source, `https://example.gov.test/${ids.source}/doc.pdf`, 'b'.repeat(64)]);
    await pool.query(`INSERT INTO schemes(id,scheme_code,canonical_name,authority) VALUES($1,$2,'TEST FIXTURE irrigation scheme','TEST FIXTURE AUTHORITY')`, [ids.scheme, code]);
    await pool.query(`INSERT INTO scheme_versions(id,scheme_id,version,title_i18n,summary_i18n,verification_status,source_document_id) VALUES($1,$2,1,$3,$4,'DRAFT',$5)`,
      [ids.version, ids.scheme, {en: 'TEST FIXTURE irrigation scheme'}, {en: 'Test fixture excerpt: irrigation support applications are accepted at the district agriculture office.'}, ids.doc]);
    const repo = new PublicContentRepository(pool);
    assert.equal((await repo.listPublished('schemes', new Date(), 100, 0, {search: code})).total, 0, 'draft must not be public');
    await applyReview(pool, {contentType: 'SCHEME_VERSION', contentId: ids.version, action: 'SUBMIT', actor: {id: 'editor-a', role: 'EDITOR'}});
    await assert.rejects(applyReview(pool, {contentType: 'SCHEME_VERSION', contentId: ids.version, action: 'APPROVE', actor: {id: 'editor-a', role: 'ADMIN'}}), /REQUIRES_INDEPENDENT_REVIEW/);
    await assert.rejects(applyReview(pool, {contentType: 'SCHEME_VERSION', contentId: ids.version, action: 'APPROVE', actor: {id: 'editor-b', role: 'EDITOR'}}), /FORBIDDEN/);
    assert.equal((await repo.listPublished('schemes', new Date(), 100, 0, {search: code})).total, 0, 'pending must not be public');
    await applyReview(pool, {contentType: 'SCHEME_VERSION', contentId: ids.version, action: 'APPROVE', actor: {id: 'reviewer-b', role: 'REVIEWER'}});
    await assert.rejects(applyReview(pool, {contentType: 'SCHEME_VERSION', contentId: ids.version, action: 'APPROVE', actor: {id: 'reviewer-c', role: 'REVIEWER'}}), /INVALID_TRANSITION/, 'no duplicate approval');
    const published = await repo.listPublished('schemes', new Date(), 100, 0, {search: code});
    assert.equal(published.total, 1); assert.equal(published.items[0].verificationStatus, 'VERIFIED');
    assert.match(published.items[0].officialUrl, /^https:\/\/example\.gov\.test\//);
    const events = await pool.query(`SELECT action,actor_id FROM publication_events WHERE content_id=$1 ORDER BY created_at`, [ids.version]);
    assert.deepEqual(events.rows.map(r => r.action), ['SUBMIT', 'APPROVE']);
    const answer = await answerGrounded(repo, 'Where are TEST FIXTURE irrigation scheme applications accepted?', 'en', async (_i, prompt) => {
      assert.match(prompt, /district agriculture office/); assert.doesNotMatch(prompt, /RESEARCH_ONLY|research_status/);
      return 'Applications are accepted at the district agriculture office [1].';
    }, code);
    assert.equal(answer.status, 'ANSWERED');
    assert.ok(answer.sources.some(s => s.title === 'TEST FIXTURE irrigation scheme'));
    const research = await pool.query('SELECT code FROM research_catalog_records');
    for (const s of answer.sources) assert.ok(!research.rows.some(r => s.title.includes(r.code)), 'research record used as citation');
    assert.equal((await pool.query('SELECT count(*)::int n FROM research_catalog_records')).rows[0].n, before.rows[0].n);
  } finally {
    await pool.query('DELETE FROM audit_events WHERE entity_id=$1', [ids.version]).catch(() => {});
    await pool.query('DELETE FROM publication_events WHERE content_id=$1', [ids.version]).catch(() => {});
    await pool.query('DELETE FROM content_reviews WHERE content_id=$1', [ids.version]).catch(() => {});
    await pool.query('DELETE FROM scheme_versions WHERE id=$1', [ids.version]).catch(() => {});
    await pool.query('DELETE FROM schemes WHERE id=$1', [ids.scheme]).catch(() => {});
    await pool.query('DELETE FROM source_documents WHERE id=$1', [ids.doc]).catch(() => {});
    await pool.query('DELETE FROM government_sources WHERE id=$1', [ids.source]).catch(() => {});
    await pool.end();
  }
});

test('14B: notifications toggle read/unread and the header/sidebar badges use the same synthetic list', () => {
  const store = new Map();
  const storage = {getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k)};
  const wf = new LocalDemoWorkflow(storage);
  const first = wf.snapshot().notifications[0];
  const initial = first.read;
  assert.equal(wf.toggleNotificationRead(first.id), !initial);
  assert.equal(new LocalDemoWorkflow(storage).snapshot().notifications[0].read, !initial, 'persists across reload');
  assert.equal(wf.toggleNotificationRead(first.id), initial);
  assert.throws(() => wf.toggleNotificationRead('missing'), /not found/);
  const app = read('../src/App.tsx');
  assert.match(app, /notifications=\{demoEnabled \? demoNotifications : \[\]\}/);
  assert.match(app, /unreadNotifications=\{demoEnabled \? demoNotifications\.filter\(n => !n\.read\)\.length : 0\}/);
  assert.match(read('../src/demo/DemoWorkspace.tsx'), /store\.toggleNotificationRead\(id\)/);
});

test('14B: simulated PACS collection slip is explicitly not a valid godown token', () => {
  assert.match(read('../src/pages/PACSServicesPage.tsx'), /pacs\.isDemo \? "Demo collection slip — not valid at any PACS godown"/);
});

test('14A P0: the PostgreSQL pool survives idle-client errors (DB restart) instead of crashing the server', async () => {
  const saved = process.env.DATABASE_URL;
  process.env.DATABASE_URL = 'postgresql://nobody:none@127.0.0.1:1/never_connected';
  const {getPool, closePool} = await load('../server/db/pool.ts');
  try {
    const pool = getPool(); // constructing a Pool does not connect
    assert.ok(pool.listenerCount('error') >= 1, 'pool must have an error listener');
    const original = console.error; let logged = '';
    console.error = (...a) => { logged = a.join(' '); };
    try { assert.doesNotThrow(() => pool.emit('error', Object.assign(new Error('terminating connection due to administrator command'), {code: '57P01'}))); }
    finally { console.error = original; }
    assert.match(logged, /57P01/);
    assert.doesNotMatch(logged, /nobody|none@/, 'connection string must not be logged');
  } finally {
    await closePool();
    if (saved === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = saved;
  }
});

test('14C: anonymous AI endpoint is rate limited and Gemini calls have a timeout', async () => {
  const {createFixedWindowLimiter, GEMINI_TIMEOUT_MS} = await load('../server/assistant/groundedApi.ts');
  let t = 0; const allow = createFixedWindowLimiter(3, 60_000, () => t);
  assert.deepEqual([allow('a'), allow('a'), allow('a'), allow('a'), allow('b')], [true, true, true, false, true]);
  t = 60_000; assert.equal(allow('a'), true, 'window resets');
  assert.ok(GEMINI_TIMEOUT_MS > 0 && GEMINI_TIMEOUT_MS <= 30_000);
  const src = read('../server/assistant/groundedApi.ts');
  assert.match(src, /httpOptions:\{timeout:GEMINI_TIMEOUT_MS\}/);
  assert.match(src, /status\(429\)\.json\(\{error:'RATE_LIMITED'/);
});

test('14C: temperature is only sent to Gemini 1.x/2.x models (Gemini 3.6+ deprecates sampling params)', async () => {
  const {supportsSamplingParams} = await load('../server/assistant/groundedApi.ts');
  assert.equal(supportsSamplingParams('gemini-2.5-flash'), true);
  assert.equal(supportsSamplingParams('gemini-3.8-flash'), false);
  assert.equal(supportsSamplingParams('gemini-3.6-flash'), false);
  assert.equal(supportsSamplingParams(' Gemini-4-pro '), false);
});
