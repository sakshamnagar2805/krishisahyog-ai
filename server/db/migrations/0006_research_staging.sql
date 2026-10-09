BEGIN;
-- Editorial research imports are NOT official source_documents, verified scheme_versions, or policies.
CREATE TABLE IF NOT EXISTS research_catalog_records (
  code TEXT PRIMARY KEY CHECK(code ~ '^[A-Z][A-Z0-9_-]{2,79}$'),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  authority TEXT NOT NULL,
  geographic_scope TEXT NOT NULL,
  summary TEXT NOT NULL,
  eligibility_summary TEXT NOT NULL,
  farmer_action TEXT NOT NULL,
  official_primary_source TEXT NOT NULL,
  official_secondary_source TEXT,
  research_checked_on DATE NOT NULL,
  research_status TEXT NOT NULL CHECK(research_status='OFFICIAL_SOURCE_RESEARCHED_NOT_APPROVED_FOR_AUTO_PUBLICATION'),
  production_status TEXT NOT NULL CHECK(production_status='PENDING_EDITOR_AND_LEGAL_REVIEW'),
  review_notes TEXT NOT NULL,
  record_sha256 CHAR(64) NOT NULL,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revised_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS research_import_log (
 id UUID PRIMARY KEY, dataset_version TEXT NOT NULL, record_count INTEGER NOT NULL CHECK(record_count>=0),
 dataset_sha256 CHAR(64) NOT NULL, imported_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO schema_migrations(version) VALUES('0006_research_staging') ON CONFLICT DO NOTHING;
COMMIT;
