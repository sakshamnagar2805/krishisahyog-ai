BEGIN;
CREATE TABLE IF NOT EXISTS document_extraction_runs (
 id UUID PRIMARY KEY, document_id UUID NOT NULL REFERENCES source_documents(id),
 document_version_id UUID REFERENCES document_versions(id),
 state TEXT NOT NULL CHECK(state IN ('EXTRACTED','NO_TEXT','SCANNED_OR_IMAGE_ONLY','PARSER_ERROR','AMBIGUOUS')),
 language TEXT NOT NULL DEFAULT 'unknown', detected_document_type TEXT NOT NULL DEFAULT 'UNKNOWN',
 error_message TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS extraction_draft_candidates (
 id UUID PRIMARY KEY, extraction_id UUID NOT NULL REFERENCES document_extraction_runs(id),
 passage_id UUID NOT NULL REFERENCES extracted_passages(id),
 field_name TEXT NOT NULL, proposed_text TEXT NOT NULL, confidence TEXT NOT NULL DEFAULT 'LOW',
 review_status TEXT NOT NULL DEFAULT 'UNVERIFIED' CHECK(review_status IN ('UNVERIFIED','REVIEWED','REJECTED')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS extraction_candidate_review_idx ON extraction_draft_candidates(review_status,created_at DESC);
INSERT INTO schema_migrations(version) VALUES('0003_document_extraction') ON CONFLICT DO NOTHING;
COMMIT;
