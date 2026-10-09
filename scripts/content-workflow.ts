/** Local administrative tool, not a public API. Use different people for SUBMIT and APPROVE. */
import '../server/config/loadEnv';
import {readFile} from 'node:fs/promises';
import {getPool,closePool} from '../server/db/pool';
import {createDraft,type DraftInput} from '../server/publication/draft';
import {applyReview,type ContentType,type ReviewAction,type ReviewRole} from '../server/review/workflow';

async function main(){
 const [action,file]=process.argv.slice(2);
 if(!file||!['draft','submit','approve','reject','withdraw','documents'].includes(action))throw new Error('USAGE: npm run content:workflow -- <documents|draft|submit|approve|reject|withdraw> <json-file>');
 const data=JSON.parse(await readFile(file,'utf8'));
 const pool=getPool();
 if(action==='documents'){
  const r=await pool.query(`SELECT d.id,d.original_url,d.retrieved_at,s.authority,
    (SELECT count(*)::int FROM document_versions v JOIN extracted_passages p ON p.document_version_id=v.id WHERE v.document_id=d.id) AS passages
    FROM source_documents d JOIN government_sources s ON s.id=d.source_id WHERE s.access_policy='PERMITTED' AND d.access_status='PUBLIC' ORDER BY d.retrieved_at DESC LIMIT 30`);
  console.log(JSON.stringify(r.rows,null,2));return;
 }
 if(action==='draft'){console.log(JSON.stringify(await createDraft(pool,data as DraftInput),null,2));return;}
 const result=await applyReview(pool,{contentType:data.contentType as ContentType,contentId:data.contentId,action:action.toUpperCase() as ReviewAction,actor:{id:data.actorId,role:data.actorRole as ReviewRole},reason:data.reason});
 console.log(JSON.stringify(result,null,2));
}
main().catch(err=>{console.error('CONTENT_WORKFLOW_FAILED:',err instanceof Error?err.message:String(err));process.exitCode=1;}).finally(closePool);
