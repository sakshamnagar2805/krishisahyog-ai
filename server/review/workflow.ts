import {randomUUID} from 'node:crypto';
import type {Pool, PoolClient} from 'pg';

export type ContentType='SCHEME_VERSION'|'POLICY_VERSION'|'RULE_VERSION';
export type ReviewAction='SUBMIT'|'APPROVE'|'REJECT'|'WITHDRAW';
export type ReviewRole='EDITOR'|'REVIEWER'|'ADMIN';
export interface ReviewActor {id:string; role:ReviewRole}
const table:Record<ContentType,string>={SCHEME_VERSION:'scheme_versions',POLICY_VERSION:'policy_versions',RULE_VERSION:'eligibility_rule_versions'};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function checkReviewRequest(contentType:string,contentId:string,action:string,actor:ReviewActor,reason?:string){
 if(!(contentType in table)||!uuid.test(contentId))throw new Error('INVALID_CONTENT');
 if(!['SUBMIT','APPROVE','REJECT','WITHDRAW'].includes(action))throw new Error('INVALID_ACTION');
 if(!actor.id?.trim()||!['EDITOR','REVIEWER','ADMIN'].includes(actor.role))throw new Error('UNAUTHORIZED');
 if(action==='SUBMIT'&&actor.role!=='EDITOR'&&actor.role!=='ADMIN')throw new Error('FORBIDDEN');
 if((action==='APPROVE'||action==='REJECT')&&actor.role!=='REVIEWER'&&actor.role!=='ADMIN')throw new Error('FORBIDDEN');
 if(action==='WITHDRAW'&&actor.role!=='ADMIN')throw new Error('FORBIDDEN');
 if(['REJECT','WITHDRAW'].includes(action)&&(!reason||reason.trim().length<10))throw new Error('REASON_REQUIRED');
 return table[contentType as ContentType];
}
async function ensureEvidence(client:PoolClient,type:ContentType,id:string){
 if(type==='RULE_VERSION'){
  const e=await client.query(`SELECT 1 FROM eligibility_rule_evidence ere JOIN policy_clauses pc ON pc.id=ere.clause_id JOIN policy_versions pv ON pv.id=pc.policy_version_id JOIN source_documents d ON d.id=pv.source_document_id JOIN government_sources gs ON gs.id=d.source_id WHERE ere.rule_id=$1 AND pv.verification_status='APPROVED' AND gs.access_policy='PERMITTED' LIMIT 1`,[id]);
  if(!e.rowCount)throw new Error('MISSING_APPROVED_RULE_EVIDENCE');
 }else{
  const tab=table[type];
  const e=await client.query(`SELECT 1 FROM ${tab} v JOIN source_documents d ON d.id=v.source_document_id JOIN government_sources gs ON gs.id=d.source_id WHERE v.id=$1 AND gs.access_policy='PERMITTED' AND d.sha256 IS NOT NULL LIMIT 1`,[id]);
  if(!e.rowCount)throw new Error('MISSING_APPROVED_SOURCE');
 }
}
/** Administrative service only. Do NOT expose to the public API without server-side authenticated RBAC. */
export async function applyReview(db:Pool,params:{contentType:ContentType;contentId:string;action:ReviewAction;actor:ReviewActor;reason?:string}){
 const {contentType,contentId,action,actor,reason}=params;
 const tab=checkReviewRequest(contentType,contentId,action,actor,reason);
 const client=await db.connect();
 try{
  await client.query('BEGIN');
  const record=await client.query(`SELECT verification_status,approved_by FROM ${tab} WHERE id=$1 FOR UPDATE`,[contentId]);
  if(record.rowCount!==1)throw new Error('NOT_FOUND');
  const prior=record.rows[0].verification_status as string;
  const transitions:Record<ReviewAction,[string[],string]>={SUBMIT:[['DRAFT','REJECTED'],'PENDING'],APPROVE:[['PENDING'],'APPROVED'],REJECT:[['PENDING'],'REJECTED'],WITHDRAW:[['APPROVED'],'SUPERSEDED']};
  const [allowed,next]=transitions[action];
  if(!allowed.includes(prior))throw new Error('INVALID_TRANSITION');
  if(action==='APPROVE'){
   const submit=await client.query(`SELECT actor_id FROM publication_events WHERE content_type=$1 AND content_id=$2 AND action='SUBMIT' ORDER BY created_at DESC LIMIT 1`,[contentType,contentId]);
   if(!submit.rowCount || submit.rows[0].actor_id===actor.id)throw new Error('REQUIRES_INDEPENDENT_REVIEW');
   await ensureEvidence(client,contentType,contentId);
  }
  if(action==='SUBMIT'){
   // Enforce that a candidate document exists for both scheme and policy versions.
   if(contentType!=='RULE_VERSION')await ensureEvidence(client,contentType,contentId);
  }
  if(action==='APPROVE')await client.query(`UPDATE ${tab} SET verification_status=$2,approved_by=$3,approved_at=now() WHERE id=$1`,[contentId,next,actor.id]);
  else await client.query(`UPDATE ${tab} SET verification_status=$2 WHERE id=$1`,[contentId,next]);
  if(action==='SUBMIT')await client.query(`INSERT INTO content_reviews(id,content_type,content_id,decision) VALUES($1,$2,$3,'PENDING')`,[randomUUID(),contentType,contentId]);
  if(action==='APPROVE'||action==='REJECT')await client.query(`UPDATE content_reviews SET decision=$3,reviewer=$4,reason=$5,reviewed_at=now() WHERE content_type=$1 AND content_id=$2 AND decision='PENDING'`,[contentType,contentId,action==='APPROVE'?'APPROVED':'REJECTED',actor.id,reason??null]);
  await client.query(`INSERT INTO publication_events(id,content_type,content_id,action,actor_id,reason,prior_status,next_status) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[randomUUID(),contentType,contentId,action,actor.id,reason??null,prior,next]);
  await client.query(`INSERT INTO audit_events(id,actor_type,actor_id,action,entity_type,entity_id,details) VALUES($1,'ADMIN',$2,$3,$4,$5,$6::jsonb)`,[randomUUID(),actor.id,`CONTENT_${action}`,contentType,contentId,JSON.stringify({prior,next,reason:reason??null})]);
  await client.query('COMMIT');return {contentType,contentId,prior,next};
 }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
}
