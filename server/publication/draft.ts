import {randomUUID} from 'node:crypto';
import type {Pool} from 'pg';

export interface DraftInput {
 kind:'SCHEME'|'POLICY';sourceDocumentId:string;code:string;title:string;summary:string;
 authority:string;editorId:string;policyType?:string;effectiveFrom?:string;
}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const code=/^[A-Z][A-Z0-9_-]{2,79}$/;
export function validateDraft(input:DraftInput){
 if(!['SCHEME','POLICY'].includes(input.kind)||!uuid.test(input.sourceDocumentId)||!code.test(input.code))throw new Error('INVALID_DRAFT_IDENTITY');
 for(const v of [input.title,input.summary,input.authority,input.editorId])if(typeof v!=='string'||v.trim().length<3)throw new Error('INCOMPLETE_DRAFT');
 if(input.summary.length>10000||input.title.length>500)throw new Error('DRAFT_TOO_LONG');
 if(input.kind==='POLICY'&&(!input.policyType||input.policyType.trim().length<3))throw new Error('POLICY_TYPE_REQUIRED');
 if(input.effectiveFrom && !/^\d{4}-\d{2}-\d{2}$/.test(input.effectiveFrom))throw new Error('INVALID_EFFECTIVE_DATE');
}
/** Local administrative import. Never publishes data: all versions start as DRAFT. */
export async function createDraft(pool:Pool,input:DraftInput){
 validateDraft(input);const db=await pool.connect();
 try{
  await db.query('BEGIN');
  const evidence=await db.query(`SELECT d.id FROM source_documents d JOIN government_sources s ON s.id=d.source_id
   WHERE d.id=$1 AND s.access_policy='PERMITTED' AND s.status='ACTIVE' AND d.access_status='PUBLIC'
   AND EXISTS(SELECT 1 FROM document_versions dv JOIN extracted_passages ep ON ep.document_version_id=dv.id WHERE dv.document_id=d.id AND length(trim(ep.original_text))>0)
   FOR UPDATE OF d`,[input.sourceDocumentId]);
  if(evidence.rowCount!==1)throw new Error('SOURCE_DOCUMENT_NOT_REVIEWABLE');
  const isScheme=input.kind==='SCHEME',base=isScheme?'schemes':'policies',ver=isScheme?'scheme_versions':'policy_versions';
  const key=isScheme?'scheme_code':'policy_code',fk=isScheme?'scheme_id':'policy_id';
  const row=await db.query<{id:string}>(`SELECT id FROM ${base} WHERE ${key}=$1 FOR UPDATE`,[input.code]);
  let id=row.rows[0]?.id;
  if(!id){id=randomUUID();
   if(isScheme)await db.query(`INSERT INTO schemes(id,scheme_code,canonical_name,authority) VALUES($1,$2,$3,$4)`,[id,input.code,input.title,input.authority]);
   else await db.query(`INSERT INTO policies(id,policy_code,canonical_name,policy_type,authority) VALUES($1,$2,$3,$4,$5)`,[id,input.code,input.title,input.policyType,input.authority]);
  }
  const next=await db.query<{next:number}>(`SELECT COALESCE(MAX(version),0)+1 AS next FROM ${ver} WHERE ${fk}=$1`,[id]);
  const versionId=randomUUID();
  await db.query(`INSERT INTO ${ver}(id,${fk},version,title_i18n,summary_i18n,verification_status,source_document_id,effective_from)
  VALUES($1,$2,$3,$4::jsonb,$5::jsonb,'DRAFT',$6,$7)`,[versionId,id,Number(next.rows[0].next),JSON.stringify({en:input.title}),JSON.stringify({en:input.summary}),input.sourceDocumentId,input.effectiveFrom??null]);
  await db.query(`INSERT INTO audit_events(id,actor_type,actor_id,action,entity_type,entity_id,details) VALUES($1,'ADMIN',$2,'CONTENT_DRAFT_CREATED',$3,$4,$5::jsonb)`,[randomUUID(),input.editorId,isScheme?'SCHEME_VERSION':'POLICY_VERSION',versionId,JSON.stringify({code:input.code,sourceDocumentId:input.sourceDocumentId})]);
  await db.query('COMMIT');return {id:versionId,code:input.code,version:Number(next.rows[0].next),status:'DRAFT',contentType:isScheme?'SCHEME_VERSION':'POLICY_VERSION'};
 }catch(e){await db.query('ROLLBACK');throw e;}finally{db.release();}
}
