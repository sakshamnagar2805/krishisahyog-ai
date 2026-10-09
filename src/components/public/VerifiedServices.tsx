import React, {useEffect,useRef,useState} from 'react';
interface DiscoveryItem {id:string;code:string;title:string;summary:string;officialUrl:string;eligibility?:{status:string};evidence?:{sourceUrl:string}}
interface DiscoveryResult {items:DiscoveryItem[];total:number;assessmentType:string}
interface AssistantResult {status:'ANSWERED'|'NO_VERIFIED_SOURCES';answer:string;sources:Array<{title:string;url:string;version?:number;retrievedAt?:string}>;eligibility:'NOT_ASSESSED';officialStatus:'NOT_CHECKED'}
async function readResponse(response:Response){const data=await response.json();if(!response.ok)throw new Error(data.error||data.message||'Verified service unavailable');return data;}
export function SchemeDiscoveryPanel({onAskScheme}:{onAskScheme?:(item:DiscoveryItem)=>void}={}){
 const [need,setNeed]=useState(''),[crop,setCrop]=useState(''),[state,setState]=useState(''),[district,setDistrict]=useState('');
 const [result,setResult]=useState<DiscoveryResult|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();setLoading(true);setError('');setResult(null);try{
  const params=new URLSearchParams();for(const [key,value] of Object.entries({need,crop,state,district}))if(value.trim())params.set(key,value.trim());
  const data=await readResponse(await fetch('/api/v1/public/scheme-discovery?'+params.toString()));if(!Array.isArray(data.items)||data.assessmentType!=='RELEVANCE_ONLY')throw new Error('Invalid discovery response');setResult(data);
 }catch(e){setError(e instanceof Error?e.message:'Source unavailable')}finally{setLoading(false)}}
 return <section className="bg-white border border-line rounded-xl p-5 sm:p-7 space-y-4"><h1 className="font-display font-semibold text-2xl text-navy">Find relevant farming schemes</h1><p className="text-sm text-muted">Matches are suggestions from approved government content, not an eligibility determination.</p>
 <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
 <input aria-label="Farming need" className="border border-line rounded px-3 py-2" placeholder="Need e.g. irrigation" maxLength={120} value={need} onChange={e=>setNeed(e.target.value)}/>
 <input aria-label="Crop" className="border border-line rounded px-3 py-2" placeholder="Crop (optional)" maxLength={120} value={crop} onChange={e=>setCrop(e.target.value)}/>
 <input aria-label="State code" className="border border-line rounded px-3 py-2" placeholder="State code (optional)" maxLength={30} value={state} onChange={e=>setState(e.target.value)}/>
 <input aria-label="District code" className="border border-line rounded px-3 py-2" placeholder="District code (optional)" maxLength={30} value={district} onChange={e=>setDistrict(e.target.value)}/>
 <button disabled={loading} className="sm:col-span-2 rounded bg-navy text-white px-4 py-2 disabled:opacity-50">{loading?'Searching…':'Discover schemes'}</button></form>
 {error&&<p role="alert" className="text-red-700">{error}</p>}{result&&<div role="status" className="space-y-3"><p className="text-sm text-muted">{result.total} relevant approved schemes. Eligibility not verified.</p>
 {result.items.map(item=><article className="border-t border-line pt-3 space-y-1" key={item.id}><h2 className="font-semibold text-navy">{item.title}</h2><p className="text-sm">{item.summary}</p><p className="text-xs text-muted">Eligibility: {item.eligibility?.status||'RULES_UNAVAILABLE'}</p>{item.officialUrl?.startsWith('https://')&&<a className="text-sm text-brand-dark underline" target="_blank" rel="noopener noreferrer" href={item.officialUrl}>Official government source</a>}{onAskScheme&&<button type="button" className="block text-sm text-brand-dark underline" onClick={()=>onAskScheme(item)}>Ask AI using approved sources about this scheme</button>}</article>)}</div>}
 </section>;
}
export function VerifiedAssistantPanel({language,initialQuestion,schemeCode}:{language:string;initialQuestion?:string;schemeCode?:string}){
 const [question,setQuestion]=useState(initialQuestion||'');
 const [result,setResult]=useState<AssistantResult|null>(null);
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(false);
 const controller=useRef<AbortController|null>(null);
 const askedKey=useRef('');
 async function ask(value:string,code?:string){
  controller.current?.abort();
  const next=new AbortController();controller.current=next;
  setLoading(true);setError('');setResult(null);
  try{
   const data=await readResponse(await fetch('/api/v1/public/assistant/ask',{method:'POST',
    headers:{'Content-Type':'application/json'},signal:next.signal,
    body:JSON.stringify({question:value,language:language==='hi'?'hi':'en',...(code?{schemeCode:code}:{})})}));
   if(data.status!=='ANSWERED'&&data.status!=='NO_VERIFIED_SOURCES')throw new Error('Invalid verified assistant response');
   if(!next.signal.aborted)setResult(data as AssistantResult);
  }catch(e){if(!next.signal.aborted)setError(e instanceof Error?e.message:'Verified assistance unavailable');}
  finally{if(!next.signal.aborted)setLoading(false);}
 }
 useEffect(()=>{
  if(!initialQuestion?.trim())return;
  const key=initialQuestion+'|'+(schemeCode??'');
  if(askedKey.current===key)return;
  askedKey.current=key;setQuestion(initialQuestion);void ask(initialQuestion,schemeCode);
 },[initialQuestion,schemeCode]);
 useEffect(()=>()=>{controller.current?.abort();},[]);
 return <section className="bg-white border border-line rounded-xl p-5 sm:p-7 space-y-4">
  <h1 className="font-display font-semibold text-2xl text-navy">Verified AI assistance</h1>
  <p className="text-sm text-muted">Uses independently approved government records only. Staged research is excluded. Answers are informational, not official benefit, insurance, loan, or eligibility decisions. Voice is not yet enabled.</p>
  <form className="space-y-3" onSubmit={e=>{e.preventDefault();if(question.trim())void ask(question.trim());}}>
   <label className="block text-sm font-medium text-navy" htmlFor="verified-assistant-question">Ask a question</label>
   <textarea id="verified-assistant-question" className="w-full rounded border border-line p-3" rows={4} minLength={3} maxLength={1000} required value={question} onChange={e=>setQuestion(e.target.value)} placeholder="e.g. What do the approved sources say about crop insurance?"/>
   <button className="rounded bg-navy text-white px-4 py-2 disabled:opacity-50" disabled={loading}>{loading?'Checking sources…':'Ask AI'}</button>
  </form>
  {error&&<p className="text-red-700" role="alert">{error}. Check the backend, approved catalog and Gemini configuration.</p>}
  {result&&<div className="space-y-3 border-t border-line pt-4" role="status">
   <p className="text-xs font-semibold text-navy">{result.status==='ANSWERED'?'ANSWER BASED ON APPROVED REFERENCES':'NO VERIFIED SOURCES AVAILABLE'}</p>
   <p className="whitespace-pre-wrap">{result.answer}</p>
   {result.sources?.map((source,i)=>source.url?.startsWith('https://')?<div key={`${source.url}-${i}`} className="text-sm"><span className="text-muted mr-2">[{i+1}]</span><a className="text-brand-dark underline" href={source.url} target="_blank" rel="noopener noreferrer">{source.title||'Official government source'}</a>{source.version&&<span className="text-muted"> · Version {source.version}</span>}</div>:null)}
   <p className="text-xs text-muted">Eligibility: not assessed. Official farmer status: not checked. Confirm current rules on the linked government site.</p>
  </div>}
 </section>;
}
