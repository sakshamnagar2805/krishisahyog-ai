/**
 * Bounded, deterministic selection of already APPROVED source evidence.
 * A farmer question is not an exact catalog search string: tokenize it and
 * score topical overlap. Do not infer eligibility or widen source trust.
 */
import type {PublishedContent} from '../publicContent/models';

const STOP_WORDS = new Set([
  'a','an','and','are','am','be','can','could','do','does','for','from','get','how','i','in','is','it',
  'me','my','of','on','or','please','scheme','schemes','should','tell','the','there','this','to','want',
  'what','when','where','which','who','will','with','you','your','about','apply','application','help',
  'government','farmer','farmers','benefit','benefits','eligible','eligibility',
  'क्या','कैसे','कौन','कब','के','की','का','को','है','हैं','मुझे','मेरे','और','लिए','योजना','किसान'
]);
const ALIASES: Record<string,string[]> = {
  insurance:['pmfby','बीमा'], bima:['pmfby'], बीमा:['pmfby','insurance'],
  solar:['kusum','सौर'], सौर:['kusum','solar'], drip:['micro','irrigation','pdmc'],
  sprinkler:['irrigation','pdmc'], irrigation:['pmksy','सिंचाई'], सिंचाई:['pmksy','irrigation'],
  loan:['kcc','credit'], credit:['kcc','loan'], ऋण:['kcc','loan'],
  soil:['health','card'], मिट्टी:['soil','health'], market:['enam','mandi'],
  mandi:['enam','market'], मंडी:['enam','market'], pension:['kmy'],
};
export function questionTerms(question:string):string[]{
  const words=(question.normalize('NFKC').toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu)??[])
    .filter(word=>word.length>1&&!STOP_WORDS.has(word)).slice(0,24);
  const expanded=words.flatMap(word=>[word,...(ALIASES[word]??[])]);
  return [...new Set(expanded)].slice(0,40);
}
export function scoreEvidence(record:Pick<PublishedContent,'code'|'title'|'summary'>,terms:string[]):number {
  const title=record.title.normalize('NFKC').toLocaleLowerCase();
  const code=record.code.normalize('NFKC').toLocaleLowerCase();
  const summary=record.summary.normalize('NFKC').toLocaleLowerCase();
  let score=0;
  for(const term of terms){
    // Longer tokens are less likely to produce false positives. Use a word
    // boundary for Latin acronyms; Hindi may attach inflections to a stem.
    const escape=term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const regex=/^[a-z0-9]+$/.test(term)?new RegExp(`(^|[^a-z0-9])${escape}([^a-z0-9]|$)`,'i'):null;
    const matches=(field:string)=>regex?regex.test(field):field.includes(term);
    if(matches(code))score+=8;
    else if(matches(title))score+=5;
    else if(matches(summary))score+=2;
  }
  return score;
}
export function rankApprovedEvidence(records:PublishedContent[],question:string,preferredCode?:string,limit=8):PublishedContent[]{
  const terms=questionTerms(question);
  if(!terms.length&&!preferredCode?.trim())return [];
  const code=preferredCode?.trim().toLowerCase();
  const verified=records.filter(item=>item.verificationStatus==='VERIFIED'&&
      item.evidence?.sourceUrl?.startsWith('https://')&&item.officialUrl?.startsWith('https://'));
  // If a farmer opens a particular scheme, never substitute a different
  // approved scheme because of loosely matching terms such as "benefits".
  if(code)return verified.filter(item=>item.code.toLowerCase()===code).slice(0,limit);
  return verified
    .map(item=>({item,score:scoreEvidence(item,terms)}))
    .filter(({score})=>score>0)
    .sort((a,b)=>b.score-a.score||a.item.title.localeCompare(b.item.title))
    .slice(0,limit).map(({item})=>item);
}
