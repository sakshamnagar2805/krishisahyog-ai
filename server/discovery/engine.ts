/** Public, anonymous discovery. Relevance and preliminary eligibility are distinct. */
export type DiscoveryQuery = {search?:string;state?:string;district?:string;crop?:string;need?:string; landAreaHectares?:number};
export type SchemeCandidate = {id:string;code:string;title:string;summary:string;officialUrl:string;verificationStatus:string; evidence:unknown; effectiveFrom:string|null;effectiveTo:string|null};
export type DiscoveryResult = SchemeCandidate & {relevance:{score:number;reasons:string[]};eligibility:{status:'RULES_UNAVAILABLE'|'MORE_INFO_REQUIRED'|'POTENTIALLY_ELIGIBLE'|'NOT_ELIGIBLE';reasons:string[];ruleVersion:string|null}};
const normalize=(s:string)=>s.normalize('NFKC').toLocaleLowerCase().trim();
export function validateDiscoveryQuery(input:DiscoveryQuery){
 for(const key of ['search','state','district','crop','need'] as const){const v=input[key];if(v!==undefined&&(typeof v!=='string'||v.length>120||/[\u0000-\u001f]/.test(v)))throw new Error('INVALID_FILTER');}
 if(input.district?.trim()&&!input.state?.trim())throw new Error('DISTRICT_REQUIRES_STATE');
 if(input.landAreaHectares!==undefined&&(!Number.isFinite(input.landAreaHectares)||input.landAreaHectares<0||input.landAreaHectares>100000))throw new Error('INVALID_LAND_AREA');
 return input;
}
export function rankCandidates(candidates:SchemeCandidate[],query:DiscoveryQuery):DiscoveryResult[]{
 validateDiscoveryQuery(query);
 return candidates.filter(c=>c.verificationStatus==='VERIFIED').map(c=>{
  const name=normalize(c.title+' '+c.code),body=normalize(c.summary),reasons:string[]=[];let score=0;
  for(const [label,term] of [['search',query.search],['crop',query.crop],['farming need',query.need]] as const){
   if(!term?.trim())continue;const t=normalize(term);
   if(name.includes(t)){score+=label==='search'?6:3;reasons.push(`Matched ${label} in scheme title`);}
   else if(body.includes(t)){score+=label==='search'?3:2;reasons.push(`Matched ${label} in published summary`);}
  }
  if(![query.search,query.crop,query.need].some(v=>v?.trim())){score=1;reasons.push('Approved scheme in selected geography');}
  return {...c,relevance:{score,reasons},eligibility:{status:'RULES_UNAVAILABLE' as const,reasons:['No evaluated, independently verified eligibility rule is available for this query. Relevance does not establish eligibility.'],ruleVersion:null}};
 }).filter(c=>c.relevance.score>0).sort((a,b)=>b.relevance.score-a.relevance.score||a.title.localeCompare(b.title));
}
