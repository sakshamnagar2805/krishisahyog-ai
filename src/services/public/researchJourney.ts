/** Client-side ranking of LOCAL RESEARCH ONLY. Never determines eligibility. */
export interface ResearchJourneyItem {
 code:string; name:string; category:string; summary:string; eligibilitySummary:string;
 farmerAction:string; sourceUrl:string; secondaryUrl:string; authority:string; geographicScope:string;
 checkedOn:string; reviewNotes:string; verificationStatus:'RESEARCH_ONLY_NOT_APPROVED';
 eligibilityStatus:'NOT_EVALUATED';
}
const common=new Set(['i','a','my','the','to','what','where','how','can','get','is','for','and','or','in',
  'do','want','need','about','from','me','scheme','government','farmer','help','with','on','of','any']);
const synonyms:Record<string,string[]>={
  solar:['kusum','pump'],pump:['kusum','irrigation'],insurance:['pmfby','bima'],claim:['pmfby','insurance'],
  loan:['kcc','credit'],bank:['credit','kcc'],fertilizer:['soil'],drip:['pdmc','irrigation'],
  subsidy:['assistance'],price:['market','aas ha','msp'],mandi:['enam','market'],
  सिंचाई:['irrigation','pmksy'],बीमा:['pmfby','insurance'],पंप:['pump','kusum'],
  ऋण:['kcc','loan'],मंडी:['enam','market'],मिट्टी:['soil','health'],
};
export function researchTokens(question:string):string[]{
 const tokens=(question.normalize('NFKC').toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu)??[])
    .filter(t=>t.length>1&&!common.has(t)).slice(0,20);
 return [...new Set(tokens.flatMap(token=>[token,...(synonyms[token]??[])]))].slice(0,40);
}
export function findResearchMatches(items:ResearchJourneyItem[],question:string):ResearchJourneyItem[]{
 const tokens=researchTokens(question);
 if(!tokens.length)return items;
 return items.map(item=>{
  const title=`${item.name} ${item.code}`.normalize('NFKC').toLocaleLowerCase();
  const detail=`${item.category} ${item.summary} ${item.eligibilitySummary} ${item.farmerAction}`.normalize('NFKC').toLocaleLowerCase();
  // No eligibility field is used as a decision rule; it is a research summary.
  const score=tokens.reduce((n,t)=>n+(title.includes(t)?5:detail.includes(t)?2:0),0);
  return {item,score};
 }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.item.name.localeCompare(b.item.name))
   .map(x=>x.item);
}
