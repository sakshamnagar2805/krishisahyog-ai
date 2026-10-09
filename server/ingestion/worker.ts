import "../config/loadEnv";
import {randomUUID} from 'node:crypto';
import {getPool,closePool} from '../db/pool';
import {secureFetch,type FetchMode} from './secureFetch';
import {persistDocumentExtraction} from '../extraction/persist';

type Source={id:string;canonical_url:string;verified_host:string;collection_method:string;max_bytes:number;etag:string|null;last_modified:string|null;last_content_sha256:string|null;request_interval_seconds:number};

export async function collectDueSources(limit=5):Promise<{sourceId:string;outcome:string}[]> {
  if(process.env.INGESTION_SECURE_EGRESS!=='confirmed') throw new Error('EGRESS_POLICY_NOT_CONFIRMED');
  if(!Number.isInteger(limit)||limit<1||limit>20) throw new Error('INVALID_LIMIT');
  const pool=getPool();const results:{sourceId:string;outcome:string}[]=[];
  // A row lock prevents duplicate processing in a single DB-backed fleet. Do not hold it while doing I/O.
  const claim=await pool.connect();let sources:Source[]=[];
  try {
    await claim.query('BEGIN');
    const selected=await claim.query<Source>(`SELECT id,canonical_url,verified_host,collection_method,max_bytes,etag,last_modified,last_content_sha256,request_interval_seconds
       FROM government_sources WHERE access_policy='PERMITTED' AND status='ACTIVE'
       AND permission_reviewed_at IS NOT NULL AND robots_reviewed_at IS NOT NULL AND reviewed_by IS NOT NULL
       AND collection_method IN ('HTML','DOCUMENT','DATASET') AND (next_check_at IS NULL OR next_check_at<=now())
       ORDER BY next_check_at NULLS FIRST LIMIT $1 FOR UPDATE SKIP LOCKED`,[limit]);
    sources=selected.rows;
    for(const s of sources)await claim.query(`UPDATE government_sources SET next_check_at=now()+make_interval(secs=>$2::integer) WHERE id=$1`,[s.id,s.request_interval_seconds]);
    await claim.query('COMMIT');
  }catch(e){await claim.query('ROLLBACK');throw e;}finally{claim.release();}
  for(const s of sources){
    const id=randomUUID();let outcome='FAILED';let status:number|null=null;let digest:string|null=null;let count:number|null=null;let error:string|null=null;
    try {
      await pool.query(`INSERT INTO ingestion_runs(id,source_id,job_type,outcome,attempts) VALUES($1,$2,'COLLECT','RUNNING',1)`,[id,s.id]);
      const reply=await secureFetch(s.canonical_url,s.verified_host,s.collection_method as FetchMode,{maxBytes:s.max_bytes,etag:s.etag,lastModified:s.last_modified});
      status=reply.status;digest=reply.sha256??null;count=reply.bytes?.byteLength??null;
      if(reply.outcome==='NOT_MODIFIED'||digest===s.last_content_sha256){outcome='UNCHANGED';}
      else {
        // Phase 3 records only hash and metadata, never unreviewed content as a published scheme.
        const documentId=randomUUID();
        const inserted=await pool.query<{id:string}>(`INSERT INTO source_documents(id,source_id,original_url,title,document_type,retrieved_at,sha256,access_status)
        VALUES($1,$2,$3,$4,$5,now(),$6,'PUBLIC') ON CONFLICT(source_id,original_url,sha256) DO NOTHING RETURNING id`,
          [documentId,s.id,s.canonical_url,'Unreviewed official source snapshot',s.collection_method,digest]);
        if(inserted.rows.length && reply.bytes && reply.contentType && ['text/html','application/xhtml+xml','text/plain','application/pdf'].includes(reply.contentType)){
          await persistDocumentExtraction(inserted.rows[0].id,reply.bytes,reply.contentType);
        }
        outcome='CHANGED';
      }
      await pool.query(`UPDATE government_sources SET last_checked_at=now(),last_content_sha256=COALESCE($2,last_content_sha256),etag=COALESCE($3,etag),last_modified=COALESCE($4,last_modified) WHERE id=$1`,[s.id,digest,reply.etag??null,reply.lastModified??null]);
    }catch(e){error=e instanceof Error?e.message:'UNKNOWN_FETCH_ERROR';outcome='FAILED';}
    await pool.query(`UPDATE ingestion_runs SET completed_at=now(), outcome=$2,http_status=$3,bytes_received=$4,content_sha256=$5,result_type=$6,error_class=$7,error_message=$7 WHERE id=$1`,[id,outcome==='FAILED'?'FAILED': 'SUCCEEDED',status,count,digest,outcome,error]);
    results.push({sourceId:s.id,outcome});
  }
  return results;
}

if(process.argv[1]?.endsWith('worker.ts')){
  collectDueSources(Number(process.env.INGESTION_BATCH_SIZE||5)).then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error(e);process.exitCode=1;}).finally(closePool);
}
