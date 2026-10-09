# Phase 14 Security Review

Method: the actual attack surface was enumerated from the code (`server/`, `src/`, `vite.config.ts`, migrations), then each finding was confirmed by a live request, a browser run or a DB test before it was prioritized. Severity is for the **supervised localhost demo** unless marked *(production)*.

## 1. Attack surface

| Surface | Exposure | Notes |
|---|---|---|
| Public read API (`/api/v1/public/*`) | Anonymous | Parameterized SQL, bounded pagination (≤100), length-limited filters |
| AI `/ask` | Anonymous, POST JSON ≤ 8 kB | Server-side Gemini key; approved records only |
| Research preview (`/api/v1/internal/research-preview`) | Loopback only, opt-in | Staging data, `verified:false` |
| Admin/private (`/api/v1/admin`, `/api/v1/private`) | Always 401 | Placeholder; no implementation behind it |
| Review/publication (`applyReview`) | **Not exposed over HTTP** | Service/CLI only |
| Ingestion (`secureFetch`, worker) | Outbound only, gated | Blocked by `INGESTION_SECURE_EGRESS` + zero permitted sources |
| Browser `localStorage` | This browser only | Synthetic demo snapshot; validated on load |
| File upload | **None** | Document "upload" is metadata-only; no bytes leave the browser |
| CSRF | Not applicable today | No cookies or sessions; the only POST is anonymous `/ask` |

## 2. Findings and fixes

| # | Severity | Finding | Evidence | Status |
|---|---|---|---|---|
| S1 | **Critical (availability)** | Any API request crashed the dev/preview server (express routers in the Vite connect stack). Trivial remote DoS where the dev server is reachable, and it breaks the demo. | `baseline_dev_crash.log` | **Fixed**: `server/http/apiApp.ts`; test 1 |
| S2 | **High (availability)** | An unhandled `pg` Pool `'error'` exits the process on any DB restart or network drop. | Live `pg_ctl stop` | **Fixed**: `server/db/pool.ts` listener (logs code only, never the DSN); test 13 |
| S3 | **High (data separation)** | `NODE_ENV=development` in `.env.local` made `vite build` emit a dev bundle in which `import.meta.env.DEV` is true. Demo isolation then rested only on the hostname check, and the synthetic demo chunk shipped in every build. | `verify-production-bundle` on the Phase 13 build flagged `REACT_DEV_RUNTIME`, `SYNTHETIC_FARMER_ID`, `DEMO_CHUNK_EMITTED` | **Fixed**: forced-production build, demo compiled out, verifier fails the build; tests 4–5; `npm start` checks |
| S4 | Medium | Research preview trusted only the loopback socket, so a same-host reverse proxy or a DNS-rebinding page could reach it under `npm start` (Vite dev already validates `Host`). | curl with `X-Forwarded-For` / `Host: evil.example` | **Fixed**: header and Host checks; test 3 |
| S5 | Medium | Error leakage: malformed JSON fell through to Express's default HTML error page (stack trace when not production); unknown `/api` paths returned SPA HTML with 200. | curl | **Fixed**: JSON 400/404/413/415/500 with no stack; test 1 |
| S6 | Medium (cost/abuse) | `/ask` had no rate limit and no upstream timeout. | code review | **Fixed**: 30 req/min per socket address, 20 s Gemini timeout; test 14. *(production: needs an edge/global limiter)* |
| S7 | Low | Missing `nosniff` and `no-store`; `X-Powered-By` disclosed. | headers | **Fixed** on `/api` and the app |
| S8 | Low | Staged research URLs rendered as `href` without a client-side scheme check (the importer already enforced https). | code | **Fixed**: `isHttps` guard; test 8 |
| S9 | Low (supply chain, build-time) | `source-map-js` ≤1.2.1 ReDoS-style DoS (GHSA-68fv-2mgg-jv7q). | `npm audit` | **Fixed**: 1.2.2 via targeted lockfile update; 0 vulnerabilities |
| S10 | Low (trust/UX) | The demo PACS "collection slip" token could be mistaken for a real godown token. | journey | **Fixed** wording; test 12 |

## 3. Verified-safe areas (no change needed)

| Area | What was checked |
|---|---|
| SQL injection | All repository queries use `$n` parameters; the dynamic table names come from fixed maps. A live `';DROP TABLE…` search returned `NO_SOURCES` and the tables were intact. |
| XSS (scheme text, Gemini output, demo inputs) | No `dangerouslySetInnerHTML`, `innerHTML`, `eval` or `new Function` in `src/` or `server/`. React escapes text; the AI answer renders as text (`whitespace-pre-wrap`). The demo label validator rejects `<script>` (journey step 12). |
| Insecure URLs / open redirects | Catalog client rejects non-https `officialUrl`/`evidence.sourceUrl`. There are no redirect endpoints. External links use `rel="noopener noreferrer"`. |
| CORS | No CORS headers are set, so browsers apply same-origin. Nothing needs cross-origin access. |
| Authentication / authorization | Admin and private prefixes always return 401. The review workflow is not routable. |
| Provenance & reviewer separation | DB test: self-approval → `REQUIRES_INDEPENDENT_REVIEW`; EDITOR approve → `FORBIDDEN`; double approve → `INVALID_TRANSITION`; approval requires a PERMITTED source with a sha256 document; `publication_events` and `audit_events` are written in the same transaction. |
| Migration safety | Each migration runs in one transaction with `schema_migrations` bookkeeping under an advisory lock. Re-runs are no-ops. Phase 14 adds no migrations. |
| Research ≠ approved | Research rows are confined to `research_catalog_records`, which has CHECK constraints pinning `research_status`/`production_status`. Retrieval for AI reads only the published-catalog query (test 9 asserts no reference to the research table). |
| Synthetic ≠ database | The demo workflow has no network calls. After the full journey and all tests, every public, review and source table had 0 rows. |
| Demo data contents | Synthetic only (`DEMO-FRM-1001`, invented names, `DEMO-` IDs). Validation rejects foreign owner IDs, `isDemo:false`, oversize payloads and wrong schema versions (test 6). |
| SSRF in ingestion | `validateOfficialUrl`: https only, no credentials/port/fragment, exact allowlisted host, no IP literals, every resolved address must be public; `redirect:'error'`; byte cap; 12 s timeout. Existing phase 3 tests pass. |
| Secrets | `.env*` is git-ignored and excluded from the ZIP. The Gemini key is server-side only and never sent to the browser (only `VITE_` variables are). Logs never print `DATABASE_URL`. |

## 4. Remaining risks

| # | Severity | Risk | Release impact |
|---|---|---|---|
| R1 | High *(production)* | No authentication or RBAC. The review workflow has no authenticated UI/API. | **Blocks production.** No impact on the localhost demo. |
| R2 | High *(live ingestion)* | DNS-rebinding TOCTOU: `secureFetch` validates DNS, then `fetch()` resolves again. Acknowledged in the code. | **Blocks live ingestion** until DNS-pinned egress/proxy exists. `INGESTION_SECURE_EGRESS` stays `unconfirmed`. |
| R3 | Medium *(production)* | No CSP, HSTS or frame-ancestors on HTML responses from `npm start`. | Add `helmet`/CSP before any hosting. |
| R4 | Medium *(production)* | The rate limiter is in-memory and per socket address; behind a proxy all clients share one bucket. | Needs an edge limiter (proxy/CDN) and `trust proxy` configuration. |
| R5 | Medium | `npm run dev` binds 0.0.0.0, exposing the Vite dev server on the venue LAN. Demo/preview remain localhost-gated, and Vite blocks `.env*` file serving. | Use `npm run dev:local` at the venue (documented). |
| R6 | Medium *(production)* | `npm start` without `NODE_ENV=production` keeps the research preview available on loopback when the flag is set. | Always set `NODE_ENV=production` outside the laptop. |
| R7 | Low | Prompt injection via approved excerpts is mitigated by the instruction plus citation validation, not eliminated. Real-model behaviour is untested (no key). | Evaluate with real Gemini before any live use. |
| R8 | Low | Google Fonts CDN leaks visitor IP to Google and fails offline. | Self-host fonts before production. |
| R9 | Low | No DB constraint against two simultaneously APPROVED versions of one scheme. | Add a partial unique index or a supersede-on-approve step before production. |
| R10 | Info | `localStorage` stores the synthetic snapshot unencrypted. | Acceptable because no real data is allowed. Never enter real farmer data. |

## 5. Live-government integration limitations (unchanged by Phase 14)

- **No source has documented reuse/robots/permission review.** `NO_APPROVED_SOURCES` is a legitimate blocker and remains in place. The 12 research records and their links are not authorization.
- There are no PMFBY, PACS, CPGRAMS, UIDAI/Aadhaar, DigiLocker or lender API integrations. All such statuses in the demo are simulated and labelled.
- Gemini is not configured. Grounded answers were validated only with a stub model and a labelled test fixture.
- Secure egress for crawling is not confirmed. The ingestion worker must not be run against government sites from a laptop.
