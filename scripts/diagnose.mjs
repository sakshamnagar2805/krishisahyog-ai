/** Safe, zero-dependency local environment diagnostic. Never contacts government sources. */
import {existsSync,readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
// Phase 14: read the same ignored .env.local/.env files as the app (values already in the shell win).
// dotenv is optional so this diagnostic still runs before `npm ci`.
try{const dotenv=require('dotenv');const root=new URL('..',import.meta.url);
 dotenv.config({path:new URL('.env.local',root),quiet:true});dotenv.config({path:new URL('.env',root),quiet:true});}catch{/* dependencies not installed yet */}
const checks=[];
function check(name,ok,action){checks.push({check:name,status:ok?'PASS':'BLOCKED',action:ok?'':action});}
const major=Number(process.versions.node.split('.')[0]);
check('Node.js >=22',major>=22,'Install Node.js 22+');
const required=['tsx','typescript','vite','pg','express','@types/pg'];
for(const pkg of required){let found=false;try{require.resolve(`${pkg}/package.json`);found=true;}catch{}
  check(`Dependency: ${pkg}`,found,'Run npm ci with access to npm registry (do not commit node_modules)');}
check('DATABASE_URL configured',!!process.env.DATABASE_URL,'Set DATABASE_URL in an ignored .env file or secret manager');
check('Secure scraper egress confirmed',process.env.INGESTION_SECURE_EGRESS==='confirmed','Configure protected outbound networking and only then set INGESTION_SECURE_EGRESS=confirmed');
check('Schema migration files present',existsSync('server/db/migrations/0005_review_publication.sql'),'Restore database migrations');
const blockers=checks.filter(c=>c.status==='BLOCKED');
console.log(JSON.stringify({readyForLivePilot:blockers.length===0,checks,blockerCount:blockers.length},null,2));
if(blockers.length)process.exitCode=2;
