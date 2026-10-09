# Phase 11 — Government Data Pilot & E2E Validation

## Status: PARTIALLY IMPLEMENTED — LIVE PILOT BLOCKED

Baseline: Phase 10 checkpoint. The React UI and existing modules were not changed.

### Added
- `server/ingestion/pilotReadiness.ts`: pure, deterministic readiness gate checking all five migrations, individually reviewed/active permitted government sources, and confirmed protected egress.
- `server/ingestion/pilotPreflight.ts`: database-backed read-only pilot preflight; prints JSON and exits nonzero on blockers.
- `tests/phase11_pilotReadiness.test.mjs`: six regression tests covering go/no-go conditions.
- `npm run pilot:preflight` and `npm run test:pilot` scripts.

### Verification
- Six Phase 11 tests pass; full Phase 3–11 focused suite: 58 pass, 0 fail.
- No fake government records inserted, no government source scraped, no farmer records collected.
- No full Vite build, PostgreSQL schema migration, real Gemini request, or browser E2E test executed because runtime dependencies / PostgreSQL are not configured in this environment.

### Pilot runbook (requires authorized deployment environment)
1. Install application dependencies and configure a *new* test database via `DATABASE_URL`. Keep credentials in the deployment secret manager.
2. Run `npm run db:migrate` and verify all five schema versions.
3. Security: configure the collector behind DNS-pinned/protected HTTPS network egress and verify `INGESTION_SECURE_EGRESS=confirmed` represents an actual infrastructure safeguard, not just a changed string.
4. Review source collection permission, robots policy, official jurisdiction and per-source request budget. Register one confirmed public government scheme source through the existing administrative-only `registerApprovedSource` method. Do not bypass access controls.
5. Run `npm run pilot:preflight`. Continue only if `ready: true`.
6. Run `npm run ingest:once`; verify ingestion_runs, source_documents, extracted passages and original source provenance.
7. Independently verify actual document contents; create a draft scheme/policy record linked to evidence; submit through the existing review workflow and approve using a different authorized reviewer.
8. Confirm `GET /api/v1/public/schemes` and policy catalog show the approved record only; pending drafts must never be visible.
9. Ask the grounded assistant a question about the newly published record; verify claims and citations manually against the government original. Check explicit unavailable behavior when evidence is absent.
10. Run `npm run lint`, `npm run build`, and UI/browser tests on actual deployed services; capture evidence, observations and timestamps. Do not mark go-live complete without these steps.

### Open risks
- Existing migrations have not been executed on PostgreSQL, and migration rollbacks/concurrency need live evaluation.
- Current source collector's application-layer DNS protection is insufficient on its own; require network egress controls.
- Real production web collection requires source-specific permission review and cannot be assumed from public visibility.
- No end-to-end proof of source -> ingestion -> publication -> UI -> Gemini yet.
- `INGESTION_SECURE_EGRESS=confirmed` is an operator assertion, not an independent network security verification.
- The existing Phase 10 application and grounded model need full build and browser validation.

## Release decision
**NO-GO for live public launch.** Readiness guard is implemented, but the live pilot acceptance criteria have not been met.
