# Phase 3 — Official Source Registry & Ingestion Engine

Date: 2026-10-08. Baseline: Phase 2 working tree. Existing UI/component files left unchanged.

## Delivered
- `server/db/migrations/0002_ingestion_controls.sql`: human-approved source controls, request interval, HTTP validators, content hashes and job metadata.
- `server/ingestion/secureFetch.ts`: HTTPS-only explicit host matching, DNS checks, block private/non-public addresses, redirect refusal, timeouts, streaming content-size ceilings, accepted MIME types, PDF signature checks and SHA-256.
- `server/ingestion/sourceRegistry.ts`: admin-code-only approval path requiring documented permission and robots assessment. No open URL-taking HTTP endpoint.
- `server/ingestion/worker.ts`: batch claims using DB row locks; scheduled refresh eligibility, conditional requests, immutable document-hash metadata and per-source run statuses. Requires explicit operator-confirmed network-egress policy.
- `tests/phase3_secureFetch.test.mjs`: seven unit tests using stubbed DNS/network; no fake scheme data or real government personal data.
- `npm run ingest:once` and `npm run test:ingestion` commands.

## Honest boundaries and pending gates
- **Not yet live:** No government website was fetched in this environment, no scraping permission was verified, no source was registered or activated.
- **No PostgreSQL instance available:** Migration not applied, and worker/DB concurrency, idempotence and publishing queries not end-to-end verified.
- **Network egress:** DNS validation at application level is insufficient against DNS rebinding. Confirm egress filtering or DNS-pinned HTTP proxy before setting `INGESTION_SECURE_EGRESS=confirmed`.
- **Robots and permissions:** Human review required per source before activation; URL existence is not permission to scrape.
- **No raw archive:** This phase stores metadata and hashes only; any source-text storage and parsing belongs to Phase 4 and must honor source reuse terms.
- **No frontend changes:** Public scheme/policy catalog remains empty until Phase 4/5 verification and publication.
- **Retries**: each scheduled run records a single attempt; automatic backoff/circuit breaker and per-host distributed budgets remain to be completed prior to production.
- **No complete build validation:** this offline checkout lacks project dependencies; TypeScript check reports missing dependencies. Dependency installation, full build, DB migration, and integration tests required.

## Test result
`node --experimental-strip-types --test tests/phase3_secureFetch.test.mjs`: 7 passed, 0 failed. Covers allowlists, private-IP rejection, normal response, 304, MIME and size restrictions, redirects and invalid PDF.

## Next phase
Phase 4: PDF/HTML parsing with section-level evidence and review-only draft extraction. No unreviewed facts into public API.
