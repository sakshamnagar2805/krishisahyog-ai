# Resolving NO_APPROVED_SOURCES and an empty government catalog

## What the observed preflight means

`missingMigrations: []` proves the migration names have been recorded in `schema_migrations` for the configured database. `approvedSourceCount: 0` means that database has no source meeting the approved/active/reviewed requirements. This is a readiness blocker, not a TypeScript or React error.

The site stays empty for a separate reason: the ingestion worker collects source documents and unverified extraction drafts, **not published scheme/policy versions**. A reviewer must first create genuine, source-evidenced scheme/policy versions and have a different reviewer approve them. Do not manually flip draft rows to APPROVED or seed sample government records.

## 1. Check you are working against the correct database

Run from the project folder (not inside `node_modules`):

```powershell
npm run pilot:diagnose
npm run db:migrate
npm run pilot:preflight
```

Check the public backend while running `npm run dev`:

```
http://localhost:3000/api/v1/public/status
http://localhost:3000/api/v1/public/schemes
http://localhost:3000/api/v1/public/policies
```

Expect scheme/policy `items: []` until actual extracted records are reviewed and published. Vite supplies the public API middleware during development, while `npm start` serves the built app.

## 2. Review a public official source BEFORE registering it

Select an exact URL for one agriculture scheme page, public notification page or text-native official guideline PDF. Check the actual site's published access/reuse rules, robots policy and any automated-fetch restrictions. Record verifiable permission evidence and a documented robots review. If automated collection is prohibited or ambiguous, **do not register it as PERMITTED**; seek permission or use a documented official download process. Do not target government beneficiary data, login flows or CAPTCHA/OTP pages.

Create a private `source-review.json` OUTSIDE the upload ZIP, using this template (placeholders are not evidence):

```json
{
  "authority": "CONFIRMED_GOVERNMENT_DEPARTMENT",
  "name": "SPECIFIC_PUBLIC_SCHEME_DOCUMENT",
  "url": "https://VERIFIED_HOST/path/to/official/document",
  "host": "VERIFIED_HOST",
  "jurisdiction": "IN",
  "method": "HTML",
  "reviewedBy": "REAL_REVIEWER_ID",
  "permissionEvidence": "VERIFIABLE published terms, permission reference and review date",
  "robotsEvidence": "VERIFIABLE robots policy URL, relevant rule and review date",
  "requestIntervalSeconds": 86400
}
```

Use `DOCUMENT` for PDFs or `DATASET` for permitted CSV/JSON/XML. The exact URL and host must match. Run:

```powershell
npm run source:register -- .\source-review.json
npm run pilot:preflight
```

The registration command validates the provided source and enforces the existing approval criteria. It does **not** verify whether your permission assertions are true; the designated reviewer is accountable for that manual check. Do not expose this command through a public endpoint. `source-review.json` should not be committed if it contains sensitive internal review notes.

## 3. Configure protected outbound networking

The worker refuses to fetch unless `INGESTION_SECURE_EGRESS=confirmed`. Do **not** set that merely to pass preflight. The application has hostname/DNS checks, but those alone do not stop DNS rebinding between validation and connection. Deploy network-layer public-IP-only egress, DNS pinning or an approved egress proxy, with destination and redirect restrictions. Validate this separately.

Once configured, run:

```powershell
npm run pilot:preflight
npm run ingest:once
```

Review `ingestion_runs`, `source_documents`, `document_extraction_runs`, `extracted_passages` and `extraction_draft_candidates` in your DB. `ingest:once` generates **unverified drafts**, not published schemes.

## 4. Publish genuine scheme/policy records

The current project contains a review service (`server/review/workflow.ts`), **not** a complete administrative UI/CLI to transform extraction candidates into scheme/policy versions and submit/approve them. That missing workflow must be implemented and exercised before any published data appears. Reviews must preserve source document IDs, hash, evidence, revision, correct geography, publication/effective dates, and independent review. Then verify:

```text
GET /api/v1/public/status   -> publishedSchemeVersions > 0
GET /api/v1/public/schemes  -> source-backed published records
GET /api/v1/public/policies -> source-backed published records if policies approved
```

## Additional checks

- Ensure npm and PostgreSQL processes run against the same `DATABASE_URL`.
- The CLI/migration scripts load `.env` using `dotenv/config`. The server also loads `.env.local`. If the URL is only in `.env.local`, set `DOTENV_CONFIG_PATH=.env.local` in the terminal when using CLI scripts, or use an uncommitted `.env` for CLI configuration.
- The public API will correctly return empty results even when scraping has found documents, until a reviewer publishes records.
- Scanned PDFs require separate OCR/review and are not silently treated as extracted text.
- Never include `.env`, `.env.local`, real keys, `node_modules`, or permission-review files containing sensitive information in uploaded ZIPs.
