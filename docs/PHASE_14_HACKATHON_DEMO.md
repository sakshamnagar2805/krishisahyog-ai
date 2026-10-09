# KrishiSahyog AI — Phase 14 Hackathon Demo Script (5 minutes)

**What this is:** a supervised localhost prototype. Farmer data is synthetic and lives only in the browser. Government scheme content is either **independently approved** (currently none) or **research-only** (12 staged records). Nothing is submitted to PMFBY, PACS, CPGRAMS, UIDAI or any lender.

**Never say:** "integrated with PMFBY/PACS/CPGRAMS", "government-approved", "production-ready", "the farmer is eligible", or "live government data".

## Before the judges arrive (T‑30 min) — live-demo checklist

Tick each box on the demo laptop. This checklist **is** the Browser Demo Gate, and no script can tick it for you.

**Machine & services**
- [ ] Laptop on mains power; sleep disabled; notifications muted (Focus Assist on).
- [ ] PostgreSQL service running: `Get-Service postgresql*` shows Running.
- [ ] `npm run build` ended with `"ok": true`.
- [ ] `npm run dev:local` running in window 1; `npm run phase14:gate` in window 2 shows Code Quality PASS, Runtime PASS.
- [ ] Chrome/Edge open at `http://127.0.0.1:3000`, zoom 100–110%, other tabs closed, bookmarks bar hidden.
- [ ] A second browser profile (or incognito) is open at the same URL as a hot spare.

**Click-through (record PASS/FAIL and initials)**
- [ ] Dashboard shows the yellow **HACKATHON DEMO — SYNTHETIC FARMER DATA** banner and "Synthetic farmer (demo)" in the header.
- [ ] Header bell number = sidebar Notifications badge.
- [ ] Profile shows `DEMO-FRM-1001`, Jaipur, Rajasthan and "Not connected to Aadhaar…". Then click **Reset demo data… → Confirm reset**.
- [ ] PMFBY shows claim `DEMO-CLM-2026-001` and "fictional scenario values, not a PMFBY portal result".
- [ ] Grievances: create one linked to `DEMO-CLM-2026-001`; simulate *under review*; timeline shows "Simulated under review".
- [ ] PACS: save an enquiry; simulate *information required*; *Generate collection slip* says "Demo collection slip — not valid at any PACS godown".
- [ ] Documents: record preparation for **Land Record — MISSING**; it still says MISSING afterwards.
- [ ] Notifications: new demo items listed; Mark read / Mark unread both work; reload keeps state.
- [ ] Government schemes: "No verified government records…", plus 12 items each marked **RESEARCH ONLY**; one official link opens on an https government site.
- [ ] AI assistant: an English and a Hindi question both return **NO VERIFIED SOURCES AVAILABLE** (Hindi text renders correctly with no boxes or "tofu" placeholder glyphs).
- [ ] Phone-width check (DevTools 390 px): banner visible, no sideways scroll.
- [ ] **Reset demo again** so the judges see a clean seed.

## Timed script

| Time | Screen | Do | Say (verbatim disclosure in **bold**) |
|---|---|---|---|
| 0:00–0:30 | — | — | "Farmers juggle separate portals for crop insurance, cooperative credit and schemes. KrishiSahyog shows one guided interface — and treats the difference between verified public information and private records as a hard rule." |
| 0:30–1:00 | Dashboard | Point at the yellow banner, the farmer name, and the "Needs your attention" list. | "**Everything about this farmer — name, land, claim, amounts — is synthetic test data stored only in this browser. Nothing here is connected to any government system.**" |
| 1:00–1:45 | Crop insurance (PMFBY) → *Claim documents* | Show the claim status and the missing/expired documents. | "**These claim values are fictional scenario numbers, not a PMFBY result.** The app explains what documents a claim typically needs; real claims go to pmfby.gov.in." |
| 1:45–2:15 | Documents | Record a preparation note on the missing land record and show it **stays MISSING**. | "We never upload files or mark anything verified. **Only the real authority can verify a document.**" |
| 2:15–2:50 | Grievances | Create a grievance linked to the same claim ID; click *Simulate: under review*. | "**This ticket exists only in the browser — it is not filed with CPGRAMS.** The simulate buttons are an operator control to show the tracking UX." |
| 2:50–3:20 | PACS services → Notifications | Save a KCC enquiry; simulate *information required*; open Notifications; press F5. | "**No PACS or bank receives this; there are no approvals or money movement.** Notice the same farmer ID across all modules, and that state survives a refresh." |
| 3:20–4:15 | Government schemes → AI assistant | Search "solar pump"; open PM-KUSUM; show RESEARCH ONLY + caveats + official link. Then ask the AI in Hindi: *फसल बीमा का पैसा कब मिलेगा?* | "**These 12 are research notes pointing at official websites — not approved content and not an eligibility decision.** Our AI answers *only* from independently approved government documents. We haven't yet secured reuse permission for any source, so it honestly says it has no verified source — instead of inventing a premium or deadline." |
| 4:15–5:00 | (talk) | — | "Behind this: a permissioned ingestion pipeline with SSRF/DNS checks, a two-person editor–reviewer publication workflow (self-approval is rejected), and grounded answers that must cite approved sources. **What's not done: source reuse permissions, authentication, real PMFBY/PACS/CPGRAMS integrations and production hardening.**" |

## Fallback / backup plan

| Failure | Immediate action (≤15 s) | Say |
|---|---|---|
| A demo page shows "This page could not be displayed" | Click **Reset local synthetic demo and reload**, then continue from that screen. | "Resetting the local simulation." |
| Schemes page shows HTTP 503 | Continue with the demo modules, which work without the DB. In window 2 run `Start-Service postgresql-x64-16`; the page recovers on Refresh without restarting the app. | "The verified-data service is offline; notice we don't fall back to fake data." |
| Dev server window closed or crashed | Window 1: `npm run dev:local` (about 3 s), then F5. Demo data is still in the browser. | — |
| Browser frozen | Switch to the spare profile/incognito window. Demo data starts fresh: click through Dashboard → PMFBY. | — |
| Laptop/projector failure | Present `docs/phase14_evidence/browser/` screenshots 01, 04, 07, 09, 11, 15, 18, 19 in order. | "These are from our automated run of the same journey." |
| Judge asks for a live AI answer | Do **not** add a fake approved record. Show `PHASE_14_TEST_REPORT.md` §2.3 (approval workflow + citation rules tested on a labelled fixture). | "We won't fake an approved government source on stage." |
| Hindi shows boxes | Say the font is missing on this machine; continue in English. | — |

## Judge Q&A (honest answers)

- **Is this real claim data?** No. It is one synthetic farmer, clearly labelled, stored only in the browser.
- **Can a farmer file a real grievance or claim here?** No. We link to pgportal.gov.in and pmfby.gov.in.
- **Do you determine eligibility?** No. Discovery is relevance-only and every screen says eligibility was not assessed.
- **Is the AI live?** The approved-source pipeline is implemented and tested with a labelled fixture and a stub model. A live Gemini answer needs a legitimately approved source and a configured key, and we haven't faked one.
- **Hindi / voice?** AI answers can be in Hindi. The menus are not yet translated, and voice input/output is not enabled in this build.
- **Could this go to production tomorrow?** No. Authentication, source permissions, government integrations, edge rate limiting and security headers are still outstanding.
