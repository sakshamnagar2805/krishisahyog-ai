/** Read-only, candid hackathon preflight. No government website requests. */
import '../server/config/loadEnv';
import {readFile} from 'node:fs/promises';
import {validateResearchDataset} from '../server/research/model';
import {getPool,closePool} from '../server/db/pool';
import {PublicContentRepository} from '../server/publicContent/repository';

async function main(){
 const raw=JSON.parse(await readFile('data/research/government_scheme_research.json','utf8'));
 const dataset=validateResearchDataset(raw);
 const previewConfigured=process.env.RESEARCH_PREVIEW_ENABLED==='true'&&process.env.NODE_ENV!=='production';
 const key=(process.env.GEMINI_API_KEY||'').trim();
 const modelConfigured=!!key&&!/^(MY_|YOUR_|<)/i.test(key);
 const result:{check:string;status:'PASS'|'BLOCKED'|'NOT_VERIFIED';detail:string}[]=[
  {check:'Research dataset validity',status:'PASS',detail:`${dataset.records.length} research records (not approved)`},
  {check:'Local research preview enabled',status:previewConfigured?'PASS':'BLOCKED',detail:previewConfigured?'Local preview flag is enabled; localhost restriction still applies':'Set RESEARCH_PREVIEW_ENABLED=true for local development only'},
 ];
 let stagingCount=0;let approvedCount=0;
 try{
  const pool=getPool();
  const migrations=await pool.query<{version:string}>('SELECT version FROM schema_migrations');
  const versions=new Set(migrations.rows.map(r=>r.version));
  const migrated=versions.has('0006_research_staging');
  result.push({check:'Research database migration',status:migrated?'PASS':'BLOCKED',detail:migrated?'0006 present':'Run npm run db:migrate'});
  if(migrated){
   const staged=await pool.query<{n:string}>('SELECT count(*)::text AS n FROM research_catalog_records');
   stagingCount=Number(staged.rows[0]?.n||0);
   result.push({check:'Research records in database',status:stagingCount>=dataset.records.length?'PASS':'BLOCKED',detail:`${stagingCount} staged; run npm run research:import if fewer than ${dataset.records.length}`});
  }
  const published=await new PublicContentRepository(pool).listPublished('schemes',new Date(),1,0);
  approvedCount=published.total;
  result.push({check:'Approved published schemes',status:approvedCount>0?'PASS':'NOT_VERIFIED',detail:`${approvedCount} published scheme records (not required for local research walkthrough)`});
 }catch(e){result.push({check:'Local PostgreSQL connection',status:'BLOCKED',detail:(e as Error).message});}
 finally{await closePool();}
 result.push({check:'Gemini key configured',status:modelConfigured?'PASS':'NOT_VERIFIED',detail:modelConfigured?'Server-side key is set; actual provider request still untested':'Approved-source AI unavailable without server-side key'});
 const researchWalkthroughReady=previewConfigured&&stagingCount>=dataset.records.length;
 // Only claim preparation, never claim live UI/AI/API tested by this script.
 console.log(JSON.stringify({researchWalkthroughReady,approvedAnswerConfigured:modelConfigured&&approvedCount>0,
  liveEndToEndVerified:false,checks:result,
  next:researchWalkthroughReady?'Open localhost:3000 and manually test research search, details and source links':'Fix BLOCKED checks, then rerun'},null,2));
 if(!researchWalkthroughReady)process.exitCode=2;
}
main().catch(e=>{console.error('HACKATHON_PREFLIGHT_FAILED:',(e as Error).message);process.exitCode=1;});
