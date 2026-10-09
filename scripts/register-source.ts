/** Admin-only CLI: register one independently reviewed public government source. */
import '../server/config/loadEnv';
import {readFile} from 'node:fs/promises';
import {registerApprovedSource, type SourceApproval} from '../server/ingestion/sourceRegistry';
import {closePool} from '../server/db/pool';

async function main(){
  const file=process.argv[2];
  if(!file)throw new Error('USAGE: npm run source:register -- ./source-review.json');
  const input=JSON.parse(await readFile(file,'utf8')) as SourceApproval;
  if(!input || typeof input!=='object')throw new Error('INVALID_SOURCE_REVIEW_FILE');
  const mandatory=['authority','name','url','host','jurisdiction','method','reviewedBy','permissionEvidence','robotsEvidence'] as const;
  for(const field of mandatory){if(typeof input[field]!=='string'||!input[field].trim())throw new Error(`MISSING_${field.toUpperCase()}`);}
  if(!Number.isInteger(input.requestIntervalSeconds))throw new Error('INVALID_REQUEST_INTERVAL');
  const id=await registerApprovedSource(input);
  console.log(JSON.stringify({registered:true,id,url:input.url,reviewedBy:input.reviewedBy},null,2));
}
main().catch(e=>{console.error('SOURCE_REGISTRATION_FAILED:',e instanceof Error?e.message:String(e));process.exitCode=1;}).finally(closePool);
