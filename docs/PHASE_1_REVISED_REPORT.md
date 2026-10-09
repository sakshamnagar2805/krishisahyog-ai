# Phase 1 Revised — Preserve Original Product Shell

## Approach

- Restored original `Header`, `Sidebar`, and `Footer` from Phase 0.
- Retained original navigation labels, structure and route identifiers; added `farmer-policies`.
- Replaced the simplified Phase 1 shell with original layout components and theme.
- Kept Phase 1 verified-only `/api/v1/public/schemes` and `/policies` clients and endpoints.
- No demo farmer profile, fictional claims, payment status or false source sync dates loaded on startup.
- Existing pages remain in the repository; private/unsafe modules show an unavailable explanation until real authentication and data connections are implemented. They have **not** been restored as functional production workflows.
- Original interactive dashboard contents cannot truthfully run without demo farmer records. Phase 1 dashboard displays honest verified-public-data status instead.
- Original AI interface source remains preserved, but ungrounded AI execution remains disabled.
- Not a complete production application; scraping, PostgreSQL and authenticated modules are later phases.

## Validation

Run `npm run lint` and `npm run build` with clean dependencies on the target environment. If Rollup platform dependencies are absent, reinstall dependencies for that platform before building.
