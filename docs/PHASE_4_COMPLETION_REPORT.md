# Phase 4 — Document Extraction & Evidence Drafting

## Implemented
- `server/extraction/extract.ts`: conservative HTML, UTF-8 plain text and text-native PDF extraction; original passage text with page/line and extraction offsets; Hindi/English recognition; candidate phrases with linked evidence.
- `server/extraction/persist.ts`: transactional insertion into `document_versions`, `document_extraction_runs`, `extracted_passages`, `extraction_draft_candidates`; only `UNVERIFIED` candidates, never public scheme/policy versions.
- `server/db/migrations/0003_document_extraction.sql`: draft extraction state and evidence storage.
- `server/ingestion/worker.ts`: invokes extraction for changed HTML/text/PDF official-source snapshots after a permitted fetch, retaining Phase 3 secure egress gate.
- `tests/phase4_extraction.test.mjs`: eight passing focused tests.

## Important boundaries
- No actual government website ingested here. Source permission review, secure egress and a live PostgreSQL instance still required.
- Deterministic phrase extraction is **not AI-supported semantic parsing** yet. Benefits, deadlines, or eligibility are never inferred from snippets. Candidate passages are prompts for human review, not structured approved facts.
- Scanned/image-only PDFs are flagged, not OCR'd. `pdftotext` must be installed in the deployment runtime for text-native PDF extraction. Malformed PDFs return an error state.
- Basic HTML-to-text parser is conservative and does not guarantee complex table structure or complete Unicode/entity coverage. Some source pages require site-specific parsers in later work.
- Stored evidence offsets refer to each extracted page's plaintext representation, not PDF byte offsets.
- No unchanged pre-existing frontend module changed in Phase 4.

## Checks
- Node built-in test runner: 8 / 8 passed (`node --experimental-strip-types --test tests/phase4_extraction.test.mjs`).
- Full TypeScript check attempted but failed because `node_modules` is absent from the checkpoint; it reports missing React/Express/Node type packages. Not a verified complete build.
- Database migration and persisted ingestion have not been run against PostgreSQL here.

## Next
Phase 5: production scheme/policy knowledge model, document linking, normalized geography, review gates, and approved-content only queries. Before any production rollout: install exact dependencies, `npm run lint`, `npm run build`, apply migrations, verify source permissions and egress, run PostgreSQL integration tests, review document extraction with real permitted government documents.
