import React, { lazy, Suspense, useEffect, useState } from 'react';
import { BookOpen, RefreshCw, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { loadPublicCatalog, type PublicCatalogResponse, type GovernmentContentRecord } from './services/public/governmentContentClient';
import type { User, LanguageCode, Notification } from './types';
import { SchemeDiscoveryPanel, VerifiedAssistantPanel } from './components/public/VerifiedServices';
import { ResearchPreviewPanel } from './components/public/ResearchPreviewPanel';
import { isDemoAllowed } from './demo/access';
// Phase 14: the synthetic workspace is compiled OUT of production bundles. import.meta.env.DEV is a
// build-time constant, so `vite build` removes this dynamic import and emits no demo chunk at all.
const DemoWorkspace = import.meta.env.DEV ? lazy(() => import('./demo/DemoWorkspace').then(module => ({default:module.DemoWorkspace}))) : null;
const demoRoutes = new Set(['dashboard','pmfby-crop-insurance','pacs-services','document-locker','grievance-redressal','notifications','profile']);

// Phase 1: restore original visual shell. Never hydrate demo provider data.
// Private modules keep their original routes but have an explicit unavailable state
// until authenticated, real-data services exist.
const guest: User = {
  id: 'anonymous', name: 'Guest', role: 'farmer', badgeId: '',
  jurisdiction: 'Not selected', preferredLanguage: 'en', isDemo: false,
};

const LABELS: Record<string,string> = {
  dashboard:'Dashboard', 'pmfby-crop-insurance':'Crop insurance (PMFBY)',
  'pacs-services':'PACS services', 'government-schemes':'Government schemes',
  'farmer-policies':'Farmer policies & notices', 'cooperative-schemes':'Cooperative schemes',
  'credit-and-financial-assistance':'Credit and KCC loans',
  'agriculture-support':'Agriculture support', 'document-locker':'Documents',
  'grievance-redressal':'Grievances', notifications:'Notifications',
  'ai-and-voice-assistant':'Voice and AI assistant', profile:'Profile',
  'admin-governance':'Admin and governance',
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [schemes, setSchemes] = useState<PublicCatalogResponse | null>(null);
  const [policies, setPolicies] = useState<PublicCatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [catalogErrors, setCatalogErrors] = useState<{schemes:string;policies:string}>({schemes:'',policies:''});
  const [reload, setReload] = useState(0);
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<GovernmentContentRecord | null>(null);
  const [assistantRequest, setAssistantRequest] = useState<{question:string;schemeCode?:string}|null>(null);
  const [demoNotifications, setDemoNotifications] = useState<Notification[]>([]);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);setCatalogErrors({schemes:'',policies:''});
    Promise.allSettled([
      loadPublicCatalog('schemes',{search:submittedSearch,limit:20,offset}),
      loadPublicCatalog('policies',{search:submittedSearch,limit:20,offset})
    ]).then(([schemeResult,policyResult])=>{
      if(cancelled)return;
      setSchemes(schemeResult.status==='fulfilled'?schemeResult.value:null);
      setPolicies(policyResult.status==='fulfilled'?policyResult.value:null);
      setCatalogErrors({
        schemes:schemeResult.status==='rejected'?(schemeResult.reason instanceof Error?schemeResult.reason.message:'Verified scheme service unavailable'):'',
        policies:policyResult.status==='rejected'?(policyResult.reason instanceof Error?policyResult.reason.message:'Verified policy service unavailable'):''
      });
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [reload,submittedSearch,offset]);
  const navigate = (tab: string) => {
    setActiveTab(tab);setMobileSidebarOpen(false);setSelected(null);setOffset(0);
    if(tab!=='ai-and-voice-assistant')setAssistantRequest(null);
  };
  const askAboutApproved = (item:{title:string;code:string}) => {
    setAssistantRequest({question:`What do the approved government sources say about ${item.title}, its benefits and application steps?`,schemeCode:item.code});
    navigate('ai-and-voice-assistant');
  };
  const catalog = activeTab === 'farmer-policies' ? policies : schemes;
  const error = activeTab === 'farmer-policies' ? catalogErrors.policies : catalogErrors.schemes;
  const catalogRoute = activeTab === 'government-schemes' || activeTab === 'cooperative-schemes' || activeTab === 'farmer-policies';
  const demoEnabled = isDemoAllowed({DEV:import.meta.env.DEV,flag:import.meta.env.VITE_HACKATHON_DEMO_ENABLED,hostname:typeof window==='undefined'?'':window.location.hostname});
  const showDemo = demoEnabled && DemoWorkspace !== null && demoRoutes.has(activeTab);
  const showUnavailable = !showDemo && !catalogRoute && activeTab !== 'dashboard' && activeTab !== 'agriculture-support' && activeTab !== 'ai-and-voice-assistant';
  return <div className="min-h-screen bg-offwhite text-ink flex flex-col selection:bg-brand-light selection:text-navy">
    <Header currentUser={{ ...guest, id: demoEnabled ? 'DEMO-FRM-1001' : guest.id, name: demoEnabled ? 'Synthetic farmer (demo)' : guest.name, isDemo: demoEnabled, preferredLanguage: language }} currentLanguage={language}
      onLanguageChange={setLanguage} onOpenVoiceGuide={() => navigate('ai-and-voice-assistant')}
      onToggleMobileMenu={() => setMobileSidebarOpen(x => !x)}
      onNavigate={navigate} notifications={demoEnabled ? demoNotifications : []} onLogout={() => navigate('dashboard')} />
    <div className="flex-1 flex flex-col lg:flex-row relative">
      <Sidebar activeTab={activeTab} onSelectTab={navigate} userRole="farmer"
        mobileOpen={mobileSidebarOpen} onCloseMobile={() => setMobileSidebarOpen(false)} unreadNotifications={demoEnabled ? demoNotifications.filter(n => !n.read).length : 0}/>
      <div className="flex-1 min-w-0 lg:pl-72 flex flex-col justify-between">
        <main className="max-w-6xl w-full mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6" id="main-content">
          {!showDemo && <div className="rounded-lg bg-blue-soft border border-line p-3 text-sm text-navy flex gap-2 items-start" role="status">
            <ShieldCheck className="w-5 h-5 shrink-0"/> Public information mode: verified records only. Research previews are unapproved; no synthetic farmer status is shown.
          </div>}
          {showDemo && DemoWorkspace && <Suspense fallback={<p role="status">Loading local synthetic farmer demo…</p>}><DemoWorkspace activeTab={activeTab} navigate={navigate} onAskQuestion={(question)=>{setAssistantRequest({question});navigate('ai-and-voice-assistant');}} onNotificationsChange={setDemoNotifications}/></Suspense>}
          {activeTab === 'dashboard' && !showDemo && <>
            <section className="rounded-xl bg-navy text-white p-6 sm:p-9 space-y-3">
              <h1 className="font-display text-3xl font-bold">KrishiSahyog AI</h1>
              <p className="text-white/85">Farmer services, government schemes and agricultural policies — based on verified official information.</p>
            </section>
            <div className="grid gap-4 sm:grid-cols-2">
              {[['government-schemes','Government schemes','Browse verified government support programs'],['farmer-policies','Farmer policies & notices','Read official guidelines and amendments']].map(([id,title,desc]) =>
                <button key={id} onClick={() => navigate(id)} className="bg-white border border-line rounded-lg p-6 text-left hover:border-brand">
                  <BookOpen className="text-brand-dark mb-3"/><h2 className="font-semibold text-lg text-navy">{title}</h2><p className="text-sm text-muted">{desc}</p>
                </button>)}
            </div>
          </>}
          {(catalogRoute || (activeTab === 'dashboard' && !showDemo)) && <section className="bg-white border border-line rounded-xl p-5 sm:p-7 space-y-4">
            <div className="flex justify-between items-start gap-4"><div><h2 className="font-display font-semibold text-2xl text-navy">{activeTab === 'farmer-policies' ? 'Farmer policies & notices' : activeTab === 'dashboard' ? 'Official government information' : LABELS[activeTab]}</h2>
              <p className="text-sm text-muted mt-1">Published records require a verified official URL and source history.</p></div>
              <button onClick={() => setReload(x => x+1)} className="text-sm font-medium text-brand-dark flex gap-2 items-center"><RefreshCw size={16}/> Refresh</button>
            </div>
            {catalogRoute && <form className="flex gap-2" onSubmit={e=>{e.preventDefault();setOffset(0);setSubmittedSearch(search.trim());setSelected(null);}}><input aria-label="Search verified information" className="min-w-0 flex-1 rounded border border-line px-3 py-2" value={search} onChange={e=>setSearch(e.target.value)} maxLength={120} placeholder="Search schemes, policies and notices"/><button type="submit" className="rounded bg-navy text-white px-4 py-2">Search</button></form>}
            {loading ? <p className="text-muted" role="status">Loading verified records…</p> : error ?
              <div role="alert" className="text-red-700"><AlertCircle className="inline mr-2" size={17}/>{error.replace(/\.+$/,'')}. No demo fallback is permitted.</div> :
              <><p className="text-sm text-muted">{activeTab === 'dashboard' ? (schemes?.total || 0) + (policies?.total || 0) + ' verified records available.' : catalog?.total ? `${catalog.total} verified records found.` : 'No verified government records are available for this view.'}</p>
              {catalogRoute && catalog?.items.filter(x => activeTab !== 'cooperative-schemes' || /cooperative|pacs|credit/i.test(x.title+' '+x.summary)).map(item => <article className="border-t border-line pt-4 space-y-2" key={item.id}>
              <button onClick={()=>setSelected(item)} className="text-left font-semibold text-navy hover:underline">{item.title}</button>
              <p className="text-sm text-muted">{item.summary || 'No verified summary is available.'}</p>
              <p className="text-xs text-muted">{item.authority} · Version {item.version} · Retrieved {new Date(item.retrievedAt).toLocaleDateString()} · Published {item.publishedAt || 'Not specified'}</p>
              <a className="text-brand-dark text-sm underline inline-flex gap-1 items-center" target="_blank" rel="noopener noreferrer" href={item.officialUrl}>Official source <ExternalLink size={14}/></a>
              {activeTab!=='farmer-policies'&&<button type="button" onClick={()=>askAboutApproved(item)} className="block text-sm text-brand-dark underline">Ask AI about this verified scheme</button>}
            </article>)}
            {catalogRoute && !loading && !error && !!catalog?.total && <nav aria-label="Catalog pagination" className="flex items-center gap-4 pt-4"><button className="border border-line rounded px-3 py-2 disabled:opacity-40" disabled={offset===0} onClick={()=>{setOffset(n=>Math.max(0,n-20));setSelected(null)}}>Previous</button><span className="text-sm">{offset+1}–{Math.min(offset+20,catalog.total)} of {catalog.total}</span><button className="border border-line rounded px-3 py-2 disabled:opacity-40" disabled={offset+20>=catalog.total} onClick={()=>{setOffset(n=>n+20);setSelected(null)}}>Next</button></nav>}
            {selected && catalogRoute && <aside className="rounded-lg border border-line bg-blue-soft p-5 space-y-2" aria-label="Verified record details"><div className="flex justify-between"><h3 className="font-bold text-navy">{selected.title}</h3><button onClick={()=>setSelected(null)} aria-label="Close details">Close</button></div><p>{selected.summary || 'No verified summary available.'}</p><p className="text-sm">Authority: {selected.authority}</p><p className="text-sm">Effective: {selected.effectiveFrom || 'Not established'} — {selected.effectiveTo || 'Not specified'}</p><p className="text-sm">Document ID: {selected.evidence.documentId} · SHA-256: {selected.evidence.sha256}</p><a className="text-brand-dark underline" target="_blank" rel="noopener noreferrer" href={selected.evidence.sourceUrl}>Open verified source</a></aside>}
              </>}
          </section>}
          {activeTab === 'government-schemes' && <ResearchPreviewPanel search={submittedSearch} title="Find agricultural scheme research" />}
          {activeTab === 'agriculture-support' && <><SchemeDiscoveryPanel onAskScheme={askAboutApproved}/><ResearchPreviewPanel title="Research: soil, irrigation and machinery" categories={['irrigation','micro_irrigation','solar_irrigation','soil','mechanization','watershed']} /></>}
          {activeTab === 'ai-and-voice-assistant' && <VerifiedAssistantPanel language={language} initialQuestion={assistantRequest?.question} schemeCode={assistantRequest?.schemeCode} />}
          {showUnavailable && <section className="bg-white border border-line rounded-xl p-6 space-y-3">
            <h1 className="font-display font-semibold text-2xl text-navy">{LABELS[activeTab] || 'Farmer service'}</h1>
            <p className="text-muted">This existing module remains in the product navigation. Its original interface is retained in the codebase, but its demo-dependent operation is unavailable until verified backend data and appropriate authentication are connected.</p>
            <p className="text-sm text-muted">No simulated account details, submissions, claim approvals or AI-generated official status will be displayed.</p>
          </section>}
          {activeTab==='pmfby-crop-insurance'&&<ResearchPreviewPanel title="Research: crop insurance and PMFBY" categories={['crop_insurance']} />}
          {activeTab==='pacs-services'&&<ResearchPreviewPanel title="Research: PACS and agricultural credit" categories={['credit','infrastructure_credit']} />}
          {activeTab==='credit-and-financial-assistance'&&<ResearchPreviewPanel title="Research: loans and agricultural finance" categories={['credit','infrastructure_credit']} />}
        </main><Footer/>
      </div>
    </div>
  </div>;
}
