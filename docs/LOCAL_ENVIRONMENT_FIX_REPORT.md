# KrishiSahyog AI — Local build and pilot blockers

## Scope
Targeted diagnostic and migration-safety fixes only. No React UI, routing, or domain architecture redesign. Base: Phase 11 checkpoint.

## Reproduced problems and status

| Problem | Evidence / impact | Resolution |
|---|---|---|
| Extracted checkpoint does not contain node_modules | `pilot:preflight` cannot launch without tsx | Added zero-dependency `npm run pilot:diagnose` for immediate actionable checks; actual runtime still requires `npm ci` |
| npm dependency installation fails offline | `@types/pg` is not cached (`ENOTCACHED`) | Cannot legitimately complete offline. Run `npm ci` where the npm registry is reachable and lockfile is valid; do not vendor or fake packages |
| No running PostgreSQL / database URL | Migrations and actual source-to-screen pipeline cannot run | Diagnostic reports missing config; provision PostgreSQL and set DATABASE_URL, then `npm run db:migrate` |
| Migration bookkeeping was not atomic | SQL files commit before runner inserts applied version, risking ambiguous partial migration state | Updated runner to execute each migration body plus bookkeeping in one transaction under existing advisory lock; retained SQL files unchanged |
| Preflight did not load dotenv | `pilot:preflight` relied on external env injection | Added dotenv config import; use normal `.env` or process env (avoid committing secrets) |
| Scraper source permission and secure network egress not verified | Protected network configuration must be established before fetching | No bypass. Live worker remains gated; verify authorization/robots rules and protected egress first |
| End-to-end government-data workflow not tested | No live source records or validated PostgreSQL instance | Still blocked; cannot claim production readiness |
| Full Vite / TypeScript build not verified | Project dependency packages unavailable locally | Still blocked; run `npm run lint` and `npm run build` after installing dependencies |

## Local sequence (Node 22+)

```bash
npm run pilot:diagnose
npm ci
npm run lint
npm run build
npm run test:pilot
# Provision PostgreSQL and configure DATABASE_URL; keep credentials private
npm run db:migrate
npm run pilot:preflight
```

`pilot:diagnose` intentionally exits with status 2 while prerequisites are missing. Do not set `INGESTION_SECURE_EGRESS=confirmed` unless protected outbound networking has actually been configured and independently verified. Preflight verifies registry state; it does **not** grant permission to scrape websites.

## Product preservation
No farmer-facing React files, layout, header, sidebar or branding were edited. Existing ingestion, data, and AI architecture remains in place.
