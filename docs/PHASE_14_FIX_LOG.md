# Phase 14 Fix Log

These are all the changes from the Phase 13 baseline. No visual redesign: header, sidebar, dashboard, footer, PMFBY/PACS pages, scheme explorer and voice controls are unchanged, apart from the two wording fixes noted. Bug IDs refer to `PHASE_14_AUDIT.md`; test numbers refer to `tests/phase14_release.test.mjs`.

## New files

| File | Reason | Tests | Impact |
|---|---|---|---|
| `server/http/apiApp.ts` | **P0‑1.** Builds one Express *application* around the existing routers, used by both Vite (through `toConnectMiddleware`, which restores the request/response prototypes on fall-through) and `npm start`. Adds JSON 400/413/415/500 error handling with no stack traces, a JSON 404 for unknown `/api` paths, `X-Content-Type-Options: nosniff`, `Cache-Control: no-store` and `Referrer-Policy: no-referrer` on `/api`, and disables `x-powered-by`. | 1, 2; live probe `api_probe_dev.log` | Dev/preview servers no longer crash. Routes, payloads and gates are unchanged. |
| `scripts/build-production.mjs` | **P1‑1.** Sets `NODE_ENV=production` before Vite resolves config, builds, then runs the bundle verifier. Works the same in PowerShell, cmd and bash. | 4 | `npm run build` always produces a production bundle. |
| `scripts/verify-production-bundle.mjs` | **P1‑2.** Fails if `dist/` contains a DemoWorkspace chunk, `DEMO-FRM-1001`, the demo storage key, the demo banner, or `jsxDEV`. | 5 | Release-gate evidence for demo isolation. |
| `scripts/phase14-release-gate.mjs` | Phase 14D. Runs the Code Quality and Runtime gates, reports Browser as MANUAL_REQUIRED and Government Live Data from `pilot:preflight`. Read-only. | run: `phase14_gate.log` | `npm run phase14:gate` |
| `tests/phase14_release.test.mjs` | 14 regression tests for every fix. Test 10 runs only with `TEST_DATABASE_URL` (disposable DB). It inserts a fixture clearly labelled `example.gov.test` / `TEST FIXTURE` and deletes it afterwards. | — | Part of `npm run test:all` |
| `docs/PHASE_14_*.md`, `docs/phase14_evidence/` | Required reports, logs and screenshots | — | — |

## Modified files

| File | Change | Reason | Tests |
|---|---|---|---|
| `vite.config.ts` | Uses `toConnectMiddleware(createApiApp(...))` for dev (with research preview) and preview (without). The four direct router imports are removed. | P0‑1 | 2 |
| `server/index.ts` | Mounts `createApiApp(...)`; `app.disable('x-powered-by')`. | P0‑1, P1‑4 | 1, 2; `npm start` checks |
| `server/db/pool.ts` | `pool.on('error', …)` logs only the code and message (never the connection string). | **P0‑2** | 13; live DB stop/start |
| `server/research/access.ts` | `isLocalPreviewAllowed(env, addr, headers?)` also requires `isDirectLoopbackRequest`: no `X-Forwarded-For`/`Forwarded`/`X-Real-IP`, and `Host` must be localhost, 127.0.0.1 or [::1]. The 2-argument call is unchanged for existing tests. | P1‑5 | 3; existing research tests |
| `server/research/previewApi.ts` | Passes `req.headers` to the gate. | P1‑5 | 3 |
| `server/assistant/groundedApi.ts` | `createFixedWindowLimiter` (30/min per socket address on `/ask`, 429 `RATE_LIMITED`); Gemini client `httpOptions.timeout = 20000`. | P1‑6 | 14; live 30×200 + 2×429 |
| `server/assistant/groundedApi.ts` (follow-up) | `supportsSamplingParams(model)`: `temperature:0` is sent only to Gemini 1.x/2.x. Gemini 3.6+ (e.g. `gemini-3.8-flash`) deprecates sampling params: ignored now, HTTP 400 in future generations per Google. | Model compatibility | 15 |
| `src/App.tsx` | (a) `DemoWorkspace` is `import.meta.env.DEV ? lazy(...) : null`, so production builds contain no demo chunk; (b) `showDemo` also needs `DemoWorkspace !== null`; (c) header bell and sidebar badge use the demo notifications reported by the workspace; (d) trims the trailing period in the catalog error message. | P1‑2, P2‑2, P2‑6 | 4, 11; steps 01–02 |
| `src/demo/DemoWorkspace.tsx` | Exported `DemoWorkspace` wraps the unchanged inner workspace in `ErrorBoundary` with "Reset local synthetic demo and reload" (removes **only** `DEMO_STORAGE_KEY`); reports notifications through the optional `onNotificationsChange`; uses `toggleNotificationRead`. | P1‑3, P2‑1, P2‑2 | 7, 11; step 23 |
| `src/demo/workflow.ts` | Adds `toggleNotificationRead(id)`. `markNotificationRead` is kept. | P2‑1 | 11 |
| `src/pages/PACSServicesPage.tsx` | When `pacs.isDemo`, the slip title reads "Demo collection slip — not valid at any PACS godown". | P1‑7 | 12; step 09 |
| `src/components/public/ResearchPreviewPanel.tsx` | `isHttps()` guard before rendering staged URLs as links. | P2‑7 | 8; step 16 |
| `scripts/diagnose.mjs` | Loads `.env.local`/`.env` (optional dotenv, shell values win). | P2‑3 | manual run |
| `scripts/phase13-preflight.mjs` | Advice text: "leave NODE_ENV unset" instead of "set NODE_ENV=development". | P1‑1 | — |
| `.env.example` | Removed `NODE_ENV=development` and explained why. | P1‑1 | 4 |
| `index.html` | `<link rel="icon" href="data:,">` | P2‑5 | step 28 |
| `package.json` | `build` → `node scripts/build-production.mjs`; added `build:verify`, `dev:local`, `test:phase14`, `phase14:gate`; `clean` is now cross-platform. No dependency changes. | P1‑1, P2‑8, P2‑12 | 4 |
| `package-lock.json` | `npm update source-map-js --package-lock-only`: `source-map-js` 1.2.1 → 1.2.2, plus lockfile metadata for the optional `@tailwindcss/oxide-wasm32-wasi` bundled deps (installed only on wasm32). No direct dependency changed. | P2‑4 | `npm ci` + `npm audit` → 0 vulnerabilities |
| `README.md` | Phase 14 section. | — | — |

## Deliberately not changed

- `NO_APPROVED_SOURCES` and `SECURE_EGRESS_UNVERIFIED` blockers are preserved. No source was marked PERMITTED and no research record was promoted.
- DNS, robots, permission and secure-egress validation in `secureFetch`/`sourceRegistry` are untouched.
- Independent editor/reviewer approval in `server/review/workflow.ts` is untouched (and now covered by a DB test).
- `isDemoAllowed` is unchanged. It was strengthened from outside by the compile-out and forced-production build.
- No authentication, translations, voice, routing or other new modules were added.
- `scripts_phase1_check.cjs` (stale, fails identically on the baseline) is left as-is.

## Rollback

Every change is file-scoped. To revert one fix, restore that file from the Phase 13 ZIP. Reverting `vite.config.ts` or `server/db/pool.ts` brings back P0‑1 / P0‑2.
