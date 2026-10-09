import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LocalDemoWorkflow,isValidDemoSnapshot,DEMO_STORAGE_KEY,createSeed} from '../src/demo/workflow.ts';
import {isDemoAllowed} from '../src/demo/access.ts';

const clock=()=>new Date('2026-10-09T06:00:00.000Z');
function storage(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k),dump:()=>m};}
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');

test('13A: localhost-only explicit demo flag, never production or public IP',()=>{
 assert.equal(isDemoAllowed({DEV:true,flag:'true',hostname:'localhost'}),true);
 assert.equal(isDemoAllowed({DEV:true,flag:'true',hostname:'127.0.0.1'}),true);
 assert.equal(isDemoAllowed({DEV:true,flag:'true',hostname:'0.0.0.0'}),false);
 assert.equal(isDemoAllowed({DEV:false,flag:'true',hostname:'localhost'}),false);
 assert.equal(isDemoAllowed({DEV:true,flag:'false',hostname:'localhost'}),false);
});
test('13A: seeded records belong to same synthetic farmer',()=>{
 const s=createSeed();assert.equal(s.farmer.isDemo,true);
 assert.equal(isValidDemoSnapshot(s),true);
 for(const collection of [s.claims,s.documents,s.pacsRequests,s.grievances])
  assert.ok(collection.every(item=>item.isDemo===true&&item.farmerId===s.farmer.id));
 assert.ok(s.notifications.every(item=>item.isDemo===true));
});
test('13A: fail closed for malformed and mismatched browser snapshot',()=>{
 const s=createSeed();assert.equal(isValidDemoSnapshot({...s,schemaVersion:2}),false);
 assert.equal(isValidDemoSnapshot({...s,farmer:{...s.farmer,id:'REAL_USER'}}),false);
 assert.equal(isValidDemoSnapshot({...s,grievances:[{...s.grievances[0],isDemo:false}]}),false);
 assert.equal(isValidDemoSnapshot({...s,documents:[{...s.documents[0],farmerId:'OTHER_USER'}]}),false);
 assert.equal(isValidDemoSnapshot({...s,grievances:[...Array(76).keys()].map(i=>({...s.grievances[0],id:'a'+i}))}),false);
});
test('13B: create PACS request, grievance linked to claim and local notifications',()=>{
 const db=storage(),store=new LocalDemoWorkflow(db,clock);
 const claim=store.snapshot().claims[0];
 const req=store.createPACSRequest('Kisan Credit Card enquiry','Please show local application steps.');
 const grievance=store.createGrievance('PMFBY / Crop Insurance','Crop insurance help','Please explain the missing crop documents.',claim.id);
 const next=store.snapshot();
 assert.equal(req.farmerId,next.farmer.id);assert.equal(req.isDemo,true);
 assert.equal(req.status,'DEMO_REQUEST_CREATED');
 assert.equal(grievance.farmerId,next.farmer.id);
 assert.equal(grievance.relatedClaimId,claim.id);assert.equal(grievance.status,'SUBMITTED');
 assert.equal(grievance.verificationStatus,'DEMO');
 assert.ok(next.notifications.some(n=>n.message.includes(req.id)));
 assert.ok(next.notifications.some(n=>n.message.includes(grievance.id)));
 assert.equal(next.claims[0].status,claim.status,'government claim is NOT modified by demo grievance');
});
test('13B: document preparation does not fabricate official upload or approval',()=>{
 const store=new LocalDemoWorkflow(storage(),clock);
 const updated=store.prepareDocument('DOC-LAND-01','Jamabandi copy ready');
 assert.equal(updated.status,createSeed().documents.find(d=>d.id==='DOC-LAND-01').status);
 assert.equal(updated.verificationStatus,'DEMO');
 assert.match(updated.description,/No document bytes uploaded/);
 assert.equal(store.snapshot().claims[0].status,createSeed().claims[0].status);
 assert.throws(()=>store.prepareDocument('OTHER','not permitted'),/does not belong/);
});
test('13B: reject bogus foreign claim, too-short inputs and invalid categories',()=>{
 const store=new LocalDemoWorkflow(storage(),clock);
 assert.throws(()=>store.createPACSRequest('KCC','short'),/at least 8/);
 assert.throws(()=>store.createGrievance('PMFBY / Crop Insurance','Issue','Too short'),/subject/);
 assert.throws(()=>store.createGrievance('PMFBY / Crop Insurance','Valid subject','A sufficiently descriptive issue','REAL-CLAIM'),/not in this farmer/);
 assert.throws(()=>store.createGrievance('FAKE','Valid subject','A sufficiently descriptive issue'),/Select a category/);
});
test('13A/B: restart restores only synthetic state; mark read; reset',()=>{
 const db=storage();let one=new LocalDemoWorkflow(db,clock);
 const req=one.createPACSRequest('Machinery hiring enquiry','Please explain how to hire a tractor.');
 let two=new LocalDemoWorkflow(db,clock);
 assert.ok(two.snapshot().pacsRequests.some(x=>x.id===req.id));
 const notice=two.snapshot().notifications.find(n=>n.message.includes(req.id));
 two.markNotificationRead(notice.id);
 assert.equal(new LocalDemoWorkflow(db,clock).snapshot().notifications.find(n=>n.id===notice.id)?.read,true);
 two.markAllRead();assert.ok(two.snapshot().notifications.every(n=>n.read===true));
 two.reset();assert.equal(db.getItem(DEMO_STORAGE_KEY),null);
 assert.equal(two.snapshot().pacsRequests.some(x=>x.id===req.id),false);
});
test('13C: corrupt browser state resets and does not mutate real backend',()=>{
 const db=storage();db.setItem(DEMO_STORAGE_KEY,'not-json');
 const store=new LocalDemoWorkflow(db,clock);
 assert.ok(isValidDemoSnapshot(store.snapshot()));
 const backend=read('../server/index.ts');assert.doesNotMatch(backend,/DemoWorkspace|LocalDemoWorkflow/);
 const app=read('../src/App.tsx');assert.match(app,/showDemo/);
 assert.match(app,/DemoWorkspace/);
 assert.match(read('../src/demo/DemoWorkspace.tsx'),/HACKATHON DEMO — SYNTHETIC FARMER DATA/);
 assert.match(read('../server/publicContent/repository.ts'),/verification_status='APPROVED'/);
});
test('13B: local PACS and grievance status updates are explicit, audited in timeline and not government operations',()=>{
 const db=storage(),store=new LocalDemoWorkflow(db,clock);
 const req=store.createPACSRequest('Credit guidance','Need more information about a farm loan.');
 const gr=store.createGrievance('PACS Service','PACS enquiry help','Please explain the steps in the local synthetic flow.');
 assert.equal(store.updatePACSRequestStatus(req.id,'INFORMATION_REQUIRED').status,'INFORMATION_REQUIRED');
 assert.equal(store.updatePACSRequestStatus(req.id,'GUIDANCE_PROVIDED').status,'GUIDANCE_PROVIDED');
 assert.equal(store.updatePACSRequestStatus(req.id,'CLOSED').status,'CLOSED');
 assert.throws(()=>store.updatePACSRequestStatus(req.id,'DEMO_REQUEST_CREATED'),/not allowed/);
 assert.equal(store.updateGrievanceStatus(gr.id,'UNDER REVIEW').status,'UNDER REVIEW');
 assert.equal(store.updateGrievanceStatus(gr.id,'RESOLVED').status,'RESOLVED');
 assert.equal(store.updateGrievanceStatus(gr.id,'CLOSED').status,'CLOSED');
 assert.throws(()=>store.updateGrievanceStatus(gr.id,'RESOLVED'),/not allowed/);
 const again=new LocalDemoWorkflow(db,clock).snapshot();
 assert.equal(again.pacsRequests.find(r=>r.id===req.id).status,'CLOSED');
 assert.equal(again.grievances.find(g=>g.id===gr.id).status,'CLOSED');
 assert.ok(again.grievances.find(g=>g.id===gr.id).timeline.every(t=>t.notes.includes('simulation')||t.notes.includes('Simulated')));
 assert.ok(again.notifications.some(n=>n.message.includes('not an official')));
});
