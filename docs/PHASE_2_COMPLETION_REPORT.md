# Phase 2 — Persistent government-content foundation

## Implemented
- PostgreSQL migration covering sources, ingestion runs, documents, versions, passages, schemes, policies, policy clauses/amendments, associations, eligibility rules/evidence, geography, content reviews, and audit records.
- New government-domain types independent of demo-specific frontend record types.
- Read-only published scheme/policy repository with source provenance, version and effective-date filtering.
- Phase 1 public endpoints now read actual PostgreSQL records; on missing DB they return HTTP 503 rather than pretend there are no government schemes.
- Environment-driven DB settings and migration runner. No seeded facts or demo production fallbacks.

## Setup
1. Run `npm install` to install newly declared `pg` and `@types/pg` dependencies and refresh package lock.
2. Create a local PostgreSQL database and set `DATABASE_URL` via environment.
3. Run `npm run db:migrate`; check the schema and access roles.
4. `npm run lint` and `npm run build` in a clean environment.

## Validation and limitations
- SQL and code produced, but database migrations cannot be executed here: PostgreSQL and npm dependency installation are unavailable in this sandbox.
- No scraping, data publishing, or actual government content collection in Phase 2; empty tables are by design.
- Full end-to-end build remains a release gate.
- Existing layout and navigation retained; one empty-state sentence was corrected for database-backed mode.
- Migration rollback is deliberately manual/backup-based for the first schema; destructive automatic down migrations are avoided.

## Next
Phase 3 — source registry, permission review, and permitted collection engine.

## Known dependency issue
`npm install --package-lock-only --offline` failed because required packages were absent from the local cache. `package-lock.json` is therefore not refreshed; use a network-enabled environment to regenerate it before `npm ci` or deployment.
