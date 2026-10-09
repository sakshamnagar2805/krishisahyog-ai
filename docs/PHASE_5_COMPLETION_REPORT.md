# Phase 5 — Government Scheme and Agricultural Policy Knowledge Model

## Scope and preservation
Built on Phase 2–4 baseline. No React component or existing route was changed. Added migration 0004, server-side read/query utilities, and focused tests. Does not publish scraped drafts, seed government scheme records, or change legacy private flows.

## Implemented
- Distinct scheme and policy taxonomies; categories cover farmer income, insurance, solar, irrigation, markets, MSP, credit, soil, horticulture, inputs, machinery, cooperatives, natural farming, livestock, fisheries, and state subsidies.
- Multilingual scheme alias model, with ambiguous shorthand preserved as suggestions instead of automatic identity decisions.
- Explicit per-version scheme and policy geographic mappings; no implicit pan-India applicability.
- Policy-version links, supported scheme-to-policy relations, and prior amendment history preserved.
- Read-only repository operations for approved scheme lookup by geography/date, policy linkage, and scheme search. No new publicly accessible routes; Phase 6 must implement authenticated review/publish logic and Phase 7 adds API endpoints/UI integration.
- No monetary benefits, subsidy rates, deadlines, schemes, policies, or fabricated sources seeded.

## Outstanding / risks
- Database migration not executed because PostgreSQL is not running here; query execution requires a live DB test. Full application typecheck/build not verified because project dependencies are absent.
- `latestApprovedScheme` uses explicit geography ancestry provided by trusted server caller; geographical code validation and deterministic precedence between overlapping approved national/state versions must be verified in integration tests before product release.
- Publication is not implemented; existing prior schema's `APPROVED` marker is not a replacement for Phase 6 two-person review and atomic publication.
- `policyVersionTimeline` is for internal use: it includes draft/rejected rows and MUST NOT be exposed via a public API. Public read methods show only approved content.
- Aliases are normalization/suggestions, not a verified master data list; authoritative scheme identities must come from reviewed official records.
- Schema enforces one mapping per scheme/policy/relationship pair, so temporal re-relationships or multi-authority links may require additional migration as coverage grows.
- Scheme/policy version FK constraints still require stronger review/approval conditions and source evidence validation in Phase 6.

## Tests
`node --test tests/phase5_knowledge.test.mjs` — seven structural assertions passed. These checks do not replace DB-backed integration tests, source validation, or runtime UI smoke tests.

## Next
Phase 6: server-enforced content review, approval and publish workflows with audit trail and rollback; then Phase 7: link approved records to the existing UI. Keep delivering bundled ZIPs only after 2–3 phases as user requested.

## Combined focused regression test
`node --experimental-strip-types --test tests/phase3_secureFetch.test.mjs tests/phase4_extraction.test.mjs tests/phase5_knowledge.test.mjs` — **22 passed, 0 failed**. The plain `node --test` command fails for Phase 3/4 due to `.ts` import handling in Node 22.16; the experimental TypeScript stripping flag is required.
