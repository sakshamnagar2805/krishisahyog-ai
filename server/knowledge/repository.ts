import type {Pool} from 'pg';
import {normalizeSchemeQuery, suggestSchemeAlias} from './normalize';

/** Read-only knowledge lookups. Publication/approval is deliberately Phase 6. */
export class KnowledgeRepository {
 constructor(private readonly db:Pool){}
 async searchSchemes(term:string,limit=30){
  if(!Number.isInteger(limit)||limit<1||limit>100)throw new Error('INVALID_LIMIT');
  const normalized=normalizeSchemeQuery(term);if(normalized.length<2)return {items:[],suggestion:suggestSchemeAlias(term)};
  const result=await this.db.query(`SELECT DISTINCT s.id,s.scheme_code,s.canonical_name,s.authority
    FROM schemes s JOIN scheme_versions v ON v.scheme_id=s.id
    JOIN source_documents d ON d.id=v.source_document_id
    JOIN government_sources g ON g.id=d.source_id
    LEFT JOIN scheme_aliases a ON a.scheme_id=s.id
    WHERE v.verification_status='APPROVED' AND g.access_policy='PERMITTED'
      AND (lower(s.canonical_name) LIKE $1 OR a.normalized_alias=$2)
    ORDER BY s.canonical_name LIMIT $3`,[`%${normalized}%`,normalized,limit]);
  return {items:result.rows,suggestion:result.rows.length?null:suggestSchemeAlias(term)};
 }
 async latestApprovedScheme(code:string,geographyAncestry:string[],asOf:string){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(asOf))throw new Error('INVALID_DATE');
  if(!geographyAncestry.length)return null; // never infer nation-wide applicability
  const r=await this.db.query(`SELECT s.scheme_code,s.canonical_name,v.id AS version_id,v.version,
    v.title_i18n,v.summary_i18n,v.effective_from,v.effective_to,d.original_url,d.published_at,d.retrieved_at,
    array_agg(DISTINCT geo.geography_code) FILTER(WHERE geo.geography_code IS NOT NULL) AS geographies
    FROM schemes s JOIN scheme_versions v ON v.scheme_id=s.id
    JOIN source_documents d ON d.id=v.source_document_id
    JOIN government_sources g ON g.id=d.source_id
    JOIN scheme_version_geographies geo ON geo.scheme_version_id=v.id
    WHERE s.scheme_code=$1 AND v.verification_status='APPROVED' AND g.access_policy='PERMITTED'
      AND geo.geography_code=ANY($2::text[]) AND (v.effective_from IS NULL OR v.effective_from<=$3::date)
      AND (v.effective_to IS NULL OR v.effective_to>=$3::date)
    GROUP BY s.scheme_code,s.canonical_name,v.id,d.id
    ORDER BY v.version DESC LIMIT 1`,[code,geographyAncestry,asOf]);
  return r.rows[0]??null;
 }
 async relatedApprovedPolicies(schemeCode:string,asOf:string){
  const r=await this.db.query(`SELECT p.policy_code,p.canonical_name,l.relationship,v.id AS version_id,v.version,
   v.title_i18n,v.effective_from,v.effective_to,d.original_url,d.published_at
   FROM schemes s JOIN scheme_policy_links l ON l.scheme_id=s.id
   JOIN policies p ON p.id=l.policy_id JOIN policy_versions v ON v.policy_id=p.id
   JOIN source_documents d ON d.id=v.source_document_id
   JOIN government_sources g ON g.id=d.source_id
   WHERE s.scheme_code=$1 AND v.verification_status='APPROVED' AND g.access_policy='PERMITTED'
     AND (v.effective_from IS NULL OR v.effective_from<=$2::date)
     AND (v.effective_to IS NULL OR v.effective_to>=$2::date)
     AND (l.effective_from IS NULL OR l.effective_from<=$2::date)
     AND (l.effective_to IS NULL OR l.effective_to>=$2::date)
   ORDER BY p.canonical_name,v.version DESC`,[schemeCode,asOf]);
  return r.rows;
 }
 async policyVersionTimeline(policyCode:string){
  const r=await this.db.query(`SELECT v.version,v.verification_status,v.effective_from,v.effective_to,
    d.original_url,d.published_at FROM policies p JOIN policy_versions v ON v.policy_id=p.id
    JOIN source_documents d ON d.id=v.source_document_id WHERE p.policy_code=$1
    ORDER BY v.version DESC`,[policyCode]);return r.rows;
 }
}
