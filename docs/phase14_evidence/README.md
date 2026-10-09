# Phase 14 evidence

Captured 2026-10-09 in a Linux container (Node 22.22.0, PostgreSQL 16.15, headless Chromium 141). Nothing here was produced on Windows.

- `logs/*_baseline*.log`, `baseline_dev_crash.log`: the untouched Phase 13 ZIP. The crash log shows the dev server dying on the first API request.
- `logs/test_all_phase14_final_with_db.log`: final `npm run test:all` with `TEST_DATABASE_URL` (101/101).
- `logs/phase14_gate.log`: `npm run phase14:gate` with the dev server running.
- `logs/api_probe_dev.log`, `rate_limit_check.log`, `db_down_browser.json`, `api_bench.json`: runtime checks.
- `browser/results.json` + `NN.png`: the 28-step headless journey (`journey.playwright.mjs`; needs Playwright installed outside the project).
- `browser/prod_start_*.png`: production bundle served by `npm start`, showing no demo.
- `browser/db_down_assistant.png`: UI with PostgreSQL stopped.

Only synthetic demo data appears in these files. No credentials are included.
