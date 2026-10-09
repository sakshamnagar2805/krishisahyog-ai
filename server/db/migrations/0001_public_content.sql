-- KrishiSahyog Phase 2: public agricultural information only. No fabricated or personal records.
BEGIN;
CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE government_sources (
 id UUID PRIMARY KEY, authority TEXT NOT NULL, name TEXT NOT NULL, canonical_url TEXT NOT NULL UNIQUE,
 verified_host TEXT NOT NULL, jurisdiction_code TEXT NOT NULL DEFAULT 'IN',
 access_policy TEXT NOT NULL DEFAULT 'UNREVIEWED' CHECK(access_policy IN ('UNREVIEWED','PERMITTED','RESTRICTED','PROHIBITED')),
 collection_method TEXT NOT NULL DEFAULT 'NONE' CHECK(collection_method IN ('NONE','HTML','DOCUMENT','DATASET','APPROVED_API')),
 license_or_permission_notes TEXT, status TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
 last_checked_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE ingestion_runs (
 id UUID PRIMARY KEY, source_id UUID NOT NULL REFERENCES government_sources(id), job_type TEXT NOT NULL,
 started_at TIMESTAMPTZ NOT NULL DEFAULT now(), completed_at TIMESTAMPTZ,
 outcome TEXT NOT NULL CHECK(outcome IN ('RUNNING','SUCCEEDED','FAILED','SKIPPED')),
 http_status INTEGER, attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts>=0), error_class TEXT, error_message TEXT);
CREATE INDEX ingestion_runs_source_started ON ingestion_runs(source_id,started_at DESC);
CREATE TABLE source_documents (
 id UUID PRIMARY KEY, source_id UUID NOT NULL REFERENCES government_sources(id),
 original_url TEXT NOT NULL, title TEXT NOT NULL, document_type TEXT NOT NULL,
 published_at DATE, effective_at DATE, retrieved_at TIMESTAMPTZ NOT NULL,
 sha256 CHAR(64) NOT NULL, snapshot_key TEXT, access_status TEXT NOT NULL DEFAULT 'PUBLIC',
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(source_id,original_url,sha256));
CREATE INDEX source_documents_sha256_idx ON source_documents(sha256);
CREATE TABLE document_versions (
 id UUID PRIMARY KEY, document_id UUID NOT NULL REFERENCES source_documents(id),
 revision INTEGER NOT NULL CHECK(revision>0), supersedes_id UUID REFERENCES document_versions(id),
 extracted_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(document_id,revision));
CREATE TABLE extracted_passages (
 id UUID PRIMARY KEY, document_version_id UUID NOT NULL REFERENCES document_versions(id),
 page_or_section TEXT, start_offset INTEGER, end_offset INTEGER,
 extraction_confidence NUMERIC(4,3) CHECK(extraction_confidence BETWEEN 0 AND 1), original_text TEXT NOT NULL,
 CHECK(start_offset IS NULL OR start_offset>=0), CHECK(end_offset IS NULL OR start_offset IS NULL OR end_offset>=start_offset));
CREATE TABLE geography_codes (
 code TEXT PRIMARY KEY, parent_code TEXT REFERENCES geography_codes(code),
 level TEXT NOT NULL CHECK(level IN ('COUNTRY','STATE','UT','DISTRICT','BLOCK')),
 official_source TEXT NOT NULL, name TEXT NOT NULL);
CREATE TABLE schemes (
 id UUID PRIMARY KEY, scheme_code TEXT NOT NULL UNIQUE, canonical_name TEXT NOT NULL,
 authority TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE scheme_components (
 id UUID PRIMARY KEY, scheme_id UUID NOT NULL REFERENCES schemes(id), component_code TEXT NOT NULL,
 name TEXT NOT NULL, UNIQUE(scheme_id,component_code));
CREATE TABLE scheme_versions (
 id UUID PRIMARY KEY, scheme_id UUID NOT NULL REFERENCES schemes(id), version INTEGER NOT NULL CHECK(version>0),
 title_i18n JSONB NOT NULL DEFAULT '{}'::jsonb, summary_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
 verification_status TEXT NOT NULL CHECK(verification_status IN ('DRAFT','PENDING','APPROVED','REJECTED','SUPERSEDED')),
 source_document_id UUID NOT NULL REFERENCES source_documents(id), effective_from DATE, effective_to DATE,
 approved_at TIMESTAMPTZ, approved_by TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(scheme_id,version), CHECK(effective_to IS NULL OR effective_from IS NULL OR effective_to>=effective_from),
 CHECK(verification_status<>'APPROVED' OR (approved_at IS NOT NULL AND approved_by IS NOT NULL)));
CREATE INDEX scheme_versions_public_idx ON scheme_versions(scheme_id,verification_status,effective_from DESC,version DESC);
CREATE TABLE policies (
 id UUID PRIMARY KEY, policy_code TEXT NOT NULL UNIQUE, canonical_name TEXT NOT NULL,
 policy_type TEXT NOT NULL, authority TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE policy_versions (
 id UUID PRIMARY KEY, policy_id UUID NOT NULL REFERENCES policies(id), version INTEGER NOT NULL CHECK(version>0),
 title_i18n JSONB NOT NULL DEFAULT '{}'::jsonb, summary_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
 verification_status TEXT NOT NULL CHECK(verification_status IN ('DRAFT','PENDING','APPROVED','REJECTED','SUPERSEDED')),
 source_document_id UUID NOT NULL REFERENCES source_documents(id), effective_from DATE, effective_to DATE,
 approved_at TIMESTAMPTZ, approved_by TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(policy_id,version), CHECK(effective_to IS NULL OR effective_from IS NULL OR effective_to>=effective_from),
 CHECK(verification_status<>'APPROVED' OR (approved_at IS NOT NULL AND approved_by IS NOT NULL)));
CREATE INDEX policy_versions_public_idx ON policy_versions(policy_id,verification_status,effective_from DESC,version DESC);
CREATE TABLE policy_clauses (
 id UUID PRIMARY KEY, policy_version_id UUID NOT NULL REFERENCES policy_versions(id),
 clause_code TEXT NOT NULL, text_content TEXT NOT NULL, passage_id UUID REFERENCES extracted_passages(id),
 UNIQUE(policy_version_id,clause_code));
CREATE TABLE policy_amendments (
 id UUID PRIMARY KEY, prior_version_id UUID NOT NULL REFERENCES policy_versions(id),
 new_version_id UUID NOT NULL REFERENCES policy_versions(id), change_summary TEXT NOT NULL,
 CHECK(prior_version_id<>new_version_id), UNIQUE(prior_version_id,new_version_id));
CREATE TABLE scheme_policy_links (
 scheme_id UUID NOT NULL REFERENCES schemes(id), policy_id UUID NOT NULL REFERENCES policies(id),
 relationship TEXT NOT NULL, effective_from DATE, effective_to DATE,
 PRIMARY KEY(scheme_id,policy_id,relationship), CHECK(effective_to IS NULL OR effective_from IS NULL OR effective_to>=effective_from));
CREATE TABLE eligibility_rule_versions (
 id UUID PRIMARY KEY, scheme_component_id UUID NOT NULL REFERENCES scheme_components(id),
 version INTEGER NOT NULL CHECK(version>0), geography_code TEXT REFERENCES geography_codes(code),
 rule_json JSONB NOT NULL, verification_status TEXT NOT NULL CHECK(verification_status IN ('DRAFT','PENDING','APPROVED','REJECTED','SUPERSEDED')),
 effective_from DATE, effective_to DATE, approved_at TIMESTAMPTZ, approved_by TEXT,
 UNIQUE(scheme_component_id,version,geography_code),
 CHECK(verification_status<>'APPROVED' OR (approved_at IS NOT NULL AND approved_by IS NOT NULL)));
CREATE TABLE eligibility_rule_evidence (
 rule_id UUID NOT NULL REFERENCES eligibility_rule_versions(id), clause_id UUID NOT NULL REFERENCES policy_clauses(id),
 PRIMARY KEY(rule_id,clause_id));
CREATE TABLE content_reviews (
 id UUID PRIMARY KEY, content_type TEXT NOT NULL, content_id UUID NOT NULL,
 decision TEXT NOT NULL CHECK(decision IN ('PENDING','APPROVED','REJECTED')),
 reviewer TEXT, reason TEXT, reviewed_at TIMESTAMPTZ,
 CHECK(decision='PENDING' OR (reviewer IS NOT NULL AND reviewed_at IS NOT NULL)));
CREATE TABLE audit_events (
 id UUID PRIMARY KEY, actor_type TEXT NOT NULL, actor_id TEXT,
 action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id UUID,
 details JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX audit_events_created_idx ON audit_events(created_at DESC);
INSERT INTO schema_migrations(version) VALUES('0001_public_content') ON CONFLICT DO NOTHING;
COMMIT;
