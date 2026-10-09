/** Phase 11: read-only operational readiness checks; no demo records, no network requests. */
export const requiredMigrations=['0001_public_content','0002_ingestion_controls','0003_document_extraction','0004_knowledge_model','0005_review_publication'];
export function evaluatePilotReadiness(input:{migrations:string[];sources:Array<{id:string;access_policy:string;status:string;permission_reviewed_at:string|null;robots_reviewed_at:string|null;reviewed_by:string|null}>;secureEgress:boolean}){
 const missingMigrations=requiredMigrations.filter(name=>!input.migrations.includes(name));
 const approvedSources=input.sources.filter(s=>s.access_policy==='PERMITTED'&&s.status==='ACTIVE'&&!!s.permission_reviewed_at&&!!s.robots_reviewed_at&&!!s.reviewed_by);
 const blockers=[...(missingMigrations.length?['MISSING_DATABASE_MIGRATIONS']:[]),...(!input.secureEgress?['SECURE_EGRESS_UNVERIFIED']:[]),...(!approvedSources.length?['NO_APPROVED_SOURCES']:[])];
 return {ready:blockers.length===0,blockers,missingMigrations,approvedSourceCount:approvedSources.length,approvedSourceIds:approvedSources.map(s=>s.id)};
}
