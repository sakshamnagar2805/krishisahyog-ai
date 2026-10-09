# Phase 14 Completion Summary

## Decisions

| Use | Decision |
|---|---|
| **Supervised SIH 2026 demo** (localhost, synthetic farmer, verbal disclosure) | **CONDITIONAL GO.** Conditions: re-run `npm ci`, `npm run build` and `npm run phase14:gate` on the Windows demo laptop; a person completes the checklist in `PHASE_14_HACKATHON_DEMO.md` in Chrome/Edge; presenters use the scripted disclosures. |
| **Public production deployment** | **NO-GO.** No authentication, no approved sources, ingestion egress unconfirmed, no CSP, per-process rate limit. |
| **Government Live Data gate** | **BLOCKED** (correctly): `NO_APPROVED_SOURCES`, `SECURE_EGRESS_UNVERIFIED`, Gemini not configured. |

## What changed and why it matters

- **P0 fixed — the Phase 13 demo server crashed on the first API request.** Opening the page triggers a catalog request, so the demo could not have run. Now fixed and covered by a test that fails on the baseline.
- **P0 fixed — any PostgreSQL restart or network blip killed the server.** It now logs, returns honest 503s, and recovers by itself.
- **Demo isolation is now enforced at build time.** `npm run build` always produces a production bundle with no demo chunk, synthetic ID or dev runtime, and the build fails if any appear.
- Seven P1 and eight P2 issues were also fixed: a stuck demo after bad saved state, the research preview reachable through proxy/rebinding headers, HTML/stack-trace error responses, no AI rate limit or timeout, a realistic-looking PACS token, "Mark unread" doing nothing, mismatched unread badges, and an `npm audit` high.
- **14 new regression tests**: 101/101 pass with the DB test enabled; the original 87 are untouched and passing.
- **Browser journey 28/28 PASS** in headless Chromium, covering every P0 flow plus reset, corrupted-state recovery, keyboard access, tablet/phone/kiosk layouts, DB-down and server-restart behaviour.
- No redesign, no schema change, no new dependencies, and no weakening of any permission, egress or review gate.

## Verification status

| Gate | Status here | Status on your Windows laptop |
|---|---|---|
| Code Quality (ci, lint, tests, build, audit, archive) | **PASS** | NOT TESTED: run `npm run phase14:gate` |
| Runtime (migrate ×2, import ×2 = 12 staged, API, auth 401, 404/400 JSON) | **PASS** | NOT TESTED |
| Browser Demo | **PASS (automated, headless Chromium)** | **MANUAL REQUIRED** in Chrome/Edge |
| Government Live Data | **BLOCKED** | BLOCKED |

## Residual risk register

| ID | Risk | Likelihood | Impact | Owner action | Blocks |
|---|---|---|---|---|---|
| RR1 | Windows-specific install/build issue not seen on Linux | Medium | High (no demo) | Run the Windows guide at least a day before | Demo (condition) |
| RR2 | A presenter overstates integration or eligibility | Medium | High (credibility) | Use the scripted disclosures; rehearse the Q&A | Demo |
| RR3 | Venue has no internet: fonts fall back; Hindi glyphs depend on OS fonts | Medium | Low | Check Hindi rendering offline on the laptop | — |
| RR4 | Judge asks for a live AI answer | High | Medium | Show the tested approval/citation evidence; never fake an approved source | — |
| RR5 | DB service stops mid-demo | Low | Low (now recoverable) | `Start-Service postgresql-x64-16`; demo modules keep working | — |
| RR6 | Bad saved demo state | Low | Low (now recoverable) | "Reset local synthetic demo and reload" | — |
| RR7 | LAN exposure of the dev server | Low | Medium | Use `npm run dev:local` | — |
| RR8 | No authentication/RBAC | — | Critical for production | Implement before any hosting | Production |
| RR9 | DNS-rebinding TOCTOU in ingestion | — | High | DNS-pinned egress before `INGESTION_SECURE_EGRESS=confirmed` | Live data |
| RR10 | No approved, permitted government source | — | High | Obtain reuse permission + two-person review | Live data / AI |
| RR11 | Real-Gemini grounding quality unmeasured | — | Medium | Evaluate EN/HI with an approved source before claims | Live AI |
| RR12 | UI not localized; voice not enabled | — | Medium | Don't claim it; roadmap item | — |

## Deliverables

`KrishiSahyog_AI_Phase14_Release.zip` contains the source plus `docs/PHASE_14_AUDIT.md`, `PHASE_14_FIX_LOG.md`, `PHASE_14_TEST_REPORT.md`, `PHASE_14_WINDOWS_DEPLOYMENT.md`, `PHASE_14_HACKATHON_DEMO.md`, `PHASE_14_SECURITY_REVIEW.md`, this summary, and `docs/phase14_evidence/` (logs, browser results, screenshots). `ARCHIVE_VERIFICATION.txt` beside the ZIP records the SHA-256 and the clean-room re-verification.
