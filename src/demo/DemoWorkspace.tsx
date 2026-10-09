import React,{useEffect,useMemo,useState} from 'react';
import {ShieldAlert,UserRound} from 'lucide-react';
import {PMFBYPage} from '../pages/PMFBYPage';
import {DashboardPage} from '../pages/DashboardPage';
import {PACSServicesPage} from '../pages/PACSServicesPage';
import {DocumentLockerPage} from '../pages/DocumentLockerPage';
import {NotificationsPage} from '../pages/NotificationsPage';
import {LocalDemoWorkflow,DEMO_STORAGE_KEY} from './workflow';
import {ErrorBoundary} from '../components/common/ErrorBoundary';
import type {DemoSnapshot} from './workflow';
import type {GrievanceCategory,GrievanceStatus,PACSServiceRequestStatus,Notification} from '../types';

interface Props {activeTab:string;navigate:(tab:string)=>void;onAskQuestion:(question:string)=>void;
 /** Phase 14: lets the original header bell and sidebar badge show the same synthetic unread count. */
 onNotificationsChange?:(items:Notification[])=>void;}
const demoCategories:GrievanceCategory[]=['PMFBY / Crop Insurance','PACS Service','Government Scheme','Agriculture Support','Credit Assistance','Documents','Other'];
const actionClass='rounded bg-navy text-white px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50';
const fieldClass='w-full rounded border border-line bg-white p-2.5 text-ink';
const cardClass='rounded-xl border border-line bg-white p-5 space-y-3';
const badge='inline-block rounded border border-amber-500 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-900';
const pacsTransitions:Partial<Record<PACSServiceRequestStatus,PACSServiceRequestStatus[]>>={
 DEMO_REQUEST_CREATED:['INFORMATION_REQUIRED','GUIDANCE_PROVIDED'],INFORMATION_REQUIRED:['GUIDANCE_PROVIDED'],GUIDANCE_PROVIDED:['CLOSED']
};
const grievanceTransitions:Partial<Record<GrievanceStatus,GrievanceStatus[]>>={
 SUBMITTED:['UNDER REVIEW'],ACKNOWLEDGED:['UNDER REVIEW'],'UNDER REVIEW':['ADDITIONAL INFORMATION REQUIRED','RESOLVED'],
 'ADDITIONAL INFORMATION REQUIRED':['UNDER REVIEW'],RESOLVED:['CLOSED'],FORWARDED:['UNDER REVIEW']
};

/**
 * Phase 14: if a saved synthetic snapshot is structurally broken, the root boundary's "Reload"
 * would reload the same broken state forever. This boundary only clears the synthetic demo key.
 */
function resetBrokenDemoState(){
 try{window.localStorage.removeItem(DEMO_STORAGE_KEY);}catch{/* storage unavailable */}
 window.location.reload();
}
export function DemoWorkspace(props:Props){
 return <ErrorBoundary onReset={resetBrokenDemoState} resetLabel="Reset local synthetic demo and reload"><DemoWorkspaceInner {...props}/></ErrorBoundary>;
}
/** Dedicated client-only prototype; intentionally cannot call statutory mutation APIs. */
function DemoWorkspaceInner({activeTab,navigate,onAskQuestion,onNotificationsChange}:Props){
 const store=useMemo(()=>{let storage;try{storage=typeof window!=='undefined'?window.localStorage:undefined;}catch{/* private browsing may disable storage */}return new LocalDemoWorkflow(storage);},[]);
 const [snapshot,setSnapshot]=useState<DemoSnapshot>(()=>store.snapshot());
 const [error,setError]=useState('');
 const [success,setSuccess]=useState('');
 const [pacsService,setPacsService]=useState('Kisan Credit Card enquiry');
 const [pacsNotes,setPacsNotes]=useState('I want to understand the local PACS application process.');
 const [grievanceCategory,setGrievanceCategory]=useState<GrievanceCategory>('PMFBY / Crop Insurance');
 const [grievanceSubject,setGrievanceSubject]=useState('Crop insurance document help');
 const [grievanceNotes,setGrievanceNotes]=useState('Please explain which documents are needed for this simulated claim.');
 const [linkedClaim,setLinkedClaim]=useState('');
 const [documentId,setDocumentId]=useState('DOC-LAND-01');
 const [documentLabel,setDocumentLabel]=useState('Jamabandi copy prepared for review');
 const [resetConfirm,setResetConfirm]=useState(false);
 const refresh=()=>setSnapshot(store.snapshot());
 const run=(fn:()=>unknown,message:string)=>{try{fn();refresh();setError('');setSuccess(message);}catch(e){setError(e instanceof Error?e.message:'Demo operation failed');setSuccess('');}};
 useEffect(()=>{setError('');setSuccess('');},[activeTab]);
 useEffect(()=>{onNotificationsChange?.(snapshot.notifications);},[snapshot.notifications,onNotificationsChange]);
 const {farmer,claims,documents,pacs,grievances,pacsRequests,notifications}=snapshot;
 const activeClaim=claims[0];
 const requestsForFarmer=pacsRequests.filter(r=>r.farmerId===farmer.id);
 const grievancesForFarmer=grievances.filter(g=>g.farmerId===farmer.id);
 const navigation=(tab:string)=>{if(tab==='government-schemes'||tab==='ai-and-voice-assistant'||tab==='agriculture-support')navigate(tab);else navigate(tab);};
 return <div className="space-y-6" data-testid="phase13-demo-workspace">
  <div role="status" className="rounded-lg border-2 border-amber-500 bg-amber-50 p-4 text-amber-950 space-y-1">
   <div className="flex items-center gap-2 font-bold"><ShieldAlert size={20}/> <span>HACKATHON DEMO — SYNTHETIC FARMER DATA</span></div>
   <p className="text-sm">All farmer profiles, PACS stock/credit, claims, documents, grievance tickets and notifications shown below are simulated and stored only in this browser. Nothing is submitted to any government or PACS system. Do not enter genuine farmer documents or personal data.</p>
  </div>
  {error&&<p role="alert" className="rounded bg-red-50 border border-red-300 p-3 text-red-800">{error}</p>}
  {success&&<p role="status" className="rounded bg-green-50 border border-green-300 p-3 text-green-900">{success}</p>}
  {activeTab==='dashboard'&&<>
   <p className="rounded-lg border border-line bg-white p-3 text-sm text-muted">The original farmer dashboard is shown with one synthetic profile. Weather, mandi rates, crop loss, prices, eligibility suggestions and all account metrics below are only illustrative. They are not live government feeds.</p>
   <DashboardPage farmer={farmer} claim={activeClaim} grievance={grievancesForFarmer[0]||null} pacs={pacs} documents={documents} schemes={[]} notifications={notifications}
     onNavigate={navigation} onOpenVoiceGuide={()=>onAskQuestion('What do approved government sources say about crop insurance?')}
     onOpenUpload={()=>navigate('document-locker')} onAskAIQuestion={onAskQuestion}
     onSelectScheme={()=>navigate('government-schemes')} onSelectGrievance={()=>navigate('grievance-redressal')}
     onCreateGrievance={()=>navigate('grievance-redressal')}/>
   <div className={cardClass}><h2 className="font-semibold text-navy">Suggested demo journey</h2><p className="text-sm">Open PMFBY → inspect the synthetic claim → prepare a missing document → create a grievance linked to the claim → view notifications → read scheme research → ask the verified AI (only if approved sources exist).</p><button type="button" className={actionClass} onClick={()=>navigate('pmfby-crop-insurance')}>Start farmer journey</button></div>
  </>}
  {activeTab==='pmfby-crop-insurance'&&<>
   {activeClaim?<PMFBYPage claim={activeClaim} claims={claims} onNavigateToDocuments={()=>navigate('document-locker')} onCreateGrievance={(c)=>{setLinkedClaim(c.id);navigate('grievance-redressal');}}/>:<section className={cardClass}>No simulated claims in this farmer profile.</section>}
   <p className="text-sm text-muted">The claim ID, crop loss, calculated amounts, workflow statuses and officer details above are fictional scenario values, not a PMFBY portal result. For real claims use <a className="underline text-brand-dark" href="https://pmfby.gov.in" target="_blank" rel="noopener noreferrer">pmfby.gov.in</a>.</p>
  </>}
  {activeTab==='pacs-services'&&<>
   <PACSServicesPage pacs={pacs} onOpenVoiceGuide={()=>onAskQuestion('What do verified sources say about PACS and Kisan Credit Card services?')}/>
   <section className={cardClass} aria-label="Local PACS demo requests"><h2 className="text-xl font-semibold text-navy">Simulated PACS service enquiry</h2><p className="text-sm text-muted">The availability and financial figures above are made-up scenario data. This form creates a local request only.</p>
    <form onSubmit={e=>{e.preventDefault();run(()=>{store.createPACSRequest(pacsService,pacsNotes);setPacsNotes('');},'Demo PACS enquiry stored in this browser.');}} className="grid gap-3 sm:grid-cols-2">
     <label className="space-y-1"><span className="text-sm font-medium">Service</span><select className={fieldClass} value={pacsService} onChange={e=>setPacsService(e.target.value)}>{['Kisan Credit Card enquiry','Fertilizer availability enquiry','Machinery hiring enquiry','PACS membership guidance'].map(s=><option key={s}>{s}</option>)}</select></label>
     <label className="space-y-1 sm:col-span-2"><span className="text-sm font-medium">Enquiry details (synthetic only)</span><textarea className={fieldClass} required minLength={8} maxLength={600} rows={3} value={pacsNotes} onChange={e=>setPacsNotes(e.target.value)}/></label><button className={actionClass}>Save local PACS enquiry</button>
    </form><h3 className="font-semibold">Local enquiry history ({requestsForFarmer.length})</h3>{requestsForFarmer.map(r=><div key={r.id} className="border-t border-line pt-2 text-sm"><p className="font-semibold">{r.serviceName} <span className={badge}>DEMO</span></p><p>{r.id} · {r.status}</p><p className="text-muted">{r.description}</p><div className="flex flex-wrap gap-2 pt-2">{(pacsTransitions[r.status]??[]).map(next=><button type="button" key={next} className="rounded border border-line p-2 text-xs text-brand-dark" onClick={()=>run(()=>store.updatePACSRequestStatus(r.id,next),`Local PACS simulation updated: ${next}.`)}>Simulate: {next.replaceAll('_',' ').toLowerCase()}</button>)}</div></div>)}
   </section>
  </>}
  {activeTab==='document-locker'&&<>
   <DocumentLockerPage documents={documents} onOpenUpload={(type)=>{const found=documents.find(d=>d.docType===type);if(found)setDocumentId(found.id);setError('');setSuccess('Select the document below and record preparation; no file is uploaded.');}} onNavigate={navigate} onNavigateToClaim={()=>navigate('pmfby-crop-insurance')}/>
   <section className={cardClass} aria-label="Simulated document preparation"><h2 className="text-xl font-semibold text-navy">Record document preparation (demo)</h2><p className="text-sm text-muted">Metadata only. No real files leave the browser. Preparation does not change missing/expired status or certify the document.</p>
    <form className="space-y-3" onSubmit={e=>{e.preventDefault();run(()=>store.prepareDocument(documentId,documentLabel),'Preparation saved locally; government verification not performed.');}}>
     <label className="block text-sm">Document<select className={`${fieldClass} mt-1`} value={documentId} onChange={e=>setDocumentId(e.target.value)}>{documents.map(d=><option value={d.id} key={d.id}>{d.title} — {d.status}</option>)}</select></label>
     <label className="block text-sm">Local preparation note<input className={`${fieldClass} mt-1`} maxLength={120} minLength={3} required value={documentLabel} onChange={e=>setDocumentLabel(e.target.value)}/></label>
     <button className={actionClass}>Record local preparation</button>
    </form>
   </section>
  </>}
  {activeTab==='grievance-redressal'&&<>
   <section className={cardClass}><h1 className="text-2xl font-display font-semibold text-navy">Simulated grievance helpdesk</h1><p className="text-sm text-muted">A ticket in this section exists only in your browser. It is not filed at CPGRAMS, PMFBY or any government office.</p>
    <form className="space-y-3" onSubmit={e=>{e.preventDefault();run(()=>{store.createGrievance(grievanceCategory,grievanceSubject,grievanceNotes,linkedClaim||undefined);setGrievanceNotes('');},'Synthetic grievance ticket created and notification added.');}}>
     <label className="block text-sm">Category<select className={`${fieldClass} mt-1`} value={grievanceCategory} onChange={e=>setGrievanceCategory(e.target.value as GrievanceCategory)}>{demoCategories.map(c=><option key={c}>{c}</option>)}</select></label>
     <label className="block text-sm">Related simulated PMFBY claim (optional)<select className={`${fieldClass} mt-1`} value={linkedClaim} onChange={e=>setLinkedClaim(e.target.value)}><option value="">None</option>{claims.map(c=><option key={c.id} value={c.id}>{c.id} — {c.crop}</option>)}</select></label>
     <label className="block text-sm">Subject<input className={`${fieldClass} mt-1`} required minLength={5} maxLength={120} value={grievanceSubject} onChange={e=>setGrievanceSubject(e.target.value)}/></label>
     <label className="block text-sm">Describe your synthetic issue<textarea className={`${fieldClass} mt-1`} required rows={4} minLength={12} maxLength={1500} value={grievanceNotes} onChange={e=>setGrievanceNotes(e.target.value)}/></label><button className={actionClass}>Create simulated grievance</button>
    </form>
   </section>
   <section className={cardClass}><h2 className="text-lg font-semibold text-navy">Simulated grievance history ({grievancesForFarmer.length})</h2>
    {grievancesForFarmer.map(g=><article key={g.id} className="border-t border-line py-3 space-y-1"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-medium">{g.subject}</h3><span className={badge}>DEMO · {g.status}</span></div><p className="text-sm text-muted">{g.id} · {g.category} · {g.relatedClaimId||'General'} </p><p className="text-sm">{g.description}</p><p className="text-xs text-muted">{g.timeline.map(s=>s.stage).join(' → ')}</p><div className="flex flex-wrap gap-2 pt-2">{(grievanceTransitions[g.status]??[]).map(next=><button type="button" key={next} className="rounded border border-line p-2 text-xs text-brand-dark" onClick={()=>run(()=>store.updateGrievanceStatus(g.id,next),`Local grievance simulation updated: ${next}.`)}>Simulate: {next.toLowerCase()}</button>)}</div></article>)}
    <p className="text-sm">To submit a real public grievance, use <a className="underline text-brand-dark" href="https://pgportal.gov.in/" target="_blank" rel="noopener noreferrer">the official CPGRAMS portal</a> and confirm the appropriate department.</p>
   </section>
  </>}
  {activeTab==='notifications'&&<NotificationsPage notifications={notifications} onNavigate={navigate} onMarkAllAsRead={()=>run(()=>store.markAllRead(),'All demo notifications marked read.')} onToggleRead={id=>run(()=>store.toggleNotificationRead(id),'Demo notification read state updated.')}/>}
  {activeTab==='profile'&&<>
   <section className={cardClass}><h1 className="text-2xl font-semibold text-navy flex gap-2 items-center"><UserRound/> Synthetic farmer profile</h1><p className="text-sm text-muted">Not connected to Aadhaar, land records, PACS membership or government login.</p><dl className="grid sm:grid-cols-2 gap-4 text-sm">{[['Name',farmer.name],['Synthetic ID',farmer.id],['Village',farmer.village],['District',farmer.district],['State',farmer.state],['Primary crop',farmer.primaryCrop||'Not recorded'],['Landholding',`${farmer.totalLandAcres} acres`],['PACS demo reference',farmer.pacsMembershipId]].map(([label,value])=><div key={label}><dt className="text-muted">{label}</dt><dd className="font-semibold">{value}</dd></div>)}</dl></section>
   <section className={cardClass}><h2 className="font-semibold text-navy">Local demo reset</h2><p className="text-sm text-muted">Resets synthetic actions on this browser only. Does not touch any government, research staging or verified database records.</p>{!resetConfirm?<button type="button" className="rounded border border-line p-2" onClick={()=>setResetConfirm(true)}>Reset demo data…</button>:<div className="flex gap-3"><button type="button" className={actionClass} onClick={()=>{store.reset();refresh();setResetConfirm(false);setSuccess('Local demo restored to original synthetic state.');}}>Confirm reset</button><button type="button" className="rounded border border-line p-2" onClick={()=>setResetConfirm(false)}>Cancel</button></div>}</section>
  </>}
 </div>;
}
