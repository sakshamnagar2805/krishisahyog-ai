BEGIN;
CREATE TABLE IF NOT EXISTS publication_events (
 id UUID PRIMARY KEY, content_type TEXT NOT NULL CHECK (content_type IN ('SCHEME_VERSION','POLICY_VERSION','RULE_VERSION')),
 content_id UUID NOT NULL, action TEXT NOT NULL CHECK(action IN ('SUBMIT','APPROVE','REJECT','WITHDRAW')),
 actor_id TEXT NOT NULL, reason TEXT, prior_status TEXT NOT NULL, next_status TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS publication_events_content_idx ON publication_events(content_type,content_id,created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS content_review_one_pending_idx ON content_reviews(content_type,content_id) WHERE decision='PENDING';
INSERT INTO schema_migrations(version) VALUES('0005_review_publication') ON CONFLICT DO NOTHING;
COMMIT;
