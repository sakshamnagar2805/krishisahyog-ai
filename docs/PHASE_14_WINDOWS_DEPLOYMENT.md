# Phase 14 — Windows Deployment (supervised local demo)

**Status:** these steps were **NOT TESTED on Windows** by the Phase 14 work. They are the Linux-verified commands translated for PowerShell. Every npm script used here is cross-platform: `build` and `clean` no longer use Unix-only commands. Run them on the demo laptop and keep the output.

## 0. Prerequisites

| Item | Version | Check |
|---|---|---|
| Node.js | 22 LTS (22.12 or newer) | `node -v` |
| npm | 10.x | `npm -v` |
| PostgreSQL | 14–17 (16 used in testing) | `psql --version` |
| Browser | Current Chrome or Edge | — |

Install PostgreSQL with the EDB Windows installer, keep the default port **5432**, and remember the `postgres` password you set.

## 1. Clean install

```powershell
# Extract the ZIP to a short path without spaces, e.g. C:\sih\krishisahyog-ai
cd C:\sih\krishisahyog-ai
Remove-Item -Recurse -Force node_modules, dist -ErrorAction SilentlyContinue
npm ci
npm audit --omit=dev
```

Expected: `npm ci` exits 0; audit reports `found 0 vulnerabilities`. Never copy `node_modules` from another machine.

## 2. Minimal private configuration

Create the database and a least-privilege user (run in "SQL Shell (psql)" as `postgres`):

```sql
CREATE USER krishi_demo WITH PASSWORD 'choose-a-local-password';
CREATE DATABASE krishisahyog OWNER krishi_demo;
```

Create `.env.local` in the project root. It is ignored by git and excluded from the ZIP:

```powershell
@"
DATABASE_URL=postgresql://krishi_demo:choose-a-local-password@127.0.0.1:5432/krishisahyog
DATABASE_SSL=false
RESEARCH_PREVIEW_ENABLED=true
VITE_HACKATHON_DEMO_ENABLED=true
GEMINI_API_KEY=
GEMINI_TEXT_MODEL=gemini-2.5-flash
INGESTION_SECURE_EGRESS=unconfirmed
"@ | Set-Content -Encoding utf8 .env.local
```

- **Do not put `NODE_ENV` in `.env.local`.** In Phase 13 that silently turned `npm run build` into a development build. `npm run build` now forces production anyway.
- Leave `GEMINI_API_KEY` empty unless you have an approved source to demonstrate. With zero approved sources the assistant gives the honest "no verified sources" answer without calling Gemini.
- Never set `INGESTION_SECURE_EGRESS=confirmed` on a laptop.
- Use invented names only, and never enter a real farmer's data.

## 3. Database setup

```powershell
npm run db:migrate          # expect "Applied: 0001 … 0006" on first run
npm run db:migrate          # second run: no output, exit 0
npm run research:check      # VALID_RESEARCH_ONLY, 12 records, approved 0
npm run research:import     # inserted 12 (first time) / unchanged 12 (later)
npm run pilot:preflight     # EXPECTED: ready false, NO_APPROVED_SOURCES (+ SECURE_EGRESS_UNVERIFIED)
```

`NO_APPROVED_SOURCES` is correct. Do not "fix" it for the demo.

## 4. Build, test and run

Window 1:

```powershell
npm run lint
npm run test:all            # expect: pass 100, fail 0, skipped 1
npm run build               # ends with { "ok": true, ... "problems": [] }
npm run dev:local           # http://127.0.0.1:3000, bound to this laptop only
```

Window 2 (while the dev server is running):

```powershell
npm run phase14:gate
```

Expected summary: `codeQualityGate: PASS`, `runtimeGate: PASS`, `browserDemoGate: MANUAL_REQUIRED`, `governmentLiveDataGate: BLOCKED`, `supervisedSihDemo: CONDITIONAL GO …`, `publicProductionDeployment: NO-GO`.

Open **http://127.0.0.1:3000** in Chrome/Edge. The yellow **HACKATHON DEMO — SYNTHETIC FARMER DATA** banner must appear. If it doesn't, check the flag and that you used `localhost`/`127.0.0.1`, not the laptop's LAN IP.

Optional DB integration test (use a **separate, throwaway** database, never the demo DB):

```powershell
# create krishisahyog_test owned by krishi_demo first, then:
$env:DATABASE_URL="postgresql://krishi_demo:choose-a-local-password@127.0.0.1:5432/krishisahyog_test"; npm run db:migrate
$env:TEST_DATABASE_URL=$env:DATABASE_URL; npm run test:phase14
Remove-Item Env:DATABASE_URL, Env:TEST_DATABASE_URL
```

### Production-style run (to show demo isolation; not a deployment)

```powershell
npm run build
$env:NODE_ENV="production"; $env:PORT="3300"; npm start
# Open http://localhost:3300: "Public information mode" banner, Guest user, NO demo banner.
Remove-Item Env:NODE_ENV, Env:PORT
```

## 5. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `npm ci` fails with EPERM / file locked | Close VS Code, the dev server and antivirus scanning of the folder, then retry. Keep the path short. |
| `DATABASE_MIGRATION_FAILED … ECONNREFUSED` | PostgreSQL service not running: `Get-Service postgresql*` / `Start-Service postgresql-x64-16`. |
| `password authentication failed` | Wrong credentials in `DATABASE_URL`; URL-encode special characters (`@` → `%40`). |
| Schemes page: "service is unavailable (HTTP 503). No demo fallback" | DB unreachable. The demo pages still work. Start PostgreSQL; no server restart is needed (P0‑2 fix). |
| Research panel missing | `RESEARCH_PREVIEW_ENABLED=true` missing, `NODE_ENV=production` set, or you opened a non-localhost URL. |
| No demo banner | Using `npm start`/a production build (by design), a LAN IP instead of localhost, or the flag isn't `true`. Restart `npm run dev:local` after editing `.env.local`. |
| "This page could not be displayed" inside the demo | Click **Reset local synthetic demo and reload** (clears only the demo key). |
| `npm run build` prints `PRODUCTION_BUNDLE_VERIFICATION_FAILED` | Demo code or the dev runtime leaked into `dist/`. Do not ship; report the `problems` list. |
| Port 3000 in use | `Get-NetTCPConnection -LocalPort 3000` → stop that process, or run `npx vite --port=3001 --host=127.0.0.1`. |
| Fonts look plain | No internet: Google Fonts unavailable; system fonts are used. Hindi should render with Nirmala UI (**verify before the demo**). |
| AI says `RATE_LIMITED` | More than 30 questions per minute from this machine; wait one minute. |

## 6. Reset

- **Demo data (browser only):** Profile → *Reset demo data…* → *Confirm reset*. Or DevTools → Application → Local Storage → delete `krishisahyog:synthetic-local-demo:v1`. This never touches PostgreSQL.
- **Research staging:** `npm run research:import` is idempotent. To remove staged rows: `psql -d krishisahyog -c "TRUNCATE research_catalog_records, research_import_log;"` then re-import.
- **Whole database (local demo only):** `DROP DATABASE krishisahyog; CREATE DATABASE krishisahyog OWNER krishi_demo;` then section 3.

## 7. Rollback

1. Stop the servers (Ctrl+C).
2. Extract the Phase 13 baseline ZIP into a **different** folder and copy your `.env.local` into it (remove `NODE_ENV` if present).
3. `npm ci`, then `npm run dev`.

Note that Phase 13 has the P0 dev-server crash: the first API request kills the process, so the baseline demo is not usable as-is. Prefer rolling back individual files (see `PHASE_14_FIX_LOG.md`) over a full rollback. The schema did not change in Phase 14 (no new migrations), so either version works with the same database.
