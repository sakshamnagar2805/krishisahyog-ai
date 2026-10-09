# KrishiSahyog AI — Phase 0 Implementation Dependencies & Change Plan

**Date:** 2026-10-08  
**Parent requirements:** `phase_wise_prompt.md` supplied separately.  
**Scope:** Publicly available Indian agriculture schemes, policies, circulars, guidelines, gazette notifications, amendments and advisories. No private farmer records are scraped.

## 1. Architectural decisions approved for planning

| Decision | Choice | Why |
|---|---|---|
| Overall migration | Incremental extension of existing React/Vite + Express app | Preserve UI and existing Gemini experience |
| Public access | Guest-readable schemes and policies | Avoid fake OTP/identity dependency |
| Data guarantee | No fabricated production government records | Empty/failure states instead of demo fallbacks |
| APIs | Same Express API router mounted by Vite dev/preview and Express production | Prevent route divergence |
| Data store | PostgreSQL planned for Phase 2 | Durable relational versions and provenance |
| Acquisition | Registered, permitted public sources; official PDFs/HTML/datasets | No private APIs or beneficiary data required |
| Collector runtime | Separate worker and scheduled jobs | Control retries, load and rate budgets |
| Source approval | Permission review before collector activation | Respect access limits, licensing, rate limits |
| Extraction | Deterministic parsing + AI-assisted structuring + validation | LLM output is never automatically authoritative |
| Rule publishing | Human approval for material benefit/eligibility/legal changes | Prevent misinformation |
| Eligibility | Distinct discovery relevance and deterministic verified rules | Current OR-based matcher is not strict eligibility |
| AI grounding | Server-side source/tool retrieval; no demo answer fallback | Source-backed farmer responses |
| Security | Server-enforced admin authorization | Current UI role toggles are not security |

## 2. Execution sequence and prerequisites

**Do not start later phases until the previous phase's acceptance conditions are met.** Each step ends with tests and a completion report. Separate production code from test fixtures throughout.

| Phase | Objective | Requires | Exit criteria |
|---|---|---|---|
| **0** | Audit, dependency map and safety plan | Uploaded repository | These two docs, build/tool blocker documented |
| **1** | No-demo public shell and route protection | Phase 0 | Public views with zero fake records, truthful no-data, demo auth disabled |
| **2** | PostgreSQL, domain model, provenance | Phase 1 | Clean migration, approved vs pending versions, zero fake seeds |
| **3** | Official source registry + permitted ingestion | Phase 2 | Actual permitted retrieval or honest blocked result with run record |
| **4** | HTML/PDF text extraction and normalization | Phase 3 | Repeatable parser output with page/section evidence |
| **5** | AI extraction and editorial review | Phase 4 | Structured draft with sources and review workflow |
| **6** | Scheme and policy publication + amendments | Phase 5 | Versioned approved catalog with links between schemes and policies |
| **7** | Real-content API and existing React explorer | Phase 6 | Official-source schemes and policies reach browser, no fallback |
| **8** | Farmer discovery and deterministic eligibility | Phase 7 | Verified condition evaluation, missing info and reasons |
| **9** | Grounded Gemini text/voice assistant | Phases 7–8 | Cited answers; no unsupported benefit/eligibility statements |
| **10** | National coverage and state/UT source adapters | Phase 9 | Coverage matrix, geography codes and reviewed rules by jurisdiction |
| **11** | Security, operations, monitoring | Phases 1–10 (incremental) | Protected admin routes, source health, backups, privacy validation |
| **12** | Tests, migration QA and launch readiness | Phases 1–11 | Functional, source, safety, accessibility and deployment gates pass |

Check the phase headings in `phase_wise_prompt.md` before implementation and treat that document as the authoritative detailed task list.

## 3. Phase 1 dependency order (first implementation phase)

1. Introduce `src/services/publicGovernmentContentClient.ts` with explicit loading/unavailable/error typed states. It must never default to a fake provider.
2. Add or temporarily mount `/api/v1/schemes` and `/api/v1/policies` with truthful empty/unavailable results until a real database is connected. No invented data.
3. Refactor `src/App.tsx` startup into **public content** and **authenticated/private** loaders; public browsing must not require `farmer`, `pacs`, `metrics` or a demo identity.
4. Ensure UI presents useful empty states while keeping the current layout and navigation.
5. Remove hardcoded public OTP/role escalation and deny private/admin actions server-side until real identity/authorization is implemented.
6. Isolate `src/data/demo/*` and `demoDataProvider.ts` exclusively in test-only paths (or delete after confirming nothing depends on them); no runtime imports.
7. Disable fallback factual content from `offlineAnswers.ts` and `queryAI` demo responses.
8. Verify public smoke tests, TypeScript, build and a static runtime import check.

**Caution:** Replacing `dataProvider` in one line without decoupling `src/App.tsx`'s `Promise.all()` and `!farmer || !pacs || !metrics` guard will break the entire application.

## 4. Phase 2–6 data/ingestion prerequisites

1. Establish schema migrations and canonical geography/crop tables; **no fictional government schemes are seeded**.
2. Create an explicit registered source and permission/terms/robots review record.
3. Implement SSRF protection: official host allowlist, DNS resolution and redirect rechecks, private/loopback/link-local IP rejection, size/type caps and timeouts.
4. Store lawful source document references, content hashes, publication/effective dates and retrieved timestamps; distinguish them.
5. Make ingestion idempotent; parsing/validation failures cannot overwrite last approved version.
6. Maintain many-to-many links among schemes and policy documents; model clause references and amendments with validity intervals.
7. Use machine extraction for drafts only; review material rules, money, deadlines and geography before publication.
8. Track authoritative source conflicts, superseding notices and withdrawn schemes without silently choosing a winner.
9. Ensure all state/UT configurations have an explicit coverage state: `NOT_CONFIGURED`, `PENDING_REVIEW`, `AVAILABLE`, `STALE`, `UNAVAILABLE`.

## 5. Proposed internal API contract (not government endpoints)

```text
GET  /api/v1/health
GET  /api/v1/schemes?state=&district=&q=&cursor=
GET  /api/v1/schemes/:schemeCode
GET  /api/v1/policies?state=&category=&q=&cursor=
GET  /api/v1/policies/:policyId
GET  /api/v1/policies/:policyId/amendments
GET  /api/v1/government-sources/:sourceId/public-evidence
POST /api/v1/eligibility/assessments

[ADMIN AUTH REQUIRED]
GET  /api/v1/admin/sources
POST /api/v1/admin/sources
POST /api/v1/admin/sources/:sourceId/check
GET  /api/v1/admin/ingestion-runs
GET  /api/v1/admin/content-reviews
POST /api/v1/admin/content-reviews/:id/decision
```

A successful API response must be type-safe and contain actual approved records (possibly an empty array), not a demo. Public endpoints must avoid private profile/claim information. Admin endpoints require backend role checks, not UI state.

## 6. Main risks and mitigations

| Risk | Mitigation / release gate |
|---|---|
| Accidental fabricated data from legacy provider | Static/runtime import guard + integration test against empty DB |
| Scheme explorer broken by removing private demo records | Decouple public/private boot, retain UI, explicit unavailable states |
| Incorrect or outdated government policy | Review, effective dates, versioned clauses, source-linked citations |
| Scraping a site without clear permission | Keep connector disabled; official link handoff; record reviewer decision |
| Source HTML changes silently | Parser contract tests, schema checks, drift alert, retain last verified version |
| Live-looking but outdated data | Show original publication/observation date, retrieval date and freshness state |
| LLM invents subsidy amounts or official approvals | Deterministic evaluator + server-side sources + answer validation |
| Government domain spoofing/SSRF | Registry approval, host/DNS/redirect restrictions and network egress policy |
| Admin role manipulation | Server auth and resource-level permissions before admin actions |
| Privacy violations | Public-only ingestion; purpose-limited personal data only if future scope needs it |
| Pan-India claim without coverage | State/UT source health and coverage dashboard; honest gaps |
| Cross-platform npm/build instability | Reinstall dependency set on target OS; run CI typecheck/build on clean Linux |
| Sensitive `.env.local` in distributed ZIP | Exclude from artifacts; check and rotate exposed real keys when applicable |

## 7. Post-Phase-0 execution checklist

- [x] Baseline code entry points and demo source graph inspected.
- [x] Specific reusable modules and risks catalogued.
- [x] Shared router strategy selected for planning.
- [x] Secrets omitted from audit content and Phase 0 output.
- [x] No application runtime behavior changed.
- [ ] Local build blocker resolved in clean OS-appropriate install.
- [ ] Phase 1 approved by project owner.
- [ ] Phase 1 implementation and automated tests completed.

**Stop after Phase 0.** Do not run production scraping, generate fictitious government records, or start Phase 1 without authorization.
