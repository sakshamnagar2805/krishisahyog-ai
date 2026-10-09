/** Administrative CLI. Requires explicit editor attestation, a real collected source and manual independent review. */
import '../server/config/loadEnv';
import {getPool,closePool} from '../server/db/pool';
import {createDraft} from '../server/publication/draft';
import {validateCandidateSource} from '../server/research/candidate';

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function main(){
 const [code,documentId,editorId,attestation]=process.argv.slice(2);
 if(!code||!uuid.test(documentId??'')||!editorId||attestation!=='--reviewed')
   throw new Error('USAGE: npm run research:to-draft -- <CODE> <COLLECTED-DOCUMENT-UUID> <EDITOR_ID> --reviewed');
 const pool=getPool();
 const data=await pool.query(`SELECT code,name,authority,summary,official_primary_source,official_secondary_source
   FROM research_catalog_records WHERE code=$1 AND production_status='PENDING_EDITOR_AND_LEGAL_REVIEW'`,[code]);
 if(data.rowCount!==1)throw new Error('RESEARCH_RECORD_NOT_FOUND');
 const r=data.rows[0];
 const evidence=await pool.query(`SELECT d.original_url,d.access_status,s.access_policy,s.status AS source_status,
     (SELECT count(*)::int FROM document_versions dv JOIN extracted_passages ep ON ep.document_version_id=dv.id WHERE dv.document_id=d.id AND length(trim(ep.original_text))>0) AS passages
   FROM source_documents d JOIN government_sources s ON s.id=d.source_id WHERE d.id=$1`,[documentId]);
 if(evidence.rowCount!==1)throw new Error('COLLECTED_DOCUMENT_NOT_FOUND');
 const d=evidence.rows[0];
 validateCandidateSource({researchPrimary:r.official_primary_source,researchSecondary:r.official_secondary_source,
  documentUrl:d.original_url,accessPolicy:d.access_policy,sourceStatus:d.source_status,documentAccess:d.access_status,passages:Number(d.passages)});
 const draft=await createDraft(pool,{kind:'SCHEME',sourceDocumentId:documentId,code:r.code,title:r.name,summary:r.summary,authority:r.authority,editorId});
 console.log(JSON.stringify({...draft,reviewWarning:'Draft only. Editor must check the exact claims in the linked document and an independent reviewer must approve before publication.'},null,2));
}
main().catch(err=>{console.error('RESEARCH_DRAFT_FAILED:',err instanceof Error?err.message:String(err));process.exitCode=1;}).finally(closePool);
