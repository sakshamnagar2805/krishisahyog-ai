import {randomUUID} from 'node:crypto';
import {getPool} from '../db/pool';
import {extractDocument} from './extract';
/** Only unverified drafts are stored. Never inserts scheme_versions/policy_versions. */
export async function persistDocumentExtraction(sourceDocumentId:string,bytes:Uint8Array,mime:string){
 const extraction=extractDocument(bytes,mime);const db=await getPool().connect();
 try{await db.query('BEGIN');const versionId=randomUUID(),runId=randomUUID();
  const prev=await db.query<{revision:number}>('SELECT COALESCE(MAX(revision),0) AS revision FROM document_versions WHERE document_id=$1',[sourceDocumentId]);
  await db.query('INSERT INTO document_versions(id,document_id,revision) VALUES($1,$2,$3)',[versionId,sourceDocumentId,Number(prev.rows[0].revision)+1]);
  await db.query(`INSERT INTO document_extraction_runs(id,document_id,document_version_id,state,language,detected_document_type,error_message) VALUES($1,$2,$3,$4,$5,$6,$7)`,[runId,sourceDocumentId,versionId,extraction.state,extraction.language,extraction.kind,extraction.error??null]);
  const passageIds:string[]=[];
  for(const p of extraction.passages){const id=randomUUID();passageIds.push(id);await db.query(`INSERT INTO extracted_passages(id,document_version_id,page_or_section,start_offset,end_offset,extraction_confidence,original_text) VALUES($1,$2,$3,$4,$5,NULL,$6)`,[id,versionId,p.location,p.startOffset,p.endOffset,p.originalText]);}
  for(const c of extraction.candidates)await db.query(`INSERT INTO extraction_draft_candidates(id,extraction_id,passage_id,field_name,proposed_text,confidence) VALUES($1,$2,$3,$4,$5,$6)`,[randomUUID(),runId,passageIds[c.evidenceIndex],c.field,c.value,c.confidence]);
  await db.query('COMMIT');return {runId,state:extraction.state,passages:passageIds.length,candidates:extraction.candidates.length};
 }catch(e){await db.query('ROLLBACK');throw e;}finally{db.release();}
}
