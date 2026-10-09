/** Phase 13A/B: local-only synthetic farmer workflow. NEVER authoritative government data. */
import {demoFarmer} from '../data/demo/farmerData.ts';
import {demoClaims} from '../data/demo/claims.ts';
import {demoDocuments} from '../data/demo/documents.ts';
import {demoPACSService} from '../data/demo/pacsServices.ts';
import {demoPACSRequests} from '../data/demo/pacsRequests.ts';
import {demoGrievances} from '../data/demo/grievances.ts';
import {demoNotifications} from '../data/demo/notifications.ts';
import type { Farmer, PMFBYClaim, Document, PACSService, PACSServiceRequest, Grievance, GrievanceCategory, GrievanceStatus, PACSServiceRequestStatus, Notification } from '../types';

export const DEMO_STORAGE_KEY = 'krishisahyog:synthetic-local-demo:v1';
export const DEMO_SCHEMA_VERSION = 1;
const MAX_RECORDS = 75;
const copy = <T,>(item:T):T => structuredClone(item);
const allowedCategories:GrievanceCategory[]=['PMFBY / Crop Insurance','PACS Service','Government Scheme','Agriculture Support','Credit Assistance','Documents','Other'];
export interface DemoSnapshot {
 schemaVersion:1;
 farmer: Farmer;
 claims:PMFBYClaim[];
 documents:Document[];
 pacs:PACSService;
 pacsRequests:PACSServiceRequest[];
 grievances:Grievance[];
 notifications:Notification[];
}
export function createSeed():DemoSnapshot {
 return {schemaVersion:1,farmer:copy(demoFarmer),claims:copy(demoClaims),documents:copy(demoDocuments),pacs:copy(demoPACSService),pacsRequests:copy(demoPACSRequests),grievances:copy(demoGrievances),notifications:copy(demoNotifications)};
}
/** Validate restored storage: strict synthetic owner, bounded size and demo flags; otherwise reset. */
export function isValidDemoSnapshot(candidate:unknown):candidate is DemoSnapshot {
 if(!candidate||typeof candidate!=='object')return false;
 const s=candidate as Partial<DemoSnapshot>;
 if(s.schemaVersion!==DEMO_SCHEMA_VERSION||s.farmer?.id!==demoFarmer.id||s.farmer?.isDemo!==true||!s.pacs||s.pacs.isDemo!==true)return false;
 const arrays:[keyof DemoSnapshot,string][]=[['claims','farmerId'],['documents','farmerId'],['pacsRequests','farmerId'],['grievances','farmerId'],['notifications','']];
 return arrays.every(([key,owner])=>{
  const value=s[key];
  return Array.isArray(value)&&value.length<=MAX_RECORDS&&value.every((item:unknown)=>{
   if(!item||typeof item!=='object')return false;
   const x=item as Record<string,unknown>;
   return x.isDemo===true&&typeof x.id==='string'&&x.id.length<90&&(!owner||x[owner]===demoFarmer.id);
  });
 });
}
export interface DemoStorage {getItem(key:string):string|null;setItem(key:string,value:string):void;removeItem(key:string):void;}
export class LocalDemoWorkflow {
 private state:DemoSnapshot;
 private tick=0;
 private storage?:DemoStorage;
 private clock:()=>Date;
 constructor(storage?:DemoStorage,clock:()=>Date=()=>new Date()){
  this.storage=storage;this.clock=clock;
  this.state=createSeed();
  try {
   const raw=storage?.getItem(DEMO_STORAGE_KEY);
   // Ignore oversized or malformed saved data; no recovery of personal records.
   if(raw&&raw.length<500_000){const parsed:unknown=JSON.parse(raw);if(isValidDemoSnapshot(parsed))this.state=copy(parsed);}
  }catch{/* browser storage unavailable: ephemeral demo */}
 }
 snapshot():DemoSnapshot {return copy(this.state);}
 private save(){try{this.storage?.setItem(DEMO_STORAGE_KEY,JSON.stringify(this.state));}catch{/* still useful as in-memory demo */}}
 private nextId(prefix:string){
  this.tick++;
  const suffix=typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function'?crypto.randomUUID().slice(0,8):Math.random().toString(36).slice(2,10);
  return `DEMO-${prefix}-${this.clock().getTime()}-${this.tick}-${suffix}`;
 }
 private notify(title:string,message:string,category:Notification['category'],route:string){
  this.state.notifications.unshift({isDemo:true,id:this.nextId('NOTIF'),title,message,category,timestamp:this.clock().toISOString(),isUrgent:false,read:false,actionRoute:route});
  this.state.notifications=this.state.notifications.slice(0,MAX_RECORDS);
 }
 createPACSRequest(serviceName:string,description:string):PACSServiceRequest {
  const name=serviceName.trim().slice(0,100),notes=description.trim().slice(0,600);
  if(name.length<3||notes.length<8)throw new Error('Select a service and enter at least 8 characters of context.');
  if(this.state.pacsRequests.length>=MAX_RECORDS)throw new Error('Demo request limit reached. Reset the synthetic workspace to continue.');
  const time=this.clock().toISOString(),id=this.nextId('PACS');
  const item:PACSServiceRequest={isDemo:true,id,serviceId:'SYNTHETIC-LOCAL',serviceName:name,farmerId:this.state.farmer.id,farmerName:this.state.farmer.name,category:'SIMULATED_GUIDANCE',subject:`Demo enquiry: ${name}`,description:notes,status:'DEMO_REQUEST_CREATED',createdAt:time,updatedAt:time,requiredDocuments:[],timeline:[{date:time,status:'DEMO_REQUEST_CREATED',title:'Saved locally (demo)',description:'Not submitted to any PACS or government office.',actor:'Local prototype',isDemoEvent:true}],verificationStatus:'DEMO'};
  this.state.pacsRequests.unshift(item);this.notify('Demo PACS enquiry created',`${id}: ${name} (not submitted to PACS)`,'PACS_REQUEST','pacs-services');this.save();return copy(item);
 }
 createGrievance(category:GrievanceCategory,subject:string,description:string,relatedClaimId?:string):Grievance {
  const heading=subject.trim().slice(0,120),body=description.trim().slice(0,1500);
  if(!allowedCategories.includes(category)||heading.length<5||body.length<12)throw new Error('Select a category, add a subject (5+ characters) and details (12+ characters).');
  if(relatedClaimId && !this.state.claims.some(c=>c.id===relatedClaimId))throw new Error('Related demo claim is not in this farmer profile.');
  if(this.state.grievances.length>=MAX_RECORDS)throw new Error('Demo grievance limit reached. Reset to continue.');
  const time=this.clock().toISOString(),id=this.nextId('GRV');
  const item:Grievance={isDemo:true,id,grievanceId:id,ticketId:id,farmerId:this.state.farmer.id,farmerName:this.state.farmer.name,category,subject:heading,description:body,status:'SUBMITTED',createdAt:time,updatedAt:time,relatedClaimId,timeline:[{date:time,status:'SUBMITTED',stage:'Created locally',notes:'Simulated tracking only. Not sent to a government grievance portal.',completed:true}],verificationStatus:'DEMO',source:'KrishiSahyog local prototype'};
  this.state.grievances.unshift(item);this.notify('Demo grievance saved',`${id}: ${heading} (local simulation only)`,'GRIEVANCE_SLA','grievance-redressal');this.save();return copy(item);
 }
 /** Explicit button-driven DEMO state transitions; never connected to cooperative records. */
 updatePACSRequestStatus(id:string,next:PACSServiceRequestStatus):PACSServiceRequest {
  const item=this.state.pacsRequests.find(r=>r.id===id&&r.farmerId===this.state.farmer.id);
  if(!item)throw new Error('Local PACS request not found.');
  const allowed:Partial<Record<PACSServiceRequestStatus,PACSServiceRequestStatus[]>>={
   DRAFT:['DEMO_REQUEST_CREATED'],DEMO_REQUEST_CREATED:['INFORMATION_REQUIRED','GUIDANCE_PROVIDED'],
   INFORMATION_REQUIRED:['GUIDANCE_PROVIDED'],GUIDANCE_PROVIDED:['CLOSED'],CLOSED:[]
  };
  if(!allowed[item.status]?.includes(next))throw new Error('This PACS demo status transition is not allowed.');
  const at=this.clock().toISOString();item.status=next;item.updatedAt=at;
  item.timeline.push({date:at,status:next,title:`Simulated ${next.toLowerCase().replaceAll('_',' ')}`,description:'Advanced by local demo operator, not a PACS officer.',actor:'Local demo operator',isDemoEvent:true});
  this.notify('PACS demo status changed',`${item.id}: ${next} (not an official cooperative status)`,'PACS_REQUEST','pacs-services');
  this.save();return copy(item);
 }
 /** Explicit simulation, never a government grievance resolution or acknowledgement. */
 updateGrievanceStatus(id:string,next:GrievanceStatus):Grievance {
  const item=this.state.grievances.find(g=>g.id===id&&g.farmerId===this.state.farmer.id);
  if(!item)throw new Error('Local grievance not found.');
  const allowed:Partial<Record<GrievanceStatus,GrievanceStatus[]>>={
   SUBMITTED:['UNDER REVIEW'],ACKNOWLEDGED:['UNDER REVIEW'],'UNDER REVIEW':['ADDITIONAL INFORMATION REQUIRED','RESOLVED'],
   'ADDITIONAL INFORMATION REQUIRED':['UNDER REVIEW'],RESOLVED:['CLOSED'],REJECTED:[],CLOSED:[],FORWARDED:['UNDER REVIEW']
  };
  if(!allowed[item.status]?.includes(next))throw new Error('This grievance demo status transition is not allowed.');
  const at=this.clock().toISOString();item.status=next;item.updatedAt=at;
  item.timeline.push({date:at,status:next,stage:`Simulated ${next.toLowerCase()}`,notes:'Local operator simulation only; not acknowledged or resolved by a government office.',completed:true});
  this.notify('Grievance demo status changed',`${item.id}: ${next} (local simulation only)`,'GRIEVANCE_SLA','grievance-redressal');
  this.save();return copy(item);
 }
 /** Metadata-only. No file is uploaded, stored, read or externally verified. */
 prepareDocument(documentId:string,displayName:string):Document {
  const doc=this.state.documents.find(d=>d.id===documentId&&d.farmerId===this.state.farmer.id);
  if(!doc)throw new Error('This demo document does not belong to the selected farmer.');
  if(!/^[\p{L}\p{N} .,_()\-]{3,120}$/u.test(displayName.trim()))throw new Error('Enter a safe document label (3–120 characters).');
  // Keep the government-facing readiness status unchanged: no bytes uploaded or validated.
  doc.verificationStatus='DEMO';doc.description=`Local preparation noted: ${displayName.trim()}. No document bytes uploaded and no authority verification completed.`;
  doc.lastChecked=this.clock().toISOString();
  this.notify('Demo document preparation noted',`${doc.title}: local preparation only, not officially uploaded`,'CLAIM_UPDATE','document-locker');this.save();return copy(doc);
 }
 markNotificationRead(id:string){const item=this.state.notifications.find(n=>n.id===id);if(!item)throw new Error('Notification not found');item.read=true;this.save();}
 /** Phase 14: the UI offers both "Mark read" and "Mark unread"; previously both only marked read. */
 toggleNotificationRead(id:string){const item=this.state.notifications.find(n=>n.id===id);if(!item)throw new Error('Notification not found');item.read=!item.read;this.save();return item.read;}
 markAllRead(){this.state.notifications.forEach(n=>{n.read=true});this.save();}
 reset(){this.state=createSeed();this.tick=0;try{this.storage?.removeItem(DEMO_STORAGE_KEY)}catch{/* unavailable */}}
}
