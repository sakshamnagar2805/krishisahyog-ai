# Phase 14 Audit — KrishiSahyog AI (SIH 2026)

**Scope:** `KrishiSahyog_AI_Final_Phase13_Baseline.zip` as delivered, audited and hardened on 2026‑10‑09.
**Environment used:** Linux container, Node v22.22.0, npm 10.9.4, PostgreSQL 16.15 (disposable local instance), headless Chromium 141 (Playwright 1.64).
**Not available:** Windows, real Chrome/Edge on your laptop, a Gemini API key, internet access to government sites or Google Fonts.

## 1. Decision

| Use | Decision | Why |
|---|---|---|
| **Supervised SIH demo (localhost, synthetic data, verbal disclosure)** | **CONDITIONAL GO** | Code Quality and Runtime gates pass here; the 28-step browser journey passes in headless Chromium. Conditions: (1) repeat `npm ci`, `npm run build` and `npm run phase14:gate` on the Windows demo laptop; (2) a person completes the browser checklist in `PHASE_14_HACKATHON_DEMO.md` in Chrome/Edge; (3) presenters say out loud that the farmer data is synthetic and that live government data is blocked. |
| **Public production deployment** | **NO-GO** | No authentication/RBAC, no approved official sources (`NO_APPROVED_SOURCES`), secure egress not confirmed (`SECURE_EGRESS_UNVERIFIED`), no HTML security headers or CSP, and the AI rate limit is per-process only. Passing unit tests and synthetic data are not evidence of production readiness. |
| **Government Live Data gate** | **BLOCKED** (by design) | No source has a documented permission/robots review; Gemini not configured. Loading the 12 research records does **not** resolve this. |

## 2. Baseline findings, before any change

| Check | Result on untouched baseline |
|---|---|
| `npm ci` | PASS (1 high `npm audit` advisory: `source-map-js` 1.2.1, used only at build time) |
| `npm run lint` | PASS |
| `npm run test:all` | PASS 87/87 |
| `npm run build` (no `.env.local`) | PASS, but the `DemoWorkspace` chunk (167 kB with the synthetic farmer) was emitted into `dist/` |
| `npm run build` with the `.env.local` Phase 13 docs recommend (`NODE_ENV=development`) | Produced a **development** bundle (`jsxDEV` present, `import.meta.env.DEV === true`) |
| `npm run db:migrate` ×2 | PASS, idempotent (0001–0006) |
| `npm run research:import` ×2 | PASS: 12 inserted, then 12 unchanged; 0 approved |
| `npm run dev` + any API request | **Server process crashed** (`TypeError: res.status is not a function` / `Cannot read properties of undefined (reading 'limit')`). Evidence: `phase14_evidence/logs/baseline_dev_crash.log` |

The baseline's 87 tests are mostly static source assertions. None of them started the HTTP server, so the dev-server crash was never caught. The Phase 13 Windows validation doc also notes that the dev server was never run in that environment.

## 3. Inventory

### 3.1 Visible routes (in-memory tab state in `src/App.tsx`, not URL routes)

| Sidebar route | Public mode (default / production) | Demo mode (`npm run dev`, localhost, `VITE_HACKATHON_DEMO_ENABLED=true`) |
|---|---|---|
| Dashboard | Public hero + verified catalog count | Original `DashboardPage` with synthetic farmer |
| Crop insurance (PMFBY) | "Unavailable" notice + research panel | Original `PMFBYPage` (claims, timeline, documents, help, premium, enrol, dates, links) + research panel |
| PACS services | Unavailable + research | Original `PACSServicesPage` + local enquiry form/transitions |
| Government schemes / Cooperative schemes / Farmer policies | Verified catalog (search, pagination, detail) + research panel (schemes only) | same |
| Credit and KCC loans | Unavailable + research | same |
| Agriculture support | Approved-only scheme discovery + research | same |
| Documents | Unavailable | Original `DocumentLockerPage` + metadata-only preparation form |
| Grievances | Unavailable | Local simulated helpdesk (create, link claim, simulate transitions) |
| Notifications | Unavailable | Original `NotificationsPage` (read/unread, mark all) |
| Voice and AI assistant | Verified (approved-source) AI, text only | same |
| Profile | Unavailable | Synthetic profile + Reset demo |
| Admin and governance | Not in sidebar for the farmer role; API returns 401 | same |

Present in the codebase but **not mounted**: `LoginPage`, `OtpVerificationPage`, `LanguageSelectionPage`, `AdminGovernancePage`, `VoiceAssistantPanel`/live voice session, and the legacy `server/assistantApi.ts` Gemini proxy.

### 3.2 Backend endpoints (mounted through `server/http/apiApp.ts` since Phase 14)

| Endpoint | Auth | Data gate |
|---|---|---|
| `GET /api/v1/public/status` | none | approved/permitted counts only |
| `GET /api/v1/public/schemes`, `/policies` | none | `APPROVED` + `approved_by/at` + `PERMITTED` source + `PUBLIC` document; limit 1–100 |
| `GET /api/v1/public/scheme-discovery` | none | approved schemes only; `RELEVANCE_ONLY`, eligibility never certified |
| `GET /api/v1/public/assistant/status` | none | key presence only |
| `POST /api/v1/public/assistant/ask` | none | approved records only; 8 kB body; 30 req/min per socket address (new); 20 s Gemini timeout (new) |
| `GET /api/v1/internal/research-preview` | loopback + flag + non-production + direct Host (new) | staging table, `verified:false` |
| `/api/v1/admin/*`, `/api/v1/private/*` | always 401 | placeholder, no implementation |
| any other `/api/*` | — | JSON 404 (new; previously SPA HTML 200 on `npm start`) |

### 3.3 External integrations

| Integration | State |
|---|---|
| PostgreSQL | Used; verified here with PostgreSQL 16 |
| Gemini (`@google/genai`) | Code present; **no key → not exercised**; grounded path tested with a stub model |
| Government websites (ingestion worker, `secureFetch`) | Code present; **blocked** by `INGESTION_SECURE_EGRESS` and zero permitted sources |
| Google Fonts CDN | Loaded from `index.html`; fails offline (falls back to system fonts) |
| Browser speech APIs | Code present but not mounted in the active shell |

### 3.4 Data-mode gates

| Gate | Where | Phase 14 status |
|---|---|---|
| Demo workspace | `isDemoAllowed` (DEV && flag && localhost hostname) + **new** compile-out (`import.meta.env.DEV ? lazy(...) : null`) + **new** forced-production build + bundle verifier | Verified: production `dist/` has 1 JS chunk and no demo markers; `npm start` on localhost with the flag set shows public mode |
| Research preview | `isLocalPreviewAllowed` (non-production + flag + loopback) + **new** Host/forwarding check | Verified: 404 for `X-Forwarded-For`, `Forwarded`, a foreign `Host`, and `NODE_ENV=production` |
| Published catalog | SQL in `PublicContentRepository` + client `verificationStatus==='VERIFIED'`/https/sha256 checks | Verified via DB fixture test |
| Independent review | `applyReview`: submitter ≠ approver, role checks, transition table, evidence check | Verified via DB test (self-approval → `REQUIRES_INDEPENDENT_REVIEW`; editor approve → `FORBIDDEN`; double approve → `INVALID_TRANSITION`) |
| Live ingestion | `pilot:preflight` | BLOCKED: `SECURE_EGRESS_UNVERIFIED`, `NO_APPROVED_SOURCES` (preserved, not suppressed) |

### 3.5 Database (31 tables after 0001–0006)

Public content: `government_sources`, `source_documents`, `document_versions`, `extracted_passages`, `schemes`, `scheme_versions`, `scheme_components`, `policies`, `policy_versions`, `policy_clauses`, `policy_amendments`, `scheme_policy_links`, `eligibility_rule_versions`, `eligibility_rule_evidence`, `geography_codes`, `scheme_categories`, `scheme_category_links`, `scheme_aliases`, `policy_taxonomy`, `policy_version_geographies`, `scheme_version_geographies`, `policy_version_relations`. Ingestion: `ingestion_runs`, `document_extraction_runs`, `extraction_draft_candidates`. Governance: `content_reviews`, `publication_events`, `audit_events`. Staging: `research_catalog_records`, `research_import_log`. Bookkeeping: `schema_migrations`.

After migrate + import (and after the full journey and all tests): every public, review and source table has **0 rows**; `research_catalog_records` has **12** rows, all `PENDING_EDITOR_AND_LEGAL_REVIEW`. Synthetic demo records exist only in browser `localStorage`.

### 3.6 Tests

13 files, 101 tests (87 original + 14 new in `tests/phase14_release.test.mjs`). One new test needs `TEST_DATABASE_URL` and is skipped without it.

## 4. Module classification

| Module | Classification | Evidence |
|---|---|---|
| Original shell (header, sidebar, footer, responsive layout) | **Verified Working** (headless Chromium) | Journey steps 01, 24–27 |
| Verified scheme/policy catalog | **Verified Working — empty catalog only.** Populated listing verified at repository/API level with a test fixture; populated UI pagination not exercised | Steps 15; DB test 10 |
| Scheme discovery (Agriculture support) | **Verified Working — empty catalog** | API probe; gate |
| Research preview (12 records) | **Verified Working**, local only, labelled RESEARCH ONLY | Steps 15–17 |
| Verified AI, zero approved sources | **Verified Working** (EN, HI, injection prompt) | Steps 18–20 |
| Verified AI, approved source + real Gemini | **Blocked by environment** (no key, no approved source). Citation validation verified with a stub model | Test 9, DB test 10 |
| Synthetic dashboard/profile | **Demo Simulation**, verified | Steps 01–03 |
| PMFBY claims/documents | **Demo Simulation**, verified | Steps 04–05 |
| PACS enquiry + transitions + slip | **Demo Simulation**, verified | Steps 08–10 |
| Documents preparation | **Demo Simulation**, verified (status never becomes VERIFIED) | Steps 11–12 |
| Grievances | **Demo Simulation**, verified; not CPGRAMS | Steps 06–07 |
| Notifications | **Demo Simulation**, verified (read/unread/all, persistence) | Steps 13–14 |
| Reset / corrupted-state recovery | **Verified Working** | Steps 22–23 |
| Review/publication workflow | **Partially Working**: service + DB verified; no UI, no authenticated API | DB test 10 |
| Live government ingestion | **Blocked by external permission** | `pilot:preflight` |
| Authentication / farmer login / RBAC | **Missing** (pages exist, not mounted; API returns 401) | — |
| Voice (speech recognition / TTS) | **Missing in active shell; NOT VERIFIED** | "Voice is not yet enabled" text |
| UI localization (8 languages in menu) | **Missing**: only the AI answer language switches (hi/en; other choices answer in English) | Step 19 |

## 5. Bug list

Status: **FIXED** (with regression test) or **OPEN** (with release impact).

### P0

| ID | Bug | Repro (baseline) | Status |
|---|---|---|---|
| P0‑1 | Dev and preview servers crash on the first API call. Express `Router`s were mounted directly into Vite's connect stack, so `req.query`/`res.status`/`res.json` were undefined and the async rejection killed Node. The app requests the catalog on page load, so **the demo could not survive opening the page.** | `npm run dev`, then `curl /api/v1/public/status` → connection refused; log shows `TypeError: res.status is not a function` | FIXED: `server/http/apiApp.ts`; tests 1–2 |
| P0‑2 | A PostgreSQL restart, network drop or laptop sleep kills the web server. The `pg` Pool had no `'error'` listener, so an idle client emitted an unhandled `'error'` (`57P01`). | Start server, make one request, `pg_ctl stop` → process exits | FIXED: `server/db/pool.ts`; test 13; verified live (server survives, returns 503, recovers) |

### P1

| ID | Bug | Status |
|---|---|---|
| P1‑1 | With `NODE_ENV=development` in `.env.local` (as Phase 13 docs instructed), `npm run build` produced a **development** bundle: `import.meta.env.DEV` was true and the React dev runtime shipped. This weakens the "never in production builds" guarantee. | FIXED: `scripts/build-production.mjs` forces production; `.env.example` and the preflight text no longer recommend setting `NODE_ENV`; test 4 |
| P1‑2 | Even a correct production build shipped the synthetic `DemoWorkspace` chunk (unreachable but downloadable). | FIXED: compiled out; `scripts/verify-production-bundle.mjs` fails the build if demo markers appear; tests 4–5 |
| P1‑3 | Saved demo state that passes validation but lacks render fields crashed the page, and the root boundary's "Reload" reloaded the same state forever. | FIXED: demo-scoped `ErrorBoundary` that clears only the demo key; test 7; journey step 23 |
| P1‑4 | On `npm start`, unknown `/api/*` paths returned the SPA HTML with HTTP 200, and malformed JSON fell through to Express's default HTML error page (with a stack trace when `NODE_ENV` ≠ production). | FIXED: JSON 404 / 400 / 413 / 500 with no stack; test 1 |
| P1‑5 | The research preview trusted only the loopback socket, so a same-host reverse proxy or a DNS-rebinding page could read staging data on `npm start`. | FIXED: rejects forwarding headers and non-loopback `Host`; test 3; live curl |
| P1‑6 | Anonymous `/ask` had no rate limit and Gemini calls no timeout (quota exhaustion, hung requests). | FIXED: 30/min per socket address, 20 s timeout; test 14; live: 30×200 then 429 |
| P1‑7 | The PACS demo "Collection slip ready — Token #… show it at the society godown" read like a real, usable token. | FIXED: titled "Demo collection slip — not valid at any PACS godown"; test 12; step 09 |

### P2

| ID | Bug | Status |
|---|---|---|
| P2‑1 | Notifications "Mark unread" did nothing. | FIXED (`toggleNotificationRead`); test 11; step 13 |
| P2‑2 | Header bell and sidebar showed 0 unread while Notifications showed 4. | FIXED; test 11; step 02 |
| P2‑3 | `pilot:diagnose` ignored `.env.local` and reported `DATABASE_URL` BLOCKED. | FIXED |
| P2‑4 | `npm audit`: 1 high (`source-map-js` ≤1.2.1, build-time). | FIXED: targeted lockfile bump to 1.2.2 → 0 vulnerabilities |
| P2‑5 | `/favicon.ico` 404 on every load. | FIXED (empty inline icon) |
| P2‑6 | "…unavailable (HTTP 503).. No demo fallback" double period. | FIXED |
| P2‑7 | Staged research URLs rendered as links without an https check. | FIXED (client guard; import validator already enforced it) |
| P2‑8 | `npm run clean` used `rm -rf` (fails on Windows). | FIXED (Node one-liner) |
| P2‑9 | Language menu offers 8 languages, but the UI is not localized and the AI only answers in hi/en. | OPEN: not claimed as a feature; disclose if asked |
| P2‑10 | Tabs are in-memory state, not URLs: browser Back leaves the app and refresh returns to Dashboard. | OPEN: no crash; demo script avoids Back |
| P2‑11 | Google Fonts load from the CDN; offline, the UI falls back to system fonts. | OPEN: NOT VERIFIED on Windows (Devanagari should use Nirmala UI) |
| P2‑12 | `npm run dev` binds 0.0.0.0, so the dev server is reachable on the LAN. Demo/preview are still gated to localhost. | OPEN: `npm run dev:local` added; recommended at the venue |
| P2‑13 | In demo mode, non-demo pages (AI, Schemes) show the "Public information mode … no synthetic farmer status" banner while the header shows the synthetic farmer. | OPEN: cosmetic, both statements are true |
| P2‑14 | No DB constraint against two simultaneously APPROVED versions of one scheme (the query picks the highest version; workflow prevents double-approving one version). | OPEN: production item |
| P2‑15 | `research_catalog_records` has no DB-level https CHECK (importer and client enforce it). | OPEN |
| P2‑16 | `scripts_phase1_check.cjs` fails identically on the baseline (it predates the Phase 13 demo identity and isn't part of `test:all`). | OPEN: stale legacy check, unchanged |

### Open P1 items that block **production only**

- `secureFetch` validates DNS, then `fetch()` resolves again (DNS-rebinding TOCTOU). The code documents this and live ingestion stays blocked until DNS-pinned egress exists (`INGESTION_SECURE_EGRESS`).
- No authentication or RBAC; review/publication is service/CLI-only.
- The AI rate limit is in-memory and per socket address. Behind a proxy it collapses to one bucket, so an edge limiter is needed.
- No CSP or HTML security headers on `npm start`.

None of these affect a supervised localhost demo.
