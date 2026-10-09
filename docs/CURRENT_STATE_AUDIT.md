# KrishiSahyog AI — Phase 0 Current-State Audit

**Audit date:** 2026-10-08  
**Scope:** Supplied `KrishiSahyog-AI (2).zip`, directory `KrishiSahyog-AI/krishisahyog-ai/`  
**Method:** Static TypeScript/React/Express code inspection, import tracing, configuration inspection, and isolated local tool checks.  
**Change boundary:** Documentation only. No runtime modules or project logic changed. Not a production security audit or live-source scraping test.

## 1. Executive assessment

**Decision: EXTEND THE CURRENT PROJECT, DO NOT REBUILD.** The present React shell, scheme explorer, wizard, cards, document/claim screens and Gemini chat/voice integration provide useful UI foundations. However, the current domain information comes from a single demo-only in-memory provider. There is **no implemented public government scraping/ingestion workflow, production database, source verification pipeline, or production role authorization**. The existing scheme matcher is a demo relevance matcher—not an authoritative eligibility decision engine.

**Required target:** Pan-India public agricultural **scheme + policy + notice + guideline + amendment** intelligence. Ingest only permitted public government information, never private citizen/beneficiary records; preserve source evidence, approve material changes, and serve empty/unavailable states when verified data does not exist.

## 2. Repository and runtime

| Area | Code evidence | Finding | Action |
|---|---|---|---|
| Client bootstrap | `src/main.tsx`, `src/App.tsx` | React SPA with onboarding and hand-built section navigation | KEEP UI; MODIFY startup/routing |
| Styling | `src/index.css`, `src/components/ui/*`, `src/components/layout/*` | Existing design primitives and responsive shell | KEEP |
| Server | `server/index.ts` | Express serves `dist/` and mounts assistant routes; no scheme/policy APIs | MODIFY |
| Dev middleware | `vite.config.ts` | Vite plugin mounts assistant API for dev + preview | MODIFY with common router |
| Gemini server | `server/assistantApi.ts` | `/api/assistant/status`, `/live-token`, `/generate`; API key server-side | KEEP concept, MODIFY grounding/security |
| Client assistant | `src/services/assistant/assistantApi.ts`, `assistantTools.ts`, `offlineAnswers.ts` | May return demo factual answers or browser-side demo data | MODIFY / DISABLE demo fallback |
| Data source | `src/services/index.ts`, `demoDataProvider.ts`, `src/data/demo/*` | Exactly one exported runtime provider: `demoDataProvider`, in-memory data | REMOVE from production graph |
| Data contract | `src/services/dataProvider.interface.ts` | Combined public scheme and private farmer/claim/grievance operations | MODIFY; separate boundaries |
| Models | `src/types/index.ts` | `BaseCivicRecord` with mandatory `isDemo: true`; geographic enums only cover a few states | MODIFY using real-content namespace |
| Matching | `src/services/schemeMatchingService.ts` | State OR crop suffices to show relevance; area reason not based on explicit scheme limit | MODIFY / REPLACE for eligibility |
| Policies | `src/data/demo/policies.ts`, provider `getPolicies()` | Demonstration policy records exist; no consumer calls `getPolicies()` in app | ADD policy explorer |
| Sources | `src/data/demo/governmentSources.ts`, `AdminGovernancePage.tsx` | Fabricated sync figures and source records | MODIFY with measured sync results |

### Dependencies and scripts (observed)

- `package.json`: React 19, Vite 6, TypeScript ~5.8, Tailwind 4, Express 4, `@google/genai` 2.x.
- Scripts: `npm run dev`, `npm run lint` (`tsc --noEmit`), `npm run build` (`vite build`), `npm start` (`tsx server/index.ts`).
- No configured database, scheduled ingestion service, web scraper or production test script found.
- `.gitignore` excludes `node_modules/`, `.env*` except `.env.example`, `dist/`, `build/`, logs and coverage.
- `.env.example` declares variable names `GEMINI_API_KEY`, `APP_URL`. The code additionally references optional `GEMINI_LIVE_MODEL`, `GEMINI_TEXT_MODEL`, and `PORT`; they are not declared in this example. **No secret values are reproduced here.** The supplied ZIP itself contains a `.env.local` file: remove it from shared archives and assess whether any exposed credentials need rotation.

## 3. Source-to-screen provenance trace (verified from code)

| Data / user-visible feature | Actual source and path | Consumers / outcome | Phase 1+ direction |
|---|---|---|---|
| Schemes | `src/data/demo/schemes.ts` → `src/data/demo/index.ts` → `DemoDataProvider.getSchemes()` → `src/services/index.ts` → `src/App.tsx` | `DashboardPage`, `SchemesPage`, cooperative schemes view; `FindSchemesWizard` + `SchemeResultsView` + `SchemeDetailView` | Real `GET /api/v1/schemes`, verified source links, no fallback |
| Policies | `src/data/demo/policies.ts` → `DemoDataProvider.getPolicies()` | Method present in interface, but **no page invokes it** | Dedicated policy/notification explorer, linked to schemes |
| Government sources | `src/data/demo/governmentSources.ts` → `DemoDataProvider.getGovernmentSources()` → `App.tsx` | `AdminGovernancePage` and its sync/health display | Actual source registry / ingestion run tables |
| Claims / insurance | `src/data/demo/claims.ts` → `getClaims()` | `App.tsx` → dashboard, PMFBY views, grievance context, assistant | Keep informational PMFBY pages; disable simulated official claim outcomes |
| PACS | `src/data/demo/pacsServices.ts`, `pacsRequests.ts` → provider | PACS and credit views; assistant | Public guidance now; private requests only with real auth/storage |
| Grievances | `src/data/demo/grievances.ts` → provider | `App.tsx`, `GrievancePage`, assistant; `createDemoGrievance()` modifies memory | Disable simulated official submission; local cases only if clearly labelled |
| Documents | `src/data/demo/documents.ts` → provider | Locker, upload modal, scheme readiness, assistant | Isolate private storage; public document checklist must not require it |
| Notifications | `src/data/demo/notifications.ts` → provider | Header, dashboard, `NotificationsPage` | Public official notices + source date; avoid fake personal alerts |
| Admin logs/metrics | `src/data/demo/auditLogs.ts`, `adminMetrics.ts` → provider | `AdminGovernancePage` | Derive only from actual admin/ingestion tables |
| Text assistant | `src/services/assistant/assistantApi.ts` → `/api/assistant/generate` → `server/assistantApi.ts` | `AIAssistantPage` / assistant context | Server-side approved source retrieval; no demo fallback |
| Assistant tools | `src/services/assistant/assistantTools.ts` → `dataProvider` in browser | Returns demo farmer, documents, claims, schemes, etc. | Server-enforced tools with public/private separation |
| Assistant offline | `src/services/assistant/offlineAnswers.ts`, provider `queryAI` | Returns demo answers when key missing or Gemini fails | Truthful AI-unavailable state; no fabricated government facts |

### Demo import graph

Direct production-reachable imports confirmed:

```text
src/App.tsx
  └── src/services/index.ts
        └── src/services/demoDataProvider.ts
              └── src/data/demo/index.ts
                    ├── schemes.ts, policies.ts, governmentSources.ts
                    ├── farmerData.ts, claims.ts, documents.ts, grievances.ts
                    └── notifications.ts, pacs*.ts, aiResponses.ts, auditLogs.ts, adminMetrics.ts

src/services/assistant/assistantApi.ts
  ├── src/services/index.ts                 [demo provider]
  ├── src/services/assistant/assistantTools.ts [demo provider]
  └── src/services/assistant/offlineAnswers.ts [demo provider]

src/components/modals/UploadDocumentModal.tsx ──> src/services/index.ts
src/pages/GrievancePage.tsx ──> src/services/index.ts
```

`src/data/demo` is not an isolated test fixture: it is part of the current running data path.

## 4. Critical startup and identity dependencies

1. `src/App.tsx` defines `DEMO_FARMER_LOOKUP_ID` and constructs a `currentUser` object with hardcoded demo identities and roles.
2. A single `Promise.all()` fetches farmer, claims, grievances, PACS, documents, schemes, government sources, logs, admin metrics and notifications. This couples public scheme access to private/demo state.
3. UI initialization checks `!farmer || !pacs || !metrics`, so absent private/admin records can prevent **public scheme browsing** from loading at all.
4. `src/pages/OtpVerificationPage.tsx` explicitly accepts code `123456` and includes quick-fill behavior. `src/pages/LoginPage.tsx` and `ProfilePage.tsx` expose demo personae.
5. `src/App.tsx` and `AccessRestricted` expose client-side `setCurrentRole('admin')` / `onSwitchToAdmin` paths. No backend-admin authorization layer is present for government data administration.
6. `src/components/schemes/FindSchemesWizard.tsx` uses finite `DEMO_STATES` / `DEMO_CROPS` lists; this is not pan-India coverage.
7. `src/services/schemeMatchingService.ts` treats state **OR** crop match as enough for default relevance. It also appends “within the scheme limit” without checking a real threshold. The function must not represent a verified eligibility result.
8. `src/components/schemes/SchemeDetailView.tsx` shows demo source verification; existing simulated government source counts and sync times cannot be interpreted as operational telemetry.

## 5. Component disposition matrix

| Component | KEEP / MODIFY / DISABLE / REMOVE | Rationale |
|---|---|---|
| Main React styling, page header, cards, buttons, nav | **KEEP** | Existing UI and responsive design system |
| `SchemesPage`, scheme wizard/results/details | **MODIFY** | Reuse layout; replace data, grounding, rule evaluation |
| `DashboardPage`, public informational pages | **MODIFY** | Guest-friendly loading; no fake farmer data prerequisite |
| `AdminGovernancePage` | **MODIFY** | Real source health, review queue, ingestion jobs |
| `NotificationsPage` | **MODIFY** | Official public notices instead of synthetic alerts |
| `src/types/index.ts` | **MODIFY** | Real domain types, source provenance, pan-India geography |
| `src/services/dataProvider.interface.ts` | **MODIFY** | Separate public scheme/policy API from private workflow services |
| `src/services/index.ts` | **MODIFY** | Remove production demo provider selection |
| `src/services/demoDataProvider.ts`, `src/data/demo/*` | **REMOVE FROM PRODUCTION** | Optional test-only fixtures, never shipped/published |
| `src/services/schemeMatchingService.ts` | **MODIFY** | Discovery ranking separate from versioned eligibility rules |
| `server/assistantApi.ts` | **MODIFY** | Server-side validated, source-cited answers and tool controls |
| Voice panel/context and API client | **MODIFY** | Keep UX; remove offline/demo factual fallback |
| Demo OTP / persona switch / admin role toggle | **DISABLE** | Unsafe as actual authentication or authorization |
| Private PMFBY, PACS, grievance, document actions | **DISABLE until real** | Official status simulation violates product boundary |
| New scheme/policy ingestion + database | **ADD** | No existing working collection or persistent schema |
| New policy explorer and revision comparison | **ADD** | Policies represented only in demo data today |

## 6. Development and production API plan (selected approach)

**Selected: one shared Express router factory.** Add `server/createApiRouter.ts` and `server/routes/*` (or equivalent) for `/api/v1` government content and admin routes. Import and mount the **same** `createApiRouter()` from both `vite.config.ts` dev/preview middleware and `server/index.ts` production. Preserve existing assistant mounting or migrate it under the common router without changing public route paths unexpectedly. Keep source scraping, DB access and privileged tools in server/worker code only. Never import server code into the browser bundle.

Benefits: no independently implemented dev vs prod business logic; retains current Vite workflow; minimal infrastructure change. Test route parity with API smoke tests in both modes. Alternative Vite proxy-to-Express was considered, but would require an additional always-running backend process during development, so the common-router factory is the initial choice.

## 7. Baseline checks and blockers

Environment used: Node.js `v22.16.0`, npm `10.9.2`, extracted ZIP dependencies from the archive (Windows-oriented native optional dependencies), Linux execution host. Source was extracted **without** `.env.local` or `.git/`.

| Check | Observation | Interpretation |
|---|---|---|
| Direct `node node_modules/typescript/bin/tsc --noEmit --pretty false` | **EXIT 0** | Source passes TypeScript check in extracted environment |
| `npm run lint` | Started but exceeded 12-second bounded attempt (exit 124) | npm-script invocation not independently validated; direct TypeScript check passed |
| `npm run build` | **EXIT 127**: `vite: Permission denied` | Extracted executable permissions/tooling issue, not a proven source defect |
| Direct `node node_modules/vite/bin/vite.js build` | **EXIT 1**: missing `@rollup/rollup-linux-x64-gnu` | ZIP includes Windows Rollup binaries; Linux-native optional dependency missing |
| End-to-end, scraper, API, database tests | **NOT RUN** | No real ingestion implementation or DB is configured; no suitable integration target |
| `.gitignore` | **PASS**: `.env*`, `node_modules/`, `dist/` ignored | However `.env.local` is included in the uploaded ZIP (archive hygiene risk) |

**Do not claim production build passes.** In the developer's normal OS, reinstall dependencies using the committed lockfile and re-run `npm run lint` and `npm run build`, rather than copying archived `node_modules`. Restore proper executable permissions on Unix when needed. No package installation or source code changes were performed in this phase.

## 8. Environment variables: proposed names only

Already documented: `GEMINI_API_KEY`, `APP_URL`.

Referenced in current server but not listed in example: `PORT`, `GEMINI_LIVE_MODEL`, `GEMINI_TEXT_MODEL`.

Proposed future additions (Phase 2+; **names only**):

```text
NODE_ENV
DATABASE_URL
SESSION_SECRET
PUBLIC_APP_URL
SOURCE_FETCH_USER_AGENT
INGESTION_WORKER_ENABLED
INGESTION_REQUEST_TIMEOUT_MS
INGESTION_MAX_RESPONSE_BYTES
INGESTION_MAX_REDIRECTS
INGESTION_DEFAULT_RATE_LIMIT_PER_HOST
CONTENT_STORAGE_BUCKET
CONTENT_STORAGE_REGION
CONTENT_STORAGE_ENDPOINT
AUDIT_LOG_RETENTION_DAYS
LOG_LEVEL
```

Do not add placeholder production credentials. Prefer a secret manager for deployed keys.

## 9. Explicit scope and uncertainties

- **Confirmed from code:** All referenced implementation findings above.
- **Not verified:** Actual government source permission, which external pages are parseable, full all-India scheme coverage, cloud hosting constraints, actual Gemini response correctness, real policy/legal validity of the demo documents, runtime UI behavior, cross-browser support and security posture under live deployment.
- **Decision for pan-India:** Support all state/UT codes in the data model; label verified coverage per state. Do not claim every state is populated until its actual government source content has been reviewed.
- **Demo document warning:** The `src/data/demo/policies.ts` official-looking titles, clause numbers and PDFs are fixtures; never use them as authentic government rules.

## 10. Phase 0 acceptance checklist

- [x] Identified the current runtime demo-data entry points and primary consumers.
- [x] Identified existing reusable screens and modules.
- [x] Documented current authentication/authorization and AI factual fallback risks.
- [x] Checked `.gitignore` and `.env.example` variable names without exposing secrets.
- [x] Executed direct TS check and attempted the specified npm checks; blockers recorded.
- [x] Selected one router-sharing strategy for development and production.
- [x] Documented production environment variable **names only**.
- [x] Changed no runtime functional features.
- [ ] Production build success — **BLOCKED by archived native binary/permissions; not a Phase 0 claim**.

**Phase 0 disposition:** Audit and planning tasks completed with an explicit tooling blocker. **Stop here and obtain approval before Phase 1.**
