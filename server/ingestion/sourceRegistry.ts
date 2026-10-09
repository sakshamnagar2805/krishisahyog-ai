import {randomUUID} from 'node:crypto';
import {getPool} from '../db/pool';
import {validateOfficialUrl,type FetchMode} from './secureFetch';

export interface SourceApproval {
  authority:string;name:string;url:string;host:string;jurisdiction:string;method:FetchMode;
  reviewedBy:string;permissionEvidence:string;robotsEvidence:string;requestIntervalSeconds:number;
}
/** Administrative CLI operation only: never expose as an anonymous URL-taking HTTP endpoint. */
export async function registerApprovedSource(s:SourceApproval):Promise<string>{
  if(!s.reviewedBy.trim()||s.permissionEvidence.trim().length<20||s.robotsEvidence.trim().length<20)throw new Error('HUMAN_REVIEW_REQUIRED');
  if(!Number.isInteger(s.requestIntervalSeconds)||s.requestIntervalSeconds<3600)throw new Error('REQUEST_INTERVAL_TOO_SHORT');
  if(!['HTML','DOCUMENT','DATASET'].includes(s.method))throw new Error('UNSUPPORTED_COLLECTION_METHOD');
  const url=await validateOfficialUrl(s.url,s.host);
  const id=randomUUID();
  await getPool().query(`INSERT INTO government_sources
    (id,authority,name,canonical_url,verified_host,jurisdiction_code,access_policy,collection_method,license_or_permission_notes,status,robots_reviewed_at,permission_reviewed_at,reviewed_by,request_interval_seconds)
    VALUES($1,$2,$3,$4,$5,$6,'PERMITTED',$7,$8,'ACTIVE',now(),now(),$9,$10)`,
    [id,s.authority,s.name,url.toString(),url.hostname,s.jurisdiction,s.method,`Permission: ${s.permissionEvidence}\nRobots: ${s.robotsEvidence}`,s.reviewedBy,s.requestIntervalSeconds]);
  return id;
}
