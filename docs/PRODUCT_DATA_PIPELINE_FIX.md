# KrishiSahyog — Source-to-Catalog Repair

## Root causes
1. `NO_APPROVED_SOURCES`: the source registry has no reviewed and permitted active collection sources. This is a configuration/governance requirement, not a missing scheme fixture.
2. `ingest:once` collects documents and saves extraction candidates, but does **not** create scheme/policy rows. The public API reads *approved scheme_versions/policy_versions* only.
3. There was no admin workflow to create a human-verified draft linked to an ingested document. Added `content:workflow` for this missing link.
4. Local network protection, source permissions, and official-document quality checks are still deployment-dependent.

## Changes
- `server/publication/draft.ts`: validates fields, checks source is permitted and has extracted passages, inserts DRAFT scheme/policy and version transactionally with audit entry.
- `scripts/content-workflow.ts`: local-only administrative command to list ingested documents and submit/review versions. Does not expose privileged public endpoints.
- `package.json`: adds `content:workflow` script.
- `tests/phase12_draft.test.mjs`: input validation regression tests.
- No UI or application architecture changes. No demo data.

## Actual execution sequence (from project folder)
1. `npm ci` and configure `DATABASE_URL` securely in `.env`.
2. `npm run db:migrate` and `npm run pilot:diagnose`.
3. Review official site's automated collection and reuse permissions, robots policy, access controls and expected access patterns. Register **only** the reviewed source with `npm run source:register -- ./source-review.json`. The source-review file must contain genuine evidence, not invented approval.
4. Configure protected egress; only once independently verified set `INGESTION_SECURE_EGRESS=confirmed`.
5. `npm run pilot:preflight`; then `npm run ingest:once`.
6. `npm run content:workflow -- documents ./admin.json` (requires existing `admin.json`; this action ignores its contents). Use returned source document UUID with a nonzero passage count. Examine the original official document and extracted passages in the database. Verify **every** title, summary, policy/scheme code, effective date against original government evidence. No auto-created benefit amounts.
7. Create local `draft.json` containing real manually checked fields:
```
{
 "kind":"SCHEME", "sourceDocumentId":"REAL-SOURCE-DOCUMENT-UUID",
 "code":"VERIFIED_SCHEME_CODE", "title":"Exact checked title",
 "summary":"Human-verified source-backed summary", "authority":"Verified issuing department", "editorId":"editor-1"
}
```
Run `npm run content:workflow -- draft ./draft.json`. The response includes `id` and `contentType`.
8. `submit.json`: `{"contentType":"SCHEME_VERSION","contentId":"REAL-DRAFT-UUID","actorId":"editor-1","actorRole":"EDITOR"}`. Run `npm run content:workflow -- submit ./submit.json`.
9. After **independent** reviewer checks the source, `approve.json`: `{"contentType":"SCHEME_VERSION","contentId":"REAL-DRAFT-UUID","actorId":"reviewer-2","actorRole":"REVIEWER"}`. Run `npm run content:workflow -- approve ./approve.json`. Reviewer must be distinct from editor.
10. Verify `http://localhost:3000/api/v1/public/status`, `/schemes`, `/policies` and the existing UI.

## Limitations and safety
- There is **no** approved source preloaded or automatically authorized. Do not mark a site as permitted without real permission review.
- This adds manual reviewable ingestion, not automatic publication or a complete national scheme catalog.
- No live PostgreSQL or real scraping was executed in the sandbox. Validate migrations and full build on a machine with dependencies/database.
- Draft source verification currently proves a permitted source and nonempty extracted passage, not the factual accuracy of the editor's summary. Human independent review remains essential.
- Keep source-review and database credentials private, exclude `.env*`, `node_modules`, and private admin JSON from distributed ZIPs.
