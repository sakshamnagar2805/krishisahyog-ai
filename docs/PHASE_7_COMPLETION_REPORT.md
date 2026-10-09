# Phase 7 — Approved Government Data in Existing UI

## Scope
- Existing Header, Sidebar, Footer and primary navigation retained; no redesign.
- The scheme and farmer-policy catalog now supports search, server-side pagination and expandable record details.
- Published records display title, approved summary if available, issuing authority, source link, retrieval and publication dates, version, effective period, document ID and SHA-256.
- Server filters candidate records using approved status, approval metadata, permitted source, public document, effective dates, and optional geographic lookup.
- Filters are parameterized; pagination is bounded. Frontend rejects unverified/missing-provenance records. No demo fallback.

## Changed files
- `src/App.tsx`
- `src/services/public/governmentContentClient.ts`
- `server/publicContentApi.ts`
- `server/publicContent/repository.ts`
- `tests/phase7_publicCatalog.test.mjs`

## Validation
- Combined Phase 3–7 focused checks: 36 passing.
- No node_modules in checkpoint, so complete TypeScript/Vite build not run.
- Live Postgres migrations/queries not exercised; integration environment is required.
- No real approved scheme data is currently present. Catalog is empty until permitted source ingestion, validation, approval, and database population.

## Known limitations / follow-up
- Geographic filtering supported at API level; UI state/district controls can be added once verified geography reference data is onboarded.
- Existing private modules still show unavailable-state placeholders from revised Phase 1.
- Source review/publishing end-to-end requires real PostgreSQL and authenticated admin API/UI.
- Add full integration and browser end-to-end tests before production release.
