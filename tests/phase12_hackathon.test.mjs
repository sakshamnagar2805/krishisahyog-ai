import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateResearchDataset,recordForPreview} from '../server/research/model.ts';
import {findResearchMatches,researchTokens} from '../src/services/public/researchJourney.ts';
import {rankApprovedEvidence,questionTerms,scoreEvidence} from '../server/assistant/relevance.ts';
import {answerGrounded,retrieveApproved} from '../server/assistant/grounded.ts';

const dataset=validateResearchDataset(JSON.parse(readFileSync(new URL('../data/research/government_scheme_research.json',import.meta.url),'utf8')));
const research=dataset.records.map(recordForPreview);
const evidence=(code,title,summary,verified=true)=>({
 id:code,code,title,summary,version:1,effectiveFrom:null,effectiveTo:null,
 verificationStatus:verified?'VERIFIED':'DRAFT',authority:'Test',officialUrl:'https://example.gov.in/doc',
 retrievedAt:'2026-10-01',publishedAt:'2026-09-30',evidence:{sourceUrl:'https://example.gov.in/doc'}
});
const approved=[
 evidence('PMFBY','Pradhan Mantri Fasal Bima Yojana','Government crop insurance support and claims'),
 evidence('PM_KUSUM','PM-KUSUM solar pump','Solar agricultural pump guidance'),
 evidence('KCC','Kisan Credit Card','Agriculture loan credit'),
];
test('Phase 12 data source: all 12 research entries remain unapproved',()=>{
 assert.equal(research.length,12);
 assert.ok(research.every(r=>r.verificationStatus==='RESEARCH_ONLY_NOT_APPROVED'));
 assert.ok(research.every(r=>r.eligibilityStatus==='NOT_EVALUATED'));
});
test('local research journey: farmer insurance, solar pump, KCC questions',()=>{
 assert.equal(findResearchMatches(research,'I need crop insurance')[0].code,'PMFBY');
 assert.equal(findResearchMatches(research,'How can I install a solar pump?')[0].code,'PM_KUSUM');
 assert.equal(findResearchMatches(research,'Where can I get a crop loan?')[0].code,'KCC_MISS');
});
test('research journey: no guessing on unrelated input',()=>{
 assert.deepEqual(findResearchMatches(research,'quantum blockchain satellite')[0],undefined);
 assert.ok(researchTokens('I need solar pumps').includes('solar'));
});
test('verified evidence: sentence tokenization and synonym support',()=>{
 assert.ok(questionTerms('How can I get crop insurance for my field?').includes('pmfby'));
 assert.ok(scoreEvidence(approved[0],questionTerms('I need crop insurance'))>0);
 assert.equal(rankApprovedEvidence(approved,'Can I get a solar pump subsidy?')[0].code,'PM_KUSUM');
 assert.equal(rankApprovedEvidence(approved,'What is the crop insurance claim process?')[0].code,'PMFBY');
});
test('verified evidence: unapproved and unrelated excluded; code context prioritizes approved matching scheme',()=>{
 assert.deepEqual(rankApprovedEvidence([evidence('DRAFT','Solar scheme','solar pump',false)],'solar pump'),[]);
 assert.deepEqual(rankApprovedEvidence(approved,'quantum physics'),[]);
 assert.deepEqual(rankApprovedEvidence(approved,'I want information', 'KCC').map(x=>x.code),['KCC']);
 assert.deepEqual(rankApprovedEvidence(approved,'insurance claim', 'NON_EXISTENT'),[]);
 assert.deepEqual(rankApprovedEvidence([evidence('DRAFT','Solar scheme','solar',false)],'solar','DRAFT'),[]);
});
test('approved answer: a full farmer question retrieves source and cited response',async()=>{
 const repo={listPublished:async (kind,date,limit,offset)=>({items:kind==='schemes'&&offset===0?approved:[],total:kind==='schemes'?3:0})};
 const r=await answerGrounded(repo,'How can I get solar pump assistance?','en',async(instruction,prompt)=>{
  assert.match(instruction,/ONLY/);
  assert.match(prompt,/PM-KUSUM/);
  return 'The approved summary mentions solar pumps [1].';
 });
 assert.equal(r.status,'ANSWERED');
 assert.equal(r.sources[0].title,'PM-KUSUM solar pump');
 assert.equal(r.eligibility,'NOT_ASSESSED');
});
test('approved assistant: without approved records no model is invoked',async()=>{
 let called=0;
 const repo={listPublished:async()=>({items:[],total:0})};
 const r=await answerGrounded(repo,'Tell me about loans','en',async()=>{called++;return 'fabricated [1]';});
 assert.equal(r.status,'NO_VERIFIED_SOURCES');assert.equal(called,0);
});
test('approved source retrieval never promotes research data',async()=>{
 const repo={listPublished:async(kind)=>({items:kind==='schemes'?[...approved,evidence('RESEARCH','Research only','Insurance',false)]:[],total:0})};
 const r=await retrieveApproved(repo,'crop insurance');
 assert.ok(r.some(x=>x.title.includes('Bima')));
 assert.ok(!r.some(x=>x.title==='Research only'));
});
