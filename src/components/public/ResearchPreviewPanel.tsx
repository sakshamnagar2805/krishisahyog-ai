import React,{useEffect,useMemo,useState} from 'react';
import {ExternalLink,Search,ChevronDown,ChevronUp,RefreshCw} from 'lucide-react';
import {findResearchMatches,type ResearchJourneyItem} from '../../services/public/researchJourney';

type ResearchPreview={mode:'LOCAL_RESEARCH_PREVIEW';verified:false;total:number;items:ResearchJourneyItem[]};
type ResearchProps={search?:string;categories?:string[];title?:string};
/** Phase 14: never render a staged URL as a link unless it is https (blocks javascript:/data: links). */
const isHttps=(value?:string|null)=>typeof value==='string'&&/^https:\/\/[^\s]+$/i.test(value);
const EXAMPLES=['I need crop insurance','How can I install a solar pump?','Where can I get a crop loan?'];
/** Read-only localhost-only editorial walkthrough. This is NEVER the verified AI assistant. */
export function ResearchPreviewPanel({search='',categories,title='Explore agricultural information'}:ResearchProps){
 const [data,setData]=useState<ResearchPreview|null>(null);
 const examples=categories?.includes('crop_insurance')?['I need crop insurance']:
   categories?.includes('credit')?['Where can I get a crop loan?']:
   categories?.includes('irrigation')?['How can I install a solar pump?','I need drip irrigation']:EXAMPLES;
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(true);
 const [retry,setRetry]=useState(0);
 const [question,setQuestion]=useState('');
 const [appliedQuestion,setAppliedQuestion]=useState('');
 const [expanded,setExpanded]=useState<string|null>(null);
 useEffect(()=>{
  const controller=new AbortController();
  setLoading(true);setError('');
  fetch('/api/v1/internal/research-preview',{credentials:'same-origin',signal:controller.signal})
   .then(async response=>{
     if(response.status===404)return null;
     if(!response.ok)throw new Error('Research staging is unavailable. Confirm migration 0006 and database connection.');
     return await response.json() as ResearchPreview;
   }).then(result=>{
     if(controller.signal.aborted)return;
     setData(result?.mode==='LOCAL_RESEARCH_PREVIEW'?result:null);
     setLoading(false);
   }).catch(err=>{
     if(controller.signal.aborted)return;
     setError(err instanceof Error?err.message:'Research unavailable');setLoading(false);
   });
  return()=>controller.abort();
 },[retry]);
 const items=useMemo(()=>{
  const scoped=(data?.items??[]).filter(item=>
    (!categories?.length||categories.includes(item.category))&&
    `${item.name} ${item.summary} ${item.category} ${item.code}`.toLowerCase().includes(search.toLowerCase()));
  return findResearchMatches(scoped,appliedQuestion);
 },[data,categories,search,appliedQuestion]);
 // A disabled 404 endpoint must not expose even a placeholder on production.
 if(!data&&!error)return null;
 return <section className="bg-white border border-amber-300 rounded-xl p-5 sm:p-7 space-y-4" aria-label="Unverified research walkthrough">
  <div className="space-y-1">
    <p className="text-xs font-bold tracking-wide text-amber-800">LOCAL DEVELOPMENT · RESEARCH ONLY · NOT APPROVED</p>
    <h2 className="font-display font-semibold text-2xl text-navy">{title}</h2>
    <p className="text-sm text-muted">Practice finding a government reference and next steps. These are research notes, not verified current benefits, official eligibility or an AI-generated determination.</p>
  </div>
  {error?<div role="alert" className="space-y-2"><p className="text-sm text-red-700">{error}</p><button onClick={()=>setRetry(n=>n+1)} className="text-sm text-brand-dark underline flex items-center gap-1"><RefreshCw size={15}/> Retry</button></div>:<>
    <form className="space-y-2" onSubmit={e=>{e.preventDefault();setAppliedQuestion(question.trim());setExpanded(null);}}>
      <label htmlFor="research-farmer-question" className="block text-sm font-medium text-navy">What does the farmer need?</label>
      <div className="flex gap-2">
        <input id="research-farmer-question" className="border border-line rounded px-3 py-2 flex-1 min-w-0" maxLength={120} value={question} onChange={e=>setQuestion(e.target.value)} placeholder="e.g. solar pump, crop insurance, credit" />
        <button type="submit" className="rounded bg-navy text-white px-4 py-2 inline-flex gap-2 items-center"><Search size={16}/> Find</button>
      </div>
      <div className="flex flex-wrap gap-2" aria-label="Example demo questions">{examples.map(example=><button type="button" key={example} onClick={()=>{setQuestion(example);setAppliedQuestion(example);setExpanded(null);}} className="text-xs rounded-full border border-line px-3 py-1.5 text-brand-dark hover:bg-offwhite">{example}</button>)}</div>
    </form>
    {loading&&<p className="text-sm text-muted" role="status">Refreshing research references…</p>}
    <p className="text-sm text-muted" role="status">{appliedQuestion?`${items.length} research matches for “${appliedQuestion}”`:`${items.length} research references available`}. No eligibility assessment was performed.</p>
    {!items.length&&<p className="text-sm text-muted">No matching research records. Try a different farming need; do not treat this as an eligibility rejection.</p>}
    {items.map(item=><article key={item.code} className="border-t border-line pt-4 space-y-2">
      <p className="text-xs font-semibold text-amber-800">RESEARCH ONLY · {item.category.replace(/_/g,' ')}</p>
      <button type="button" className="w-full text-left flex justify-between items-start gap-3 text-navy" onClick={()=>setExpanded(x=>x===item.code?null:item.code)} aria-expanded={expanded===item.code} aria-controls={`research-detail-${item.code}`}>
        <span className="font-semibold text-base">{item.name}</span>{expanded===item.code?<ChevronUp size={19}/>:<ChevronDown size={19}/>}
      </button>
      <p className="text-sm text-muted">{item.summary}</p>
      {expanded===item.code&&<div id={`research-detail-${item.code}`} className="bg-amber-50/60 rounded border border-amber-200 p-4 space-y-3">
        <p className="text-sm"><strong>Who it may concern (research summary):</strong> {item.eligibilitySummary}</p>
        <p className="text-sm"><strong>Suggested next step:</strong> {item.farmerAction}</p>
        <p className="text-xs text-muted">Issuing authority: {item.authority} · Geographic scope: {item.geographicScope}</p>
        <p className="text-xs text-amber-900"><strong>Check before relying on this:</strong> {item.reviewNotes}</p>
        <p className="text-xs text-muted">Research checked: {item.checkedOn}. Not a live government feed.</p>
        {isHttps(item.sourceUrl)?<a className="inline-flex gap-1 items-center text-sm underline text-brand-dark" target="_blank" rel="noopener noreferrer" href={item.sourceUrl}>Read original government reference <ExternalLink size={14}/></a>:<p className="text-xs text-red-700">Source link unavailable (not a secure official URL).</p>}
        {isHttps(item.secondaryUrl)&&item.secondaryUrl!==item.sourceUrl&&<a className="block text-sm underline text-brand-dark" target="_blank" rel="noopener noreferrer" href={item.secondaryUrl}>Additional official reference</a>}
      </div>}
    </article>)}
  </>}
 </section>;
}
