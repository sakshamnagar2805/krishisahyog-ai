# KrishiSahyog AI

Prototype for SIH 2026 Problem Statement 26088: a guidance kiosk for farmers covering PMFBY crop insurance, PACS cooperative services, government schemes, documents and grievances. All records are demo data.

## Run locally

**Prerequisites:** Node.js 20+

1. Install dependencies: `npm install`
2. (Optional) Add your Gemini API key to `.env.local`:
   `GEMINI_API_KEY="your-key"`
3. Start the app: `npm run dev`, then open http://localhost:3000
   Demo login: any 10-digit mobile number, OTP `123456`.

For a production build: `npm run build`, then `npm start` (serves `dist/` and the API on `PORT`, default 3000).

## Voice assistant

Open it from **Voice Guide** in the header or the **AI Assistant** page. It understands Hindi, Punjabi and English, and answers from the farmer's own claims, documents, schemes, grievances and PACS account. It can also open the relevant page.

It picks the best mode available:

| Mode | When | How it works |
|---|---|---|
| Live voice (Gemini) | Valid `GEMINI_API_KEY`, Chrome/Edge, HTTPS or localhost | Real-time two-way audio with Gemini Live; the farmer can interrupt |
| Standard voice | No key, or Live unavailable | Browser speech recognition and text-to-speech; answers from Gemini if a key is set |
| Text only | Browser without speech recognition | Typed questions |

Without a key, answers come from built-in demo answers grounded in the app's records.

- The API key stays on the server (`server/assistantApi.ts`). The browser only receives single-use Live tokens.
- Models default to `gemini-3.8-live` and `gemini-3.8-flash`; override with `GEMINI_LIVE_MODEL` / `GEMINI_TEXT_MODEL`.
- Use earphones in Live mode so the assistant does not hear itself.

## Phase 1: public real-data-only mode

The current app is an **unauthenticated public-information shell**. It never loads demo farmer identities, claims, scheme records, policy records, notification statuses, or source timestamps. The endpoints `/api/v1/public/schemes` and `/api/v1/public/policies` currently return `NO_SOURCES` and empty arrays until a verified data ingestion pipeline is implemented. `/api/v1/public/status` returns `NOT_CONFIGURED`.

**No actual government source collection has been deployed yet.** The absence of sources is expected and must not be replaced with static or generated records. Previous private routes and Gemini tools are intentionally disabled pending real authentication and grounded retrieval. Distinguish loading, no sources, retrieval failure, stale records and restricted content when implementing later phases. Never scrape private beneficiary records or bypass logins, OTP, CAPTCHA, access controls or prohibited automation.

Run `node scripts_phase1_check.cjs`, `npm run lint`, and `npm run build` after a clean platform-appropriate dependency installation.

## Phase 12 — hackathon research walkthrough and approved-source assistant

See [`docs/PHASE_12_IMPLEMENTATION_REPORT.md`](docs/PHASE_12_IMPLEMENTATION_REPORT.md) for setup, testing, verification limits, and remaining blockers, and [`docs/PHASE_12_DEMO_SCRIPT.md`](docs/PHASE_12_DEMO_SCRIPT.md) for the presentation click-through. Research references are **not** government-approved records and are never silently published or supplied to verified Gemini answers.

Windows quick start after configuring private `.env.local` and PostgreSQL:

```powershell
npm ci
npm run db:migrate
npm run research:import
npm run hackathon:preflight
npm run test:all
npm run lint
npm run build
npm run dev
```

Enable `RESEARCH_PREVIEW_ENABLED=true` **only for localhost development**. No `.env.local` or private credentials are included in the project archive. `npm run pilot:preflight` may still show `NO_APPROVED_SOURCES` until the official source permission and review workflow has been completed.

## Phase 13 Hackathon Demo (local development only)

See `docs/PHASE_13_IMPLEMENTATION.md`, `docs/PHASE_13_WINDOWS_VALIDATION.md`, and `docs/PHASE_13_HACKATHON_DEMO.md`. This opt-in synthetic demo is intentionally disabled by default and in production bundles. `VITE_HACKATHON_DEMO_ENABLED=true` is for localhost Vite development only. All accounts, claims, cooperative requests and grievances in the demo are simulated. Official-source research remains separate from approved content.

## Phase 14 — Release validation and hardening

Read `docs/PHASE_14_AUDIT.md` first; the decision and residual risks are summarized there and in `docs/PHASE_14_TEST_REPORT.md`.

- **Do not set `NODE_ENV` in `.env.local`.** `npm run build` now always produces a production bundle and fails if any demo code, synthetic farmer ID or React dev runtime is found in `dist/`.
- `npm run phase14:gate` runs the Code Quality and Runtime gates (start `npm run dev` in another window first). The browser checklist in `docs/PHASE_14_HACKATHON_DEMO.md` must still be done by a person.
- `npm run dev:local` binds the dev server to 127.0.0.1 only (recommended at a venue); `npm run dev` still binds 0.0.0.0.
- Optional DB integration test: set `TEST_DATABASE_URL` to a **disposable**, migrated database and run `npm run test:phase14`.
