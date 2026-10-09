import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateResearchDataset,recordHash,recordForPreview} from '../server/research/model.ts';
import {isLocalPreviewAllowed} from '../server/research/access.ts';
import {importResearchDataset} from '../server/research/import.ts';
import {validateCandidateSource} from '../server/research/candidate.ts';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const dataset=JSON.parse(read('../data/research/government_scheme_research.json'));
const valid=validateResearchDataset(dataset);

test('all 12 researched agricultural sources validate without personal records',()=>{
 assert.equal(valid.records.length,12);
 assert.ok(valid.records.every(r=>r.personal_data_included===false));
 assert.equal(new Set(valid.records.map(r=>r.code)).size,12);
 assert.ok(valid.records.some(r=>r.code==='PM_KISAN'));
});
test('not eligible for automatic government approval or individual determination',()=>{
 for(const r of valid.records){
  assert.equal(recordForPreview(r).verificationStatus,'RESEARCH_ONLY_NOT_APPROVED');
  assert.equal(recordForPreview(r).eligibilityStatus,'NOT_EVALUATED');
  assert.match(recordHash(r),/^[a-f0-9]{64}$/);
 }
});
test('reject personal data, forged approvals, duplicates, extra unknown fields and invalid urls',()=>{
 const variant=(fn)=>{const d=structuredClone(dataset);fn(d);return d;};
 assert.throws(()=>validateResearchDataset(variant(d=>d.records[0].personal_data_included=true)));
 assert.throws(()=>validateResearchDataset(variant(d=>d.records[0].production_status='APPROVED')));
 assert.throws(()=>validateResearchDataset(variant(d=>d.records[1].code=d.records[0].code)));
 assert.throws(()=>validateResearchDataset(variant(d=>d.records[0].official_primary_source='http://pmkisan.gov.in/')));
 assert.throws(()=>validateResearchDataset(variant(d=>d.records[0].aadhar='1234')));
 assert.throws(()=>validateResearchDataset(variant(d=>d.records[0].research_checked_on='2026-02-31')));
});
test('preview is opt-in, local-only, and disabled in production',()=>{
 assert.equal(isLocalPreviewAllowed({NODE_ENV:'development',RESEARCH_PREVIEW_ENABLED:'true'},'127.0.0.1'),true);
 assert.equal(isLocalPreviewAllowed({NODE_ENV:'development',RESEARCH_PREVIEW_ENABLED:'true'},'8.8.8.8'),false);
 assert.equal(isLocalPreviewAllowed({NODE_ENV:'production',RESEARCH_PREVIEW_ENABLED:'true'},'127.0.0.1'),false);
 assert.equal(isLocalPreviewAllowed({NODE_ENV:'development'},'127.0.0.1'),false);
});
test('import only touches editorial staging and logs, with safe idempotent reimport',async()=>{
 const store=new Map();const sql=[];
 const client={async query(query,values=[]){sql.push(query);if(query.startsWith('SELECT record_sha256'))return {rowCount:store.has(values[0])?1:0,rows:store.has(values[0])?[{record_sha256:store.get(values[0])}]:[]};
   if(query.startsWith('INSERT INTO research_catalog_records')){store.set(values[0],values.at(-1));return {rowCount:1,rows:[]};}
   return {rowCount:1,rows:[]};},release(){}};
 const fakePool={async connect(){return client;}};
 const first=await importResearchDataset(fakePool,dataset);
 const second=await importResearchDataset(fakePool,dataset);
 assert.deepEqual([first.inserted,first.approved,second.unchanged,store.size],[12,0,12,12]);
 assert.equal(sql.filter(q=>q==='BEGIN').length,2);
 assert.equal(sql.filter(q=>q==='COMMIT').length,2);
 assert.equal(sql.some(q=>/INSERT INTO (schemes|scheme_versions|policy_versions|government_sources)\b/.test(q)),false);
});
test('research mode retains original navigation and does not replace verified catalog',()=>{
 const app=read('../src/App.tsx');
 const repo=read('../server/publicContent/repository.ts');
 for(const txt of ['<Header','<Sidebar','<Footer','<ResearchPreviewPanel','<SchemeDiscoveryPanel','<VerifiedAssistantPanel']) assert.ok(app.includes(txt),txt);
 assert.match(repo,/verification_status='APPROVED'/);
 assert.match(read('../server/research/previewApi.ts'),/LOCAL_RESEARCH_PREVIEW/);
});

test('manual research-to-draft requires real permitted source evidence on a matching official host',()=>{
 const good={researchPrimary:'https://pmkisan.gov.in/',researchSecondary:'https://pmkisan.gov.in/Documents/Guidelines.pdf',documentUrl:'https://pmkisan.gov.in/Documents/Current.pdf',accessPolicy:'PERMITTED',sourceStatus:'ACTIVE',documentAccess:'PUBLIC',passages:2};
 assert.equal(validateCandidateSource(good),true);
 assert.throws(()=>validateCandidateSource({...good,documentUrl:'https://example.org/doc.pdf'}));
 assert.throws(()=>validateCandidateSource({...good,accessPolicy:'UNREVIEWED'}));
 assert.throws(()=>validateCandidateSource({...good,passages:0}));
});
