# Phase 8 — Scheme discovery checkpoint

## Scope
Added `server/discovery/engine.ts`, `server/discovery/api.ts`, and mounted the new read-only `/api/v1/public/scheme-discovery` endpoint in `server/index.ts`. Added `tests/phase8_discovery.test.mjs`. Existing frontend UI and original scheme-matching module have not been modified.

## Behavior
- Anonymous, bounded search by free text, farming need, crop, state and district; optional land area input is validated but does not influence eligibility.
- Queries published/approved records via the Phase 7 catalog repository. Returns no demo fallbacks.
- Candidate ranking is keyword matching in approved title/summary only; it is **not** a farmer eligibility determination.
- Explicit `RULES_UNAVAILABLE` eligibility result until strict rule evaluation with verified evidence is added.
- Source provenance and effective dates are forwarded unchanged from the approved catalog.
- Defensive query validation, bounded scan, and clear unavailable states.

## Remaining before claiming Phase 8 fully complete
- Build deterministic evidence-backed eligibility rule interpreter and connect it to `eligibility_rule_versions`/`eligibility_rule_evidence`; avoid generic JSON execution or LLM-generated eligibility decisions.
- UI integration into existing wizard, including a state/district selector without hardcoded farmer identity or location.
- Fix older catalog geography behavior: parent-country entries and optional locations need explicit hierarchy and verified applicability, not assumption of national coverage.
- Live PostgreSQL migration/integration and clean TypeScript + Vite build; no database or installed dependencies were available.
- Verify the full endpoint under realistic government data and geography codes.

No source data is invented and no pre-existing UI screen was changed.
