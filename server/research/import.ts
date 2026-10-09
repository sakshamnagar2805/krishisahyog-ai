import {randomUUID} from 'node:crypto';
import type {Pool} from 'pg';
import {datasetHash,recordHash,validateResearchDataset} from './model.ts';

/** Idempotent staging import. Never alters government_sources, schemes, scheme_versions, policies, or eligibility rules. */
export async function importResearchDataset(pool:Pool,raw:unknown){
 const dataset=validateResearchDataset(raw);
 const client=await pool.connect();
 try{
  await client.query('BEGIN');
  let inserted=0,updated=0,unchanged=0;
  for(const r of dataset.records){
   const hash=recordHash(r);
   const prev=await client.query<{record_sha256:string}>(`SELECT record_sha256 FROM research_catalog_records WHERE code=$1 FOR UPDATE`,[r.code]);
   if(prev.rows[0]?.record_sha256===hash){unchanged++;continue;}
   await client.query(`INSERT INTO research_catalog_records
    (code,name,category,authority,geographic_scope,summary,eligibility_summary,farmer_action,official_primary_source,official_secondary_source,research_checked_on,research_status,production_status,review_notes,record_sha256)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,category=EXCLUDED.category,authority=EXCLUDED.authority,
     geographic_scope=EXCLUDED.geographic_scope,summary=EXCLUDED.summary,eligibility_summary=EXCLUDED.eligibility_summary,
     farmer_action=EXCLUDED.farmer_action,official_primary_source=EXCLUDED.official_primary_source,
     official_secondary_source=EXCLUDED.official_secondary_source,research_checked_on=EXCLUDED.research_checked_on,
     research_status=EXCLUDED.research_status,production_status=EXCLUDED.production_status,
     review_notes=EXCLUDED.review_notes,record_sha256=EXCLUDED.record_sha256,revised_at=now()`,
    [r.code,r.name,r.category,r.authority,r.geographic_scope,r.summary,r.eligibility_summary,r.farmer_action,
     r.official_primary_source,r.official_secondary_source,r.research_checked_on,r.research_status,r.production_status,r.review_notes,hash]);
   if(prev.rowCount)updated++;else inserted++;
  }
  await client.query(`INSERT INTO research_import_log(id,dataset_version,record_count,dataset_sha256) VALUES($1,$2,$3,$4)`,
   [randomUUID(),dataset.dataset_version,dataset.records.length,datasetHash(dataset)]);
  await client.query('COMMIT');
  return {status:'STAGED_FOR_EDITORIAL_REVIEW',total:dataset.records.length,inserted,updated,unchanged,approved:0};
 }catch(err){await client.query('ROLLBACK');throw err;}finally{client.release();}
}
