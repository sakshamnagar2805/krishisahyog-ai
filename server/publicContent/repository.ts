import type { Pool } from 'pg';
import type { PublicCatalogResult, PublishedContent } from './models';
type Kind = 'schemes'|'policies';
export interface CatalogFilters { search?: string; state?: string; district?: string }
export class PublicContentRepository {
  constructor(private readonly pool: Pool) {}
  async listPublished(kind: Kind, asOf = new Date(), limit = 50, offset = 0, filters: CatalogFilters = {}): Promise<PublicCatalogResult> {
    if (!Number.isInteger(limit)||limit<1||limit>100||!Number.isInteger(offset)||offset<0) throw new Error('INVALID_PAGINATION');
    const cfg=kind==='schemes'?{table:'schemes',version:'scheme_versions',foreign:'scheme_id',code:'scheme_code',geo:'scheme_version_geographies',geoForeign:'scheme_version_id'}:{table:'policies',version:'policy_versions',foreign:'policy_id',code:'policy_code',geo:'policy_version_geographies',geoForeign:'policy_version_id'};
    const params: unknown[]=[asOf.toISOString().slice(0,10)];
    let where='';
    if(filters.search?.trim()) {params.push(`%${filters.search.trim()}%`);where+=` AND (c.canonical_name ILIKE $${params.length} OR c.${cfg.code} ILIKE $${params.length} OR v.title_i18n::text ILIKE $${params.length})`;}
    // National records with no geography links remain visible; explicitly scoped records require matching codes.
    const loc=[filters.district?.trim(),filters.state?.trim(),'IN'].filter(Boolean) as string[];
    if(filters.state||filters.district){params.push(loc);where+=` AND (NOT EXISTS (SELECT 1 FROM ${cfg.geo} gg WHERE gg.${cfg.geoForeign}=v.id) OR EXISTS (SELECT 1 FROM ${cfg.geo} gg WHERE gg.${cfg.geoForeign}=v.id AND gg.geography_code=ANY($${params.length}::text[])))`;}
    const base=`FROM ${cfg.table} c JOIN LATERAL (
      SELECT v.* FROM ${cfg.version} v WHERE v.${cfg.foreign}=c.id AND v.verification_status='APPROVED' AND v.approved_at IS NOT NULL AND v.approved_by IS NOT NULL
      AND (v.effective_from IS NULL OR v.effective_from <= $1::date)
      AND (v.effective_to IS NULL OR v.effective_to >= $1::date)
      ORDER BY v.version DESC LIMIT 1
    ) v ON TRUE JOIN source_documents d ON d.id=v.source_document_id AND d.access_status='PUBLIC'
      JOIN government_sources s ON s.id=d.source_id AND s.access_policy='PERMITTED' ${where}`;
    const count=await this.pool.query<{total:string}>(`SELECT count(*)::text AS total ${base}`,params);
    const result=await this.pool.query(`SELECT c.id,c.${cfg.code} AS code,c.canonical_name,v.title_i18n,v.summary_i18n,v.version,v.effective_from,v.effective_to,
    s.id AS source_id,s.authority,d.original_url,d.id AS document_id,d.retrieved_at,d.published_at,d.sha256
    ${base} ORDER BY c.canonical_name ASC LIMIT $${params.length+1} OFFSET $${params.length+2}`,[...params,limit,offset]);
    const items:PublishedContent[]=result.rows.map(r=>({
      id:r.id,code:r.code,title:r.title_i18n?.en||r.canonical_name,summary:r.summary_i18n?.en||'',version:r.version,
      effectiveFrom:r.effective_from?new Date(r.effective_from).toISOString().slice(0,10):null,
      effectiveTo:r.effective_to?new Date(r.effective_to).toISOString().slice(0,10):null,
      verificationStatus:'VERIFIED',authority:r.authority,officialUrl:r.original_url,retrievedAt:new Date(r.retrieved_at).toISOString(),
      publishedAt:r.published_at?new Date(r.published_at).toISOString().slice(0,10):null,
      evidence:{sourceId:r.source_id,sourceUrl:r.original_url,documentId:r.document_id,retrievedAt:new Date(r.retrieved_at).toISOString(),publishedAt:r.published_at?new Date(r.published_at).toISOString().slice(0,10):null,sha256:r.sha256}
    }));
    return {status:Number(count.rows[0]?.total||0)>0?'AVAILABLE':'NO_SOURCES',items,total:Number(count.rows[0]?.total||0),...(!items.length?{message:'No approved government records match this query.'}:{})};
  }
  async getStatus(){const result=await this.pool.query(`SELECT (SELECT count(*)::int FROM government_sources WHERE access_policy='PERMITTED') AS source_count,(SELECT count(*)::int FROM scheme_versions WHERE verification_status='APPROVED') AS approved_scheme_versions,(SELECT count(*)::int FROM policy_versions WHERE verification_status='APPROVED') AS approved_policy_versions`);return result.rows[0];}
}
