# Phase 9 — Verified Government Information AI (checkpoint)

## Scope
- Introduced a new, isolated endpoint: `POST /api/v1/public/assistant/ask` accepting `{ "question": string, "language": "en" | "hi" }`.
- This endpoint retrieves *approved*, public-source-backed scheme and policy records from the PostgreSQL catalog; it never reads demo records.
- Gemini receives bounded source excerpts and explicit constraints to avoid invented eligibility, rates, farmer status and application outcomes.
- Structured response returns `status`, `answer`, `sources`, `eligibility: NOT_ASSESSED`, and `officialStatus: NOT_CHECKED`.
- Empty catalogs return `NO_VERIFIED_SOURCES` without calling Gemini. Invalid and missing model citations fail closed.
- Wired endpoint into production Express server and Vite dev/preview middleware, preserving all existing React screens and navigation.
- Did not re-enable the original ungrounded `/api/assistant` API or the previous browser-side voice flow.

## Code changes
- `server/assistant/grounded.ts` (new)
- `server/assistant/groundedApi.ts` (new)
- `server/index.ts` (router mounted)
- `vite.config.ts` (development/preview router mounted)
- `tests/phase9_grounding.test.mjs` (new)

## Tests
- Node v22.16, `node --experimental-strip-types --test tests/phase*.test.mjs`: 52 passing, 0 failing (unit/focused tests).
- Full TypeScript/Vite build unavailable because installed node_modules are absent.
- PostgreSQL and live Gemini integration tests are outstanding.

## Limitations and release blockers
1. This is a backend-only integration. The existing assistant UI is not yet connected; voice requires independent security and grounding design.
2. Matching approved catalog records by the whole question may miss relevant schemes, especially in Hindi. Add bounded multilingual token/alias retrieval and robust relevance evaluation.
3. Model output is checked for *valid citation indexes*, not for sentence-level factual entailment. It can still misstate an excerpt. Before farmer-facing activation add claim-to-evidence checking, tests on adversarial documents, and human evaluation.
4. Production requires API authentication or protective anonymous abuse controls (rate limits, quotas, budget caps) and logging with privacy safeguards.
5. API key and approved catalog must be configured; otherwise the endpoint fails closed. No real government records have been ingested/verified in this environment.
6. Database permission and geography filtering must be validated with actual PostgreSQL fixtures and policies. No synthetic data can be served in production.
7. Prompt-injection defenses must extend beyond the source-as-data instruction to comprehensive adversarial tests.

## UI preservation
No existing React component, branding, dashboard, sidebar or frontend view was modified in Phase 9.
