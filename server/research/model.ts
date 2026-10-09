/** Public government information RESEARCH only; never authorizes a scraper or approves a scheme. */
import {createHash} from 'node:crypto';

export const RESEARCH_STATUS='OFFICIAL_SOURCE_RESEARCHED_NOT_APPROVED_FOR_AUTO_PUBLICATION' as const;
export const PRODUCTION_STATUS='PENDING_EDITOR_AND_LEGAL_REVIEW' as const;
export type ResearchRecord={
 code:string;name:string;category:string;authority:string;geographic_scope:string;summary:string;
 eligibility_summary:string;farmer_action:string;official_primary_source:string;official_secondary_source:string;
 research_checked_on:string;research_status:typeof RESEARCH_STATUS;production_status:typeof PRODUCTION_STATUS;
 review_notes:string;personal_data_included:false;
};
export type ResearchDataset={dataset_name:string;dataset_version:string;purpose:string;records:ResearchRecord[];publication_rule:string};
const codePattern=/^[A-Z][A-Z0-9_-]{2,79}$/;
const datePattern=/^\d{4}-\d{2}-\d{2}$/;
function officialUrl(value:unknown):value is string {
 if(typeof value!=='string'||value.length>2048)return false;
 try {const u=new URL(value);return u.protocol==='https:'&&u.username===''&&u.password===''&&!!u.hostname&&u.hostname!=='localhost'&&!u.hostname.endsWith('.localhost');}
 catch{return false;}
}
function nonEmpty(value:unknown,max=10000):value is string{return typeof value==='string'&&value.trim().length>0&&value.length<=max;}
/** Validate and reject review-only content that claims to be published or contains personal information. */
export function validateResearchDataset(raw:unknown):ResearchDataset {
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('RESEARCH_DATASET_INVALID');
 const data=raw as Record<string,unknown>;
 if(!nonEmpty(data.dataset_name,300)||!nonEmpty(data.dataset_version,120)||!nonEmpty(data.purpose,1000)||!nonEmpty(data.publication_rule,1000)
   ||!Array.isArray(data.records)||data.records.length<1||data.records.length>1000)throw new Error('RESEARCH_DATASET_INVALID');
 const codes=new Set<string>();
 const fields=new Set(['code','name','category','authority','geographic_scope','summary','eligibility_summary','farmer_action','official_primary_source','official_secondary_source','research_checked_on','research_status','production_status','review_notes','personal_data_included']);
 const records=data.records.map((rawRecord:unknown,index:number):ResearchRecord=>{
   if(!rawRecord||typeof rawRecord!=='object'||Array.isArray(rawRecord))throw new Error(`RECORD_${index}_INVALID`);
   const r=rawRecord as Record<string,unknown>;
   if(Object.keys(r).some(k=>!fields.has(k)))throw new Error(`RECORD_${index}_UNEXPECTED_FIELD`);
   if(typeof r.code!=='string'||!codePattern.test(r.code)||codes.has(r.code))throw new Error(`RECORD_${index}_INVALID_OR_DUPLICATE_CODE`);
   codes.add(r.code);
   for(const field of ['name','category','authority','geographic_scope','summary','eligibility_summary','farmer_action','review_notes'] as const)
     if(!nonEmpty(r[field],field==='summary'?4000:1500))throw new Error(`RECORD_${index}_${field.toUpperCase()}_MISSING`);
   if(!officialUrl(r.official_primary_source)||!officialUrl(r.official_secondary_source))throw new Error(`RECORD_${index}_INVALID_URL`);
   if(typeof r.research_checked_on!=='string'||!datePattern.test(r.research_checked_on)||!Number.isFinite(Date.parse(r.research_checked_on))||new Date(r.research_checked_on).toISOString().slice(0,10)!==r.research_checked_on)throw new Error(`RECORD_${index}_INVALID_DATE`);
   if(r.research_status!==RESEARCH_STATUS||r.production_status!==PRODUCTION_STATUS||r.personal_data_included!==false)throw new Error(`RECORD_${index}_UNAPPROVED_OR_PERSONAL`);
   return r as ResearchRecord;
 });
 return {...(data as unknown as ResearchDataset),records};
}
export function recordHash(record:ResearchRecord):string{return createHash('sha256').update(JSON.stringify(record)).digest('hex');}
export function datasetHash(data:ResearchDataset):string{return createHash('sha256').update(JSON.stringify(data)).digest('hex');}
export function recordForPreview(record:ResearchRecord){return {
  code:record.code,name:record.name,category:record.category,authority:record.authority,
  geographicScope:record.geographic_scope,summary:record.summary,eligibilitySummary:record.eligibility_summary,
  farmerAction:record.farmer_action,sourceUrl:record.official_primary_source,secondaryUrl:record.official_secondary_source,
  checkedOn:record.research_checked_on,reviewNotes:record.review_notes,
  verificationStatus:'RESEARCH_ONLY_NOT_APPROVED' as const,eligibilityStatus:'NOT_EVALUATED' as const,
};}
