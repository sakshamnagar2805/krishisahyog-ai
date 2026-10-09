# KRISHISAHYOG AI — PHASE-WISE IMPLEMENTATION PROMPTS

**Project:** KrishiSahyog AI — Pan-India Agricultural Scheme & Policy Intelligence Platform  
**Purpose:** Upgrade the **existing uploaded React + Vite + TypeScript + Express + Gemini codebase** from a demonstration kiosk to a working, verifiable product that discovers and explains **real public government schemes, policies, guidelines, circulars, amendments, notifications, and application procedures**.  
**Version:** 1.0 · 8 October 2026  
**Audience:** AI coding assistants (Cursor, Codex, Claude Code, etc.) and developers.  
**Execution:** Run **one phase at a time**, inside the existing project repository. Do **not** ask the coding assistant to implement the entire file in a single pass.

> **Non-negotiable product boundary:** Collect **public government information**, **not farmers' or citizens' personal records**. No beneficiary-status scraping, Aadhaar/bank details, OTPs, CAPTCHAs, private accounts, or simulated official applications. No fake government data in the running product. For protected operations, provide a verified official-link handoff or use an explicitly authorized integration later.

---

## A. HOW TO USE THIS DOCUMENT

1. Open the existing `krishisahyog-ai` project in your coding environment and create a new feature branch.
2. Give the coding assistant **the Master Instruction below**, followed by **only the prompt for the next phase**.
3. Require it to inspect the repository before modifying files. Path names below were observed in the supplied ZIP; verify they still exist.
4. At the end of each phase, insist on the **Completion Report** and tests specified under that phase.
5. Review the result, commit it, then move to the next phase. If a blocker cannot be resolved, stop and report it—do not compensate with fabricated data or mock success.
6. Read the phase dependencies: a phase may be started only when its prerequisites are satisfied. Keep temporary compile-only adapters clearly isolated from production paths.
7. Develop against **real, permitted sources** in integration testing, with **clearly labeled recorded/fixture snapshots only for automated tests**. Test fixtures never populate the production UI or production database.

### Master instruction — prepend to every phase

```text
You are the lead engineer and system architect for KrishiSahyog AI. Work on the EXISTING repository; do not scaffold a replacement app.

Product goal:
Transform the current SIH prototype into a real, pan-India farmer-facing platform that automatically discovers, extracts, verifies, versions, indexes, and explains PUBLIC Indian government agriculture schemes and policy documents. Sources include central ministries, state/UT agriculture departments, official portals, circulars, guidelines, notifications, gazette records, and permitted official datasets. Use public-source ingestion (permitted scraping, downloads, HTML/PDF parsing) WITHOUT assuming private government APIs are available.

Hard constraints:
1. Preserve the current React/Vite application, its visual design system, responsive layout, navigation patterns, existing useful components, and Gemini voice/text integration wherever feasible.
2. No demo, mocked, randomly generated, placeholder, stale-as-current, or AI-invented government facts in ANY production API response or screen. Missing data must show a truthful empty/error/unavailable state. Automated-test fixtures are allowed under test-only paths, never loaded by runtime code.
3. Do not retrieve, infer, or store private beneficiary information. Never bypass CAPTCHA, OTP, login, rate limits, anti-bot protections, or access controls. Review source terms, published usage rules, robots guidance, and permission to automate/reuse; if uncertain or prohibited, disable collection and use official portal handoff. robots.txt alone is not a legal license.
4. Every published government fact must include source authority, official URL, original publication/observation date when known, retrieval timestamp, and review/verification status. A genuine older record may be displayed as historical, but never mislabeled current.
5. AI extraction is untrusted until validated and approved. Eligibility pre-screening must use deterministic, versioned rules only; AI may explain verified records but never announce government-approved eligibility, benefit payment, or application status.
6. Do not silently break PMFBY, PACS, grievances, documents, assistant, or existing routes. If an existing demo-only workflow cannot be made real in this phase, clearly label it unavailable/coming later or disable it in the public product—never render fictional official records.
7. Preserve the existing TypeScript stack unless a change is justified; use PostgreSQL for persistence, a documented migration tool, and a separate background ingestion worker. Minimize unnecessary dependencies and avoid premature microservices.
8. Keep backend secrets on the server, secure the admin ingestion features, validate all inputs, and prevent SSRF/private-address fetching when registering URLs.
9. Create migrations and tests alongside implementation. Avoid broad refactors outside this phase. Do not commit .env.local, secrets, node_modules, build artifacts, or uploaded identities.
10. Do not claim any API, scraper, language or government portal is live until tested against its actual allowed source. Prefer verified source documents to unsupported assumptions.

Work protocol:
A. Inspect relevant existing files and identify the actual data flow before editing.
B. State the phase's implementation plan and list exact files to change/create.
C. Implement the minimum complete working vertical slice, not only interfaces or UI mockups.
D. Run applicable type-check, unit, integration, and build commands and report exact results; if environment/dependencies block testing, clearly state what was not verified.
E. Produce a completion report: changed files, implemented behavior, real source(s) tested, migrations, commands run/results, unresolved risks, and the next phase's prerequisites.
F. STOP after this phase. Do not begin any following phase without approval.
```

---

## B. VERIFIED REPOSITORY BASELINE (FROM THE UPLOADED ZIP)

**Observed stack and scripts:** React 19, TypeScript, Vite 6, Tailwind 4, Express 4, `@google/genai`; `npm run dev`, `npm run lint` (`tsc --noEmit`), `npm run build`, `npm start`. The existing `server/index.ts` primarily serves the SPA and mounts the assistant API. `vite.config.ts` separately mounts `/api/assistant` in Vite development/preview. Any added API must work in **both development and production**.

**Existing paths that should drive implementation:**

| Current path | Existing purpose | Required treatment |
|---|---|---|
| `src/App.tsx` | SPA shell, routing, initial provider fetch, current user/role | Preserve UI; remove runtime dependence on demo identity/records; enable guest public routes |
| `src/services/index.ts` | Selects `demoDataProvider` | Replace production selection with real backend data access; no runtime fallback |
| `src/services/dataProvider.interface.ts` | Interface for demo/civic records | Evolve carefully; separate public information provider from private workflow provider |
| `src/services/demoDataProvider.ts` | In-memory fake schemes, claims, documents, etc. | Test-only isolation; never imported by production bundle |
| `src/data/demo/*` | Demo schemes, policies, government sources, claims, alerts | Keep only as isolated test fixtures if needed; no production seed/import |
| `src/types/index.ts` | Models with mandatory `isDemo: true` and demo-only source enums | Create real domain types with provenance; migrate UI safely |
| `src/services/schemeMatchingService.ts` | Simple relevance filter; may treat state OR crop as match | Separate discovery relevance from verified eligibility pre-screening |
| `src/pages/SchemesPage.tsx` | Existing scheme explorer | Reuse page structure; connect real API/search and states |
| `src/components/schemes/FindSchemesWizard.tsx` | Farmer-input wizard | Retain UX; add missing-information and region-specific questions |
| `src/components/schemes/SchemeResultsView.tsx` | Matched scheme results | Real sources + explainable evidence, no fake eligibility |
| `src/components/schemes/SchemeDetailView.tsx` | Scheme details | Show official sources, revisions and real verification status |
| `src/pages/AdminGovernancePage.tsx` | Source/audit dashboard based on demo metrics | Replace with real ingestion jobs, health, review and evidence |
| `src/pages/NotificationsPage.tsx` | Demo notifications | Government public updates only, from verified source records |
| `src/pages/OtpVerificationPage.tsx` | Accepts demo OTP `123456` | Eliminate publicly usable demo auth; do not require login to browse public content |
| `src/services/assistant/assistantTools.ts` | Browser-side tools reading demo provider | Replace with server-authorized tools reading approved real content |
| `src/services/assistant/assistantApi.ts` | Browser Gemini client with demo offline fallback | Make missing evidence/AI failure truthful; no fabricated scheme answers |
| `src/services/assistant/offlineAnswers.ts` | Built-in offline demo answers | Remove from production factual-answer path |
| `server/index.ts` | Express app startup | Add versioned public APIs, admin APIs and middleware |
| `server/assistantApi.ts` | Gemini API proxy | Harden tool/privacy behavior and integrate retrieval without exposing secrets |
| `vite.config.ts` | Vite server & assistant plugin | Ensure new API routes are available in dev; use shared Express API router or proxy |

**Known risks from source audit:** hardcoded demo farmer identity and role switching in `src/App.tsx`; hardcoded OTP in `src/pages/OtpVerificationPage.tsx`; `GovernmentSource` sync stats fabricated in `src/data/demo/governmentSources.ts`; `Policy` entries under `src/data/demo/policies.ts`; demo policy interface exists but has no dedicated public policy explorer; non-strict relevance in `schemeMatchingService.ts`. **This is a codebase-specific implementation plan, not a claim that these issues have already been fixed.**

### Product scope

**Include:** PM-KISAN, PMFBY, PM-KUSUM, PMKSY/Per Drop More Crop, e-NAM (public market information), PM-AASHA, KCC/PACS public rules, Soil Health Card, crop marketing, agriculture credit, irrigation, renewable energy, horticulture, mechanization, FPOs, animal husbandry, fisheries, cooperatives, state subsidies, and relevant agriculture-related *policies, gazette notifications, official guidelines, amendments and advisories*. Treat scheme aliases carefully: `PM KSY` may refer to PMKSY only after confirmation; `PM ASSH` was interpreted in the discussion as PM-AASHA but must not be auto-substituted without disambiguation in search.

**Exclude:** unapproved farmer-level portal login automation, beneficiary/payment/claim scraping, personal-record harvesting, official application submission, invented prices/statuses, and automatic legal assertions extracted solely by an LLM.

**Pan-India promise:** support all states and UTs as geography options, but show **honest per-state coverage and data freshness**. Do not call the platform “all-India fully covered” until every target jurisdiction has verified active sources and relevant rules. National accessibility is not equal to complete source coverage.

---

## PHASE 0 — BASELINE, SAFETY AND CHANGE PLAN [P0]

**Depends on:** Existing repository only.  
**Outcome:** Reproducible baseline, exact dependency map, no accidental data loss.

### Copy-paste prompt

```text
Implement PHASE 0 of KrishiSahyog AI, following the Master Instruction.

1. Inspect package.json, vite.config.ts, server/index.ts, server/assistantApi.ts, src/App.tsx, src/types/index.ts, src/services/**, src/pages/SchemesPage.tsx, src/pages/AdminGovernancePage.tsx, and src/components/schemes/**.
2. Build a source-to-screen trace: where schemes, policies, government sources, claims, notifications and AI responses originate and which screens consume them. Find all runtime imports from src/data/demo and all hardcoded demo user/OTP/role pathways.
3. Create docs/CURRENT_STATE_AUDIT.md with a component inventory and a KEEP / MODIFY / DISABLE / REMOVE matrix. Clearly distinguish code-backed facts from assumptions.
4. Create docs/IMPLEMENTATION_DEPENDENCIES.md with phase order, prerequisite decisions, and risk mitigations.
5. Record baseline commands: npm run lint and npm run build; include environment/tooling problems explicitly without faking a pass. Inspect .env.example variable names but do not print secrets from .env.local.
6. Confirm .gitignore excludes .env.local and node_modules. Do not alter any active functional behavior in this phase.
7. Document how frontend /api calls will work consistently in Vite dev and Express production; select ONE implementation approach to share routers without duplicating business logic.
8. Propose production environment variables using names only; never populate or expose credentials.

Acceptance criteria:
- All demo data entry points are identified.
- Existing screens/components to reuse are listed.
- Baseline checks and any blockers are recorded.
- No functional features modified; no undocumented assumptions.
Stop and submit the completion report.
```

---

## PHASE 1 — REMOVE DEMO DATA FROM THE PUBLIC PRODUCT PATH [P0]

**Depends on:** Phase 0.  
**Outcome:** A real-data-only public shell that never silently displays fabricated government records.

### Copy-paste prompt

```text
Implement PHASE 1 of KrishiSahyog AI, following the Master Instruction and Phase 0 audit.

1. Introduce a clear boundary between PUBLIC government-content browsing and PRIVATE user-specific workflows. Public scheme/policy/search pages must support guest access and state/district inputs without OTP.
2. Refactor src/App.tsx so initial application load does not demand DEMO_FARMER_LOOKUP_ID, fake currentUser, fake claims, or successful loading of all private modules to show public information.
3. Replace production imports/exports of demoDataProvider from src/services/index.ts. Create a real API-backed public information client or temporary unavailable adapter with typed empty/error states. It must NOT return mock records.
4. Keep src/data/demo/** and demoDataProvider.ts only behind test-only imports if tests need them; remove them from production runtime graph, AI tools, production builds and production seeds.
5. Remove publicly exploitable hardcoded OTP 123456 and client-side role escalation paths. Until real authentication is implemented, gate administrative/private routes server-side and present an honest unavailable/login-needed screen. Do not leave a fake admin login.
6. Replace any 'DEMO' government source badge, fabricated 'last synced' time, fake claim state, fake metrics, and offline factual fallback with genuine no-data/unavailable states.
7. Preserve the current header, sidebar, colors, typography and components. Do not replace the UI with a blank app; public navigation must remain useful even when the source database is empty.
8. Update README to state the real-data production policy; distinguish no-source, unavailable, loading, stale, restricted, and error outcomes.
9. Add automated/static checks preventing runtime imports from src/data/demo and preventing user-visible '123456' bypass in non-test builds.

Acceptance criteria:
- Fresh database/no sources => zero fake schemes and zero fake policy rows, with a useful empty state.
- Public scheme navigation works without private demo farmer records.
- Admin/private access is not obtainable through client-only role changes.
- No fake beneficiary, claim, notice or source timestamps appear in production.
- Existing layout remains recognizable and mobile-usable.
- npm run lint and npm run build pass where environment permits.
Stop and submit the completion report.
```

---

## PHASE 2 — PERSISTENT DATABASE, CANONICAL DOMAIN MODELS, PROVENANCE [P0]

**Depends on:** Phases 0–1.  
**Outcome:** Durable storage with traceable government-source evidence and safe rule versioning.

### Copy-paste prompt

```text
Implement PHASE 2 of KrishiSahyog AI, following the Master Instruction.

1. Add PostgreSQL persistence and ONE well-supported TypeScript migration/query tool chosen with rationale. Use env-driven configuration, parameterized queries, transactions, indexes, foreign keys, and migrations. Do not introduce a second ORM.
2. Model at least:
   - government_sources (authority, verified host, URL, jurisdiction, access_policy, collection_method, license_or_permission_notes, status, last_checked_at)
   - ingestion_runs (source, job type, start/end, outcome, HTTP metadata, attempts, error class)
   - source_documents (original URL, title, type, published/effective dates, retrieval time, SHA-256, access status, raw snapshot reference where lawful)
   - document_versions / extracted_passages (page/section, offsets, extraction confidence, original text)
   - schemes, scheme_components, scheme_versions
   - policies (separate from schemes), policy_versions, policy_clauses, policy_amendments
   - scheme_policy_links (many-to-many; role/relationship and effective date)
   - eligibility_rule_versions (jurisdiction, component, effective interval, approval state, referenced clauses)
   - geography_codes (central/state/UT/district; use authoritative codes)
   - content_reviews (draft/pending/approved/rejected, reviewer, reasons)
   - audit_events (administrative/source actions)
   - optional public_notifications / policy_update_events.
3. Create typed domain models in a new public-content namespace. Do not forcibly inherit BaseCivicRecord { isDemo: true } for real records. Implement a controlled compatibility boundary where old UI types still need gradual migration.
4. Ensure material records have source_id, verification state, retrieval timestamp, evidence references, effective dates and version. Include 'unknown' values instead of artificial defaults.
5. Support document supersession, source disagreement, state overlays, duplicate official documents, and multi-scheme associations.
6. Implement repository interfaces and tests for transactions, referential integrity, latest-approved-version lookup and effective-date filtering.
7. Add safe migrations, README setup instructions, and scripts for migration/up/down where supported. Do NOT seed fictional government facts. A fresh database is empty apart from controlled taxonomy/config tables.
8. Data quality: store crop and geography canonical codes, preserve multilingual titles, and represent units accurately. Do not hardcode bigha-to-hectare conversion nationwide.

Acceptance criteria:
- Fresh DB migrations complete; zero demo scheme/policy rows are created.
- Approved vs pending records are queryable separately.
- Original source evidence and historical versions survive updates.
- Duplicate source documents are handled deterministically.
- Repository tests and types pass.
Stop and submit the completion report.
```

---

## PHASE 3 — OFFICIAL SOURCE REGISTRY AND PERMITTED INGESTION ENGINE [P0]

**Depends on:** Phase 2.  
**Outcome:** Actual source-to-database collection from a permitted official public source.

### Copy-paste prompt

```text
Implement PHASE 3 of KrishiSahyog AI, following the Master Instruction.

1. Add a backend source registry and standalone background worker/scheduler. An admin must be able to register an APPROVED official public source with authority, full URL, jurisdiction, content category, permitted methods, source-specific request budget and expected refresh cadence.
2. Support fetch modes: PUBLIC_HTML, PUBLIC_DOWNLOAD, OFFICIAL_PUBLIC_DATASET; use Playwright for JS-rendered public pages ONLY if actually required and permitted. Prefer ordinary HTTP/document downloads where practical. No authentication/captcha bypass and no undocumented hidden endpoints.
3. Implement strict URL allowlisting, DNS resolution checks, block private/loopback/link-local addresses and redirects to them (SSRF), secure redirect handling, content type/size limits, timeouts, safe filenames, retries with backoff, ETag/Last-Modified when supported, and per-domain request budgets.
4. Before enabling a source, record a human-reviewed decision covering access terms, robots instructions, reuse restrictions, and purpose. If permission cannot be established, source must remain disabled and show a verified official link only.
5. Implement typed connector interface, run logs, request/response metadata and content hashing; one bad source must not affect other source jobs.
6. Choose ONE genuinely reachable and permitted official public HTML or public-download source. Do a real integration test against it when network access allows. If the source cannot be accessed or permitted, mark the connector blocked instead of pretending it works.
7. Save retrieved document metadata/raw snapshot only to the extent permitted by applicable terms. Detect no-change vs new document vs HTTP/parser error distinctly.
8. Add CLI/admin controlled source check with no open-URL crawler endpoints for public users. Validate user-supplied source URLs server-side.
9. Ensure development and production API/router setup both run without duplicating server handlers. In dev, Vite needs the same real API routes or a well-defined proxy.

Acceptance criteria:
- An authorized source is fetched successfully and a real ingestion_run and source_document are stored, OR an honest blocked/unavailable outcome is proven.
- A second identical fetch is idempotent and recorded as unchanged when content is unchanged.
- Source denial, 429, timeout, redirect, oversize content and malformed responses have passing tests.
- No restricted/private pages or personal farmer data are collected.
- No frontend uses data until verified and published.
Stop and submit the completion report.
```

---

## PHASE 4 — DOCUMENT/PDF EXTRACTION AND EVIDENCE-BASED AI STRUCTURING [P0]

**Depends on:** Phases 2–3.  
**Outcome:** Real official notices and guidelines converted into structured DRAFT records with cited evidence.

### Copy-paste prompt

```text
Implement PHASE 4 of KrishiSahyog AI, following the Master Instruction.

1. Add extraction for HTML pages and text-native public PDFs: title, issuing authority, scheme/policy name, document number, publication date, effective date, expiry/closing date if explicit, eligible region, benefit amount/unit if explicit, eligibility conditions, exclusions, required documents, official application instructions, amended provisions, and links to affected schemes.
2. Preserve the ORIGINAL text evidence with document ID plus section/page/paragraph location, byte/character offsets where feasible, and original language. Never invent missing fields or approximate quotation locations.
3. Use deterministic HTML/PDF parsing first; optionally ask Gemini to STRUCTURE extracted text into a strict schema with confidence and cited spans. Model output must be marked UNVERIFIED/PROPOSED, never auto-approved solely because it parses.
4. Implement robust validation (Zod or equivalent) for field types, document dates, units, money values, official URL hosts, region codes, evidence-span existence, and conflicting effective dates.
5. Clearly distinguish 'scheme', 'policy', 'guideline', 'notification', 'circular', 'gazette', 'FAQ', 'press release', and 'advisory'. A press announcement must not automatically be treated as a final operational eligibility rule.
6. Implement no-text, scanned/image-only, ambiguous/multilingual and conflicting-document states. If OCR is added later, track extraction confidence and require review; do not hallucinate text from images.
7. Store structured output as draft linked to exact source/document version. Do not use external model outputs as verified government facts until review passes.
8. Write tests for duplicate sections, missing effective date, broken PDF, Hindi text, multiple benefits, table extraction and explicit no-data.
9. Prove a real source -> extracted passages -> proposed scheme/policy fields trace, if source permission and network access exist; otherwise clearly document and test the blocked path.

Acceptance criteria:
- All extracted material claims trace to the same original official document and a text location.
- Missing fields remain null/unknown; no default benefit, deadline, eligibility or policy clause is generated.
- Draft data cannot be read by public publication endpoints.
- Tests and type-check pass.
Stop and submit the completion report.
```

---

## PHASE 5 — SCHEME + AGRICULTURAL POLICY KNOWLEDGE MODEL [P0]

**Depends on:** Phase 4.  
**Outcome:** A national, extensible scheme/policy registry with correct linking and geographic applicability.

### Copy-paste prompt

```text
Implement PHASE 5 of KrishiSahyog AI, following the Master Instruction.

1. Implement scheme registry, policy registry, versioned details, scheme-policy relations, applicability geography, category taxonomy, aliases, and effective-date precedence in backend services.
2. Categories must cover: PM-KISAN/income, PMFBY/insurance, PM-KUSUM/solar, PMKSY/micro-irrigation, e-NAM/markets, PM-AASHA/MSP/procurement, KCC/PACS/credit, Soil Health Card, horticulture, seeds/fertilizers, machinery, FPO/cooperatives, natural/organic farming, livestock/dairy, fisheries, soil/water management, state subsidy schemes, and other relevant farmer-facing policies.
3. Add a separate policy taxonomy: ACT/RULE/SCHEME_GUIDELINE/OPERATIONAL_GUIDELINE/GAZETTE_NOTIFICATION/GOVERNMENT_ORDER/CIRCULAR/AMENDMENT/ADVISORY/PROCUREMENT_NOTICE/PRESS_RELEASE. Record both document type and legal/operational status without claiming all documents have equal authority.
4. Model central, state/UT and district coverage using canonical codes. Include multilingual names and aliases; do not automatically assign nationwide eligibility to central schemes with region-specific implementations.
5. Implement scheme aliases and disambiguation: PM Kisan -> PM-KISAN; PM Kusum -> PM-KUSUM; PM KSY -> potential PMKSY (clarify if ambiguous); PM ASSH -> potential PM-AASHA (clarify). Never turn ambiguity into an unverified policy claim.
6. Implement relationship types such as GOVERNED_BY, AMENDED_BY, IMPLEMENTED_UNDER, SUPERSEDES, APPLIES_TO, EXPLAINS and RELATED_TO. A policy amendment can update multiple schemes; preserve old version history.
7. Add safe backend read methods: latest approved scheme, related approved policies, version timeline, applicable jurisdictions, required documents (if verified), and verified official destination.
8. No hardcoded benefit percentages, deadlines, beneficiary counts or application windows. Source values from approved document versions with dates and territorial applicability.
9. Add dedup logic for alternate spellings and official document copies without accidentally collapsing different state schemes.

Acceptance criteria:
- Scheme and policy are first-class distinct entities and are searchable independently.
- One scheme supports many guidelines/amendments; one guideline may be linked to many schemes.
- Date/jurisdiction filters and superseded-version behavior have tests.
- No incomplete draft becomes a published scheme automatically.
Stop and submit the completion report.
```

---

## PHASE 6 — HUMAN REVIEW, RULE APPROVAL, AMENDMENT DETECTION [P0]

**Depends on:** Phases 2–5.  
**Outcome:** Only traceable and reviewed government claims enter the public product.

### Copy-paste prompt

```text
Implement PHASE 6 of KrishiSahyog AI, following the Master Instruction.

1. Add protected admin review workflow for INGESTED -> EXTRACTED -> PENDING_REVIEW -> APPROVED / REJECTED / NEEDS_MORE_EVIDENCE -> PUBLISHED / SUPERSEDED. Public API returns only published content.
2. Provide a review UI by enhancing src/pages/AdminGovernancePage.tsx with real source ingestion runs, source URLs, last success/failure, review queue, extracted claims, evidence excerpts, publication decisions and meaningful errors. Reuse existing cards/tables/spacing.
3. Show side-by-side previous and proposed changes for benefit amounts, qualifying categories, locations, deadlines, document lists, application URLs and clauses. Record amendment effective date separately from scraping time.
4. Require human review for all material scheme-policy eligibility/financial/amendment changes. Use distinct editor and approver roles with SERVER-SIDE enforcement, or at minimum authenticated authorized reviewer access with self-approval prevention.
5. Record reviewer ID, timestamp, decision, evidence and audit trail. The UI must never call an automated system a government officer, official signatory or authenticated government audit authority.
6. Implement atomic publish/supersede with rollback and no-loss behavior. A failed fetch/extraction cannot delete or supersede the last verified record.
7. Detect source conflict and show CONFLICT_REVIEW_REQUIRED; unresolved conflict blocks automatic publication of the affected fact. Expired/withdrawn notices must be handled without declaring every scheme closed.
8. Real metrics only: connected permitted sources, successful sync count, parser failures, approved policies, pending reviews and median staleness computed from database—not constants.
9. Build tests for authorization, duplicate publication, concurrent edits, rejection, rollback, source drift and history preservation.

Acceptance criteria:
- Draft/unverified information remains invisible on public endpoints.
- Approved version can be published and traced to evidence and an audit event.
- A failed source sync does not destroy previously approved versions.
- Role escalation by changing frontend props is ineffective.
Stop and submit the completion report.
```

---

## PHASE 7 — REAL BACKEND APIs + CURRENT REACT SCHEME EXPLORER [P1]

**Depends on:** Phases 1–2, 5–6.  
**Outcome:** The existing scheme screens work exclusively with approved government-source records.

### Copy-paste prompt

```text
Implement PHASE 7 of KrishiSahyog AI, following the Master Instruction.

1. Build versioned public Express endpoints and typed frontend clients. Suggested routes (adjust to repository conventions):
   GET /api/v1/schemes?query=&stateCode=&districtCode=&category=&page=
   GET /api/v1/schemes/:id
   GET /api/v1/schemes/:id/policies
   GET /api/v1/policies?query=&stateCode=&documentType=&page=
   GET /api/v1/policies/:id
   GET /api/v1/updates?stateCode=&category=&page=
   GET /api/v1/sources/:id/public-status
   GET /api/v1/coverage
2. Expose only PUBLISHED/APPROVED records, sanitized evidence references and official URLs. Enforce paging, safe filtering, input validation, caching based on approved version, stable sorting, and deterministic no-record responses.
3. Refactor src/services/index.ts and dataProvider.interface.ts (or create a dedicated PublicContentClient) so production schemes/policies/sources come from API, never src/data/demo. Use a clean interface rather than coupling all private demo methods to public browsing.
4. Update src/pages/SchemesPage.tsx, SchemeDetailView.tsx, SchemeResultsView.tsx and existing relevant components while preserving UI tokens, layout, responsive behavior and voice-trigger navigation.
5. Scheme card/detail must show genuine authority, purpose, geography, validity status, benefit only if verified, required documents only if verified, primary official source, publication/effective dates, last reviewed and original official application URL when verified.
6. Handle LOADING / VERIFIED_CURRENT / VERIFIED_HISTORICAL / REVIEW_PENDING / NO_COVERAGE / NO_RESULT / SOURCE_UNAVAILABLE / ERROR distinctly. Show no invented results when database is empty.
7. Add accessible filters for state/UT, district where needed, agriculture category, crop (when rules support it), language and publication date; show source coverage separately from search result count.
8. Ensure Express production and Vite development serve identical endpoint behavior via shared router or documented proxy.
9. Add integration tests proving database published rows appear correctly, draft rows are absent, invalid official link is not rendered, and no demo imports reach production bundle.

Acceptance criteria:
- End-to-end: approved genuine source content -> database -> API -> existing React scheme page.
- Empty database => useful truthful empty UI.
- Current visual quality and mobile responsiveness retained.
- API returns real source attribution; production does not fall back to demo arrays.
Stop and submit the completion report.
```

---

## PHASE 8 — FARMER POLICY EXPLORER, AMENDMENTS & VERIFIED UPDATES [P1]

**Depends on:** Phases 5–7.  
**Outcome:** Farmers can find both schemes and the actual government policies affecting them.

### Copy-paste prompt

```text
Implement PHASE 8 of KrishiSahyog AI, following the Master Instruction.

1. Add src/pages/PoliciesPage.tsx (or equivalent) reusing existing page header, cards, chips, typography and accessible responsive style. Add menu entry 'Farmer Policies' and 'Government Updates' via src/App.tsx and existing sidebar/nav components.
2. Policy explorer filters: central/state/UT/district, department, category, document type, publication date, effective date and affected scheme. Full-text search English/Hindi with exact document references when available.
3. Policy detail: issuing authority, official title/number, document type, source URL, issue date, effective date, expiry/supersession where verified, original PDF link, version history, affected schemes, clause/excerpt references and plain-language explanation clearly labeled as such.
4. Add 'What changed?' diff view: old approved wording vs new approved wording, impacted scheme(s), geography, effective date, and precisely cited source. Do not claim changes affect all states unless the source says so.
5. Add 'Latest Updates' from newly approved announcements. An update is a real published government document, NOT a fictional personal notification. No push notifications unless opt-in infrastructure exists.
6. Support national browsing without sign-in. Mobile usability, Hindi/English strings, keyboard controls and empty/error/stale states are required.
7. Add policy page source links and a disclaimer that simplified explanations are not a substitute for the issuing authority's official guidelines.
8. Integration tests: one real published policy with linked scheme appears on both pages; zero draft items leak; superseded version remains accessible as historical but not current.

Acceptance criteria:
- A farmer can view real policy documents separately from schemes, and navigate between linked versions.
- Amendment comparison is data-backed, not model-generated speculation.
- UI preserves existing look-and-feel.
Stop and submit the completion report.
```

---

## PHASE 9 — REAL SCHEME DISCOVERY & DETERMINISTIC PRE-SCREENING [P1]

**Depends on:** Phases 5–8.  
**Outcome:** Practical, explainable scheme suggestions for any Indian state, with strict uncertainty handling.

### Copy-paste prompt

```text
Implement PHASE 9 of KrishiSahyog AI, following the Master Instruction.

1. Replace the existing loose state-OR-crop logic in src/services/schemeMatchingService.ts. Create two different services:
   (a) DiscoveryRelevance: broad search/ranking; NEVER calls a result 'eligible'.
   (b) EligibilityPreScreen: deterministic conditions sourced only from approved, currently effective rule versions.
2. Update FindSchemesWizard to ask only needed fields: state/UT, district, crop, season, farm area+unit, land tenure, irrigation/energy requirement, appropriate farmer categories. Make responses anonymous/in-memory by default unless the user explicitly saves data under a secure account later.
3. Support outcomes POTENTIALLY_ELIGIBLE / NOT_ELIGIBLE / MORE_INFO_REQUIRED / RULES_UNAVAILABLE / NOT_APPLICABLE_REGION. Include matched/failed/unknown conditions, missing fields, source clauses and rule version.
4. Do not infer regional bigha conversion from a pan-India constant; ask for standard units or require authoritative region-specific conversion. Handle all states/UTs without fake coverage.
5. Evaluate source rule effective intervals; block expired drafts and unresolved conflicting rules. If eligibility logic is incomplete, return RULES_UNAVAILABLE instead of guessing.
6. Include documented exclusion criteria, benefit ceilings and component-specific requirements only when approved. Benefits must be presented as indicative/preliminary and must not imply official government approval.
7. Add boundary and negative tests: wrong state, wrong crop, missing district, old rule, overlapping amendments, contradictory rules, unknown land units, missing farmer information, all-India scheme with state implementation restrictions.
8. Update SchemeResultsView with result explanations, government source links, missing information prompts and accessible Hindi/English wording.

Acceptance criteria:
- Rule engine never grants official entitlement or fabricates criteria.
- Same inputs + rule version give same answer.
- Missing/conflicting data cannot be silently treated as eligible.
- Recommendations show verifiable sources and geographic constraints.
Stop and submit the completion report.
```

---

## PHASE 10 — GROUNDED GEMINI TEXT/VOICE ASSISTANT [P1]

**Depends on:** Phases 6–9.  
**Outcome:** Assistant answers only from approved public scheme/policy records and accurately communicates source limitations.

### Copy-paste prompt

```text
Implement PHASE 10 of KrishiSahyog AI, following the Master Instruction.

1. Audit src/services/assistant/assistantApi.ts, assistantTools.ts, offlineAnswers.ts, liveVoiceSession.ts, server/assistantApi.ts and the existing assistant UI.
2. Add a server-side approved-content retrieval tool with schema: search schemes, search policies, get current verified scheme version, retrieve source passages, get approved policy amendment history, get pre-screen result. Only the backend can execute tools; enforce allowlists, schema validation, max result sizes and admin/user permissions.
3. The assistant must retrieve evidence BEFORE answering factual or current scheme/policy questions. Responses cite actual official URL, document title/number, publishing authority, date and page/section when available.
4. Gemini may translate and summarize but must never invent benefit amounts, deadlines, subsidy percentages, document requirements, official confirmation or beneficiary outcomes. If no approved evidence exists, explicitly say information is unavailable and offer the official portal link if verified.
5. Remove src/services/assistant/offlineAnswers.ts from the production factual fallback; if Gemini is unavailable, show verified source search/manual browsing and an honest 'AI currently unavailable' state.
6. Secure user text and retrieved source content against prompt injection (government HTML/PDF content is untrusted instructions). The LLM must not execute arbitrary URLs, issue SQL, edit rule records or bypass approval.
7. Preserve the existing voice experience where supported but ensure spoken answers follow exactly the same evidence policy as typed answers. Include Hindi/English explanations with actual measured support; do not claim universal multilingual voice accuracy without testing.
8. Add a strict citation completeness check: material policy/benefit claims need backing evidence; fallback to a citation-safe answer when not supported. Log failures without sensitive personal content.
9. Test: no result, outdated document, conflicting notices, adversarial HTML instruction, unrelated question, incorrect scheme alias, speech failure, Gemini missing key, model hallucination attempts, and API timeout.

Acceptance criteria:
- The assistant can answer at least one real, approved scheme query and one real policy amendment query with retrievable citations.
- A deliberately unsupported question produces a truthful unknown/unavailable answer.
- No demo fallback content remains in production voice/text paths.
- Existing assistant navigation and UI are preserved.
Stop and submit the completion report.
```

---

## PHASE 11 — PAN-INDIA SOURCE EXPANSION, COVERAGE METRICS & SEARCH [P2]

**Depends on:** Phases 3–10.  
**Outcome:** Repeatable onboarding across central, state/UT and district official sources, with coverage gaps visible.

### Copy-paste prompt

```text
Implement PHASE 11 of KrishiSahyog AI, following the Master Instruction.

1. Make the source onboarding framework configurable per department/state instead of hardcoding Rajasthan/Punjab/Haryana enums. Provide canonical state/UT and district codes, content categories, language codes, authority records and source permission fields.
2. Establish a source onboarding checklist: verify official authority/domain -> review collection permission -> classify source -> define parser -> test -> monitor -> obtain approved content -> publish through reviewer.
3. Include initial candidate source discovery for central agriculture ministry and related official departments, PM-KISAN, PMFBY, MNRE PM-KUSUM, PMKSY, e-NAM/Agmarknet, PIB, Gazette of India, myScheme (if permitted), plus state/UT agriculture departments. Treat domains as CANDIDATES until verified; do not imply each has enabled scraping or current coverage.
4. Implement coverage reports by country/state/UT/district, data type, last successful publication, verified active sources and affected scheme count. Distinguish 'No schemes exist' from 'No source indexed'.
5. Add full-text search, robust deduplication and aliases (Hindi/English names). Keep English/Hindi frontend translation and allow other languages to be added through verified translations.
6. Introduce policy change watch/diff detection and admin alerts for new eligible public-source documents, parser drift, broken URLs, stale documents and disputed rules. Do not spam farmers with unreviewed updates.
7. Add real data freshness policies by source: scheduled checks do not mean the government's original document is new. Display original publication date and our last checked time separately.
8. Do not silently report full national coverage; show a coverage dashboard with accurate source-by-state counts and gaps. Enable new states only with functional collectors and approved published records.

Acceptance criteria:
- New state/UT source can be onboarded without changing core scheme code.
- Coverage dashboard is derived from real persisted records.
- Broken/blocked sites do not produce invented updates.
- Search returns source-backed scheme AND policy records with stable filters.
Stop and submit the completion report.
```

---

## PHASE 12 — PRODUCTION SECURITY, OPERATIONS AND RELEASE GATE [P0 BEFORE LAUNCH]

**Depends on:** All intended launch features.  
**Outcome:** Deployable and observable public-information platform, with no hidden demo-data dependencies.

### Copy-paste prompt

```text
Implement PHASE 12 of KrishiSahyog AI, following the Master Instruction.

1. Perform a complete security audit of anonymous public APIs, admin authorization, source URL fetching/SSRF, request budgets, AI tool invocation, file downloads, PDF parsing, data retention, secrets, and content sanitization. Prevent XSS from scraped HTML and stored HTML.
2. Run SAST/dependency checks, TypeScript checks, production build, database migration tests, API contract tests, page/assistant E2E tests and worker retry/idempotency tests. Fix actual issues and report remaining risks.
3. Validate behavior against source failure, a removed government PDF, expired TLS cert, HTTP 403/429, robots/permission denial, changed HTML layout, partially extracted Hindi PDF, conflicting amendment, DB outage, Gemini unavailable and stale records.
4. Add structured logging, privacy-safe tracing, error metrics, source-health dashboards, alerts, backup/restore procedures and a documented incident-response workflow. No fake source 'OPTIMAL' badges or fabricated metrics.
5. Define and test source-specific freshness policies and UI statuses VERIFIED_CURRENT, VERIFIED_HISTORICAL, REVIEW_PENDING, NO_RESULT, NO_COVERAGE, SOURCE_BLOCKED and ERROR.
6. Deploy migration-first and keep workers independently controllable. Document environment variables, database initialization, worker startup, TLS, reverse proxy, secret handling, least-privilege access and rollback.
7. Add CI rules banning production imports from src/data/demo, src/services/demoDataProvider.ts and offline demo-answer modules; scan production bundles for known demo identities, '123456', fabricated source timestamps and hardcoded placeholder government claims.
8. Confirm every published source meets collection/reuse conditions and direct-link attribution requirements. Consult applicable privacy/data processing law and official government integration rules where relevant.
9. Execute the release checklist: authenticated admin roles, public guest browsing, verified sources, genuine scheme and policy records, tested amendments, source attribution, no fabricated official actions, backup restore, monitoring and acceptable mobile accessibility.
10. Produce docs/DEPLOYMENT_READINESS.md with pass/fail evidence, unresolved blockers, deployment instructions, and rollback steps. No 'production-ready' label if critical items remain unverified.

Acceptance criteria:
- No fake data enters production API or UI in success, empty or error paths.
- Source-to-screen and source-to-AI traces demonstrate genuinely collected and approved public information.
- Secure admin review, backups and monitoring are operational.
- All agreed launch tests pass, with results and limitations documented.
Stop and submit the completion report.
```

---

## C. FIRST END-TO-END DEMONSTRATION (MANDATORY BEFORE WIDE EXPANSION)

Before onboarding hundreds of schemes, require **one working public scheme plus one associated real government guideline/notification** to pass the full path:

```text
Permitted official public website / official PDF
  -> fetch / permitted download
  -> source run + original URL + content hash
  -> extracted text passages + exact page/section evidence
  -> typed draft scheme / policy / clause
  -> human review and approval
  -> versioned PostgreSQL publication
  -> GET /api/v1/schemes and GET /api/v1/policies
  -> existing scheme UI + new policy UI
  -> assistant answer with official citation
  -> scheduled check / diff / stale detection
```

**Pass criteria (all required):**

- Official content actually retrieved during a permitted source test. If access is blocked, report and change to another permitted official source—never fake it.
- At least one scheme record and one related guideline/notification published from evidence, with distinct versions/entities.
- Farmer can see the original official URL and publication/effective dates (when supplied).
- Farmer can browse without giving Aadhaar/mobile number or logging into government websites.
- AI explains verified details and refuses to fabricate anything absent.
- Changing/withdrawing source content does not silently overwrite approved history.
- Fresh database has **zero** fake government schemes or policy records.

---

## D. SUGGESTED API CONTRACTS (INTERNAL TO KRISHISAHYOG, NOT GOVERNMENT ENDPOINTS)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/schemes` | Verified searchable public scheme listing |
| GET | `/api/v1/schemes/:id` | Verified scheme and source information |
| GET | `/api/v1/schemes/:id/policies` | Linked guidelines, notifications, amendments |
| GET | `/api/v1/policies` | Verified searchable agriculture policy index |
| GET | `/api/v1/policies/:id` | Source-backed policy detail and version history |
| GET | `/api/v1/updates` | Verified public government announcements/amendments |
| GET | `/api/v1/coverage` | Honest geographic and content coverage |
| POST | `/api/v1/eligibility/pre-screen` | Preliminary deterministic rule check (never official eligibility) |
| POST | `/api/v1/admin/sources` | Add allowlisted approved source (admin only) |
| POST | `/api/v1/admin/sources/:id/check` | Start an authorized source sync (admin only) |
| GET | `/api/v1/admin/ingestion-runs` | Review real worker status (admin only) |
| GET | `/api/v1/admin/reviews` | Pending source/rule approval queue (admin only) |
| POST | `/api/v1/admin/reviews/:id/decision` | Server-authorized approve/reject (admin only) |

**Do not** expose open public scraping URLs, arbitrary caller-provided government HTTP requests, OTP flows, or other people's records through these endpoints.

---

## E. RECOMMENDED TEST SUITE / DATA INTEGRITY GATES

- **Provenance:** Each published fact has a valid source/document reference, exact evidence location where possible, review approval and retrieval time.
- **Truthfulness:** No-source/no-result does not output a generic list or fake subsidy.
- **Dates:** Publication date, effective date, document validity, scrape time and review time are separate; historical data never masquerades as current.
- **Geography:** Nation/state/UT/district scope and eligibility exclusions do not collide; central policy + state program restrictions are both applied.
- **Policies:** Amendments, repeals, effective intervals, clashes and related schemes remain linked correctly.
- **Scrapers:** 403/429/503, redirects, SSRF attempts, hostile HTML, malformed PDFs, duplicates, and source drift are contained.
- **Admin:** A public user cannot edit/register a source, approve a rule or change admin role via client state.
- **AI:** Prompt injection in source pages does not override instructions; unsupported benefit claims are not made; citations point to real retrieved documents.
- **Accessibility:** Responsive mobile navigation, keyboard focus, Hindi/English labels and informative loading/empty states.
- **Runtime:** Same API behavior in `npm run dev` and `npm start`; migrations and worker startup are documented.
- **CI:** Production imports of demo fixtures or answer fallbacks fail the build.

---

## F. PHASE COMPLETION REPORT TEMPLATE (REQUIRE AFTER EACH PHASE)

```text
PHASE: [number and name]
STATUS: COMPLETE / PARTIAL / BLOCKED

FILES CREATED:
- ...
FILES MODIFIED:
- ...
FILES PRESERVED:
- ...

WORKING FUNCTIONALITY:
1. ...

REAL GOVERNMENT SOURCES TESTED:
- Authority:
- Official URL:
- Access method and permission conclusion:
- Source document/data date:
- Last successful fetch (or NOT TESTED):

DATABASE / MIGRATIONS:
- ...

TESTS EXECUTED:
- Command:
- Result: PASS / FAIL / NOT RUN
- Evidence / blocker:

DEMO-DATA PRODUCTION PATH CHECK:
- No production demo import: PASS / FAIL
- No fake records in API: PASS / FAIL
- No fake claims from assistant: PASS / FAIL

SECURITY / POLICY CONCERNS:
- ...

OPEN ISSUES:
- ...

NEXT PHASE PREREQUISITES:
- ...

STOP. Await approval to begin the next phase.
```

---

## G. DELIVERABLES EXPECTED AT THE END

1. A preserved and upgraded KrishiSahyog React UI, with live source-backed **Government Schemes**, **Farmer Policies**, **Latest Notifications**, **Find Schemes for Me**, and grounded **AI Assistant** experiences.
2. A dedicated government-source ingestion worker with explicit source permissions, safe fetching, HTML/PDF extraction and repeatable sync jobs.
3. PostgreSQL scheme/policy/document/rule versioning, source provenance and audit trail.
4. A protected administrative verification workflow with real source health and amendments.
5. Real scheme/policy discovery across onboarded states/UTs, with explicit unindexed/blocked coverage gaps.
6. Source-grounded Hindi/English assistance without fabricated official data or private beneficiary scraping.
7. Tests, deployment instructions, release-gate evidence and rollback guidance.

**Final instruction to the coding assistant:** Do not substitute an attractive but fake dashboard for a functioning source-to-screen workflow. Implement each phase to its acceptance criteria, verify it, and stop for review before proceeding.
