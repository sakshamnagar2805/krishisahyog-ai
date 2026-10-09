/** Phase 13C: non-destructive local readiness check. Does NOT submit any personal data. */
import {existsSync,statSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
dotenv.config({path:path.join(root,'.env.local'),quiet:true});
dotenv.config({path:path.join(root,'.env'),quiet:true});
const checks=[];
const add=(check,status,detail)=>checks.push({check,status,detail});
const nodeMajor=Number(process.versions.node.split('.')[0]);
add('Node.js 22 or newer',nodeMajor>=22?'PASS':'BLOCKED',`Current ${process.version}`);
const demoFlag=process.env.VITE_HACKATHON_DEMO_ENABLED==='true';
const previewFlag=process.env.RESEARCH_PREVIEW_ENABLED==='true';
const localDev=process.env.NODE_ENV!=='production';
add('Local synthetic farmer mode',demoFlag&&localDev?'PASS':'NOT_VERIFIED',demoFlag&&localDev?'Flag set: still requires a localhost DEV server':'For a supervised localhost demo, set VITE_HACKATHON_DEMO_ENABLED=true and leave NODE_ENV unset (never production)');
add('Research preview configuration',previewFlag&&localDev?'PASS':'NOT_VERIFIED',previewFlag&&localDev?'Local preview configured; database still requires validation':'Set RESEARCH_PREVIEW_ENABLED=true locally only');
let testPassed=false,typescriptPassed=false;
if(existsSync(path.join(root,'node_modules','typescript','lib','tsc.js'))){
 const r=spawnSync(process.execPath,['node_modules/typescript/lib/tsc.js','--noEmit'],{cwd:root,encoding:'utf8',timeout:60000});
 typescriptPassed=r.status===0;
 add('TypeScript noEmit',typescriptPassed?'PASS':'BLOCKED',typescriptPassed?'No type errors':(r.stderr||r.stdout||r.error?.message||'TypeScript failed').slice(-700));
}else add('TypeScript noEmit','BLOCKED','Run npm ci before checking');
const r=spawnSync(process.execPath,['--experimental-strip-types','--test','tests/phase13_workflow.test.mjs','tests/phase12_hackathon.test.mjs'],{cwd:root,encoding:'utf8',timeout:60000});
testPassed=r.status===0;
add('Phase 12 + Phase 13 regression tests',testPassed?'PASS':'BLOCKED',testPassed?'Workflow tests passed':(r.stderr||r.stdout||r.error?.message||'Tests failed').slice(-700));
const dist=path.join(root,'dist','index.html');
const buildPresent=existsSync(dist)&&statSync(dist).size>100;
add('Frontend build artifact',buildPresent?'PASS':'BLOCKED',buildPresent?'dist/index.html exists (browser smoke still needed)':'Run npm run build on Windows; do not treat TypeScript pass as a successful Vite build');
let apiReachable=false,authProtected=false,catalogAccessible=false;
try{
 const [status,auth,schemes]=await Promise.all([
  fetch('http://127.0.0.1:3000/api/v1/public/status',{signal:AbortSignal.timeout(4000)}),
  fetch('http://127.0.0.1:3000/api/v1/private/demo-farmer',{signal:AbortSignal.timeout(4000)}),
  fetch('http://127.0.0.1:3000/api/v1/public/schemes?limit=1',{signal:AbortSignal.timeout(4000)}),
 ]);
 apiReachable=status.status===200||status.status===503;
 authProtected=auth.status===401;
 catalogAccessible=schemes.status===200;
 add('Public backend reachable',apiReachable?'PASS':'BLOCKED',`/api/v1/public/status HTTP ${status.status}; 503 means no government database yet`);
 add('Private API authentication gate',authProtected?'PASS':'BLOCKED',`/api/v1/private/* HTTP ${auth.status}; expected 401`);
 add('Verified catalog query',catalogAccessible?'PASS':'BLOCKED',`/api/v1/public/schemes HTTP ${schemes.status}; 503 means no available database`);
}catch(e){add('Public backend reachable','BLOCKED',String(e));add('Private API authentication gate','NOT_VERIFIED','Backend unavailable');add('Verified catalog query','NOT_VERIFIED','Backend unavailable');}
const manualChecks=[
 'In Chrome/Edge at http://127.0.0.1:3000, show DEMO banner and synthetic farmer',
 'Dashboard -> PMFBY -> linked grievance -> Notifications -> reopen browser and verify persistence',
 'Document preparation: metadata-only note; missing/expired status unchanged and no official upload',
 'PACS form: save an enquiry; verify local history and owner ID',
 'Government Schemes: imported 12 research items show RESEARCH ONLY and official links',
 'Verified AI: with no approved sources, show honest refusal, not simulated citations',
 'Hindi text and mobile/tablet layout: check navigation and screens manually',
 'Production build with NODE_ENV=production must not enable DemoWorkspace',
 'Confirm no personal data or credentials are shown during demo'
];
const readyForSupervisedDemo=typescriptPassed&&testPassed&&buildPresent&&apiReachable&&authProtected&&catalogAccessible&&demoFlag&&previewFlag&&localDev;
console.log(JSON.stringify({phase:'13C',readyForSupervisedDemo,productionReady:false,liveGovernmentIntegrationVerified:false,browserFlowsVerified:false,checks,manualChecks},null,2));
if(!readyForSupervisedDemo)process.exitCode=2;
