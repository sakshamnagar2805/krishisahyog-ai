/**
 * Phase 14: fail closed if a production bundle contains the synthetic demo workspace,
 * synthetic farmer fixtures, or the React development runtime.
 * Usage: node scripts/verify-production-bundle.mjs [distDir]
 */
import {existsSync, readdirSync, readFileSync, statSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const FORBIDDEN = [
  {id: 'REACT_DEV_RUNTIME', pattern: /\bjsxDEV\b/},
  {id: 'DEMO_WORKSPACE_BANNER', pattern: /HACKATHON DEMO\s*[—-]\s*SYNTHETIC FARMER DATA/},
  {id: 'SYNTHETIC_FARMER_ID', pattern: /DEMO-FRM-1001/},
  {id: 'DEMO_STORAGE_KEY', pattern: /krishisahyog:synthetic-local-demo/},
];

function listFiles(dir) {
  return readdirSync(dir).flatMap(name => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

export function verifyProductionBundle(distDir = 'dist') {
  const root = resolve(distDir);
  if (!existsSync(join(root, 'index.html'))) return {ok: false, distDir: root, problems: ['dist/index.html missing'], files: 0};
  const files = listFiles(root).filter(f => /\.(js|html|css|map)$/.test(f));
  const problems = [];
  for (const file of files) {
    if (/DemoWorkspace/i.test(file)) problems.push(`DEMO_CHUNK_EMITTED: ${file}`);
    const text = readFileSync(file, 'utf8');
    for (const rule of FORBIDDEN) if (rule.pattern.test(text)) problems.push(`${rule.id}: ${file}`);
  }
  return {ok: problems.length === 0, distDir: root, files: files.length, problems};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = verifyProductionBundle(process.argv[2] ?? 'dist');
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}
