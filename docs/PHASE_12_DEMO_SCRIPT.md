# Phase 12 hackathon dry-run — 4 to 5 minutes

## Before presenting

- Local database is running; `.env.local` contains an actual working `DATABASE_URL`.
- `npm run research:import` inserted the 12 public research references in **editorial staging**.
- Local-only `RESEARCH_PREVIEW_ENABLED=true`; `npm run hackathon:preflight` reports `researchWalkthroughReady: true`.
- `npm run build` passed on your laptop; dev server at `http://127.0.0.1:3000`.
- Do not display `.env.local`, secret tokens, SQL connections, or real farmer information.

## 0:00–0:40 — Farmer's problem

"A farmer needs to understand several schemes and where to apply. Government information is spread across different official websites and documents. KrishiSahyog aims to provide one guided entry point."

## 0:40–1:15 — Existing dashboard

Open **Dashboard**. Explain the distinction between public information and private account workflows. Show the navigation, but do **not** claim any simulated loan, claim, or farmer account details are live.

## 1:15–2:35 — Live research walkthrough

Open **Government schemes**. Scroll to **Find agricultural scheme research**. Select **I need crop insurance**; expand PMFBY. Show source authority, the reference link, the farmer's next step and the prominent *RESEARCH ONLY — NOT APPROVED* warning. Repeat with **solar pump** (PM-KUSUM) and **crop loan** (KCC/MISS). This is deterministic research matching, **not AI** and **not individual eligibility screening**.

## 2:35–3:20 — Related program access

Open **Crop insurance (PMFBY)**, **PACS services**, **Credit and KCC loans** or **Agriculture support**. Show the scoped research references. Point out that private beneficiary status, claim filing and lender data remain disabled until real government/lender integrations are approved.

## 3:20–4:15 — Verified-data architecture / optional live AI

Explain: research staging → permissioned official source ingestion → document extraction → human editorial review → separate reviewer approval → published catalog → grounded Gemini answer with official citations. If a record is truly published and Gemini is configured, use **Ask AI about this verified scheme**. Otherwise, show the honest no-source state and explain the remaining dependency. **Never use staged research to simulate a verified AI answer.**

## 4:15–5:00 — Value and roadmap

Demonstrate how one typed farmer need connects to relevant schemes and official next steps, and outline the remaining work: signed-off source permissions, state-specific rules, voice integration, real claim/PACS connectors and production pilot.

## Judge questions — short accurate answers

- **Is this official government data?** Official government *links* and research summaries have been collected; they remain unapproved for automatic publication. No government partnership is claimed.
- **Does it check actual eligibility?** No; it offers information and source-based discovery, and labels eligibility as unassessed.
- **Does it retrieve real PMFBY claim status?** No; live beneficiary data is not integrated.
- **Is AI working end to end?** Grounded assistant logic is implemented and unit-tested. A live answer requires an independently approved published source, a valid Gemini server key and successful runtime verification.
- **Can it go live today?** No; authorization, end-to-end checks and remaining modules are outstanding.
