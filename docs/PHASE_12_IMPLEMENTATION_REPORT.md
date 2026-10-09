# KrishiSahyog AI — Phase 12 implementation and handoff

**Goal:** Improve hackathon demo reliability and the farmer-question-to-source journey, WITHOUT redesigning the existing React layout or bypassing verified government publication.

## What actually changed

1. **Farmer question → staged research walkthrough (localhost development only).** The existing Scheme Explorer research area now accepts questions and uses deterministic topical matching against all 12 already-staged source references. It displays a shortlist, expandable scheme record, a research eligibility *summary* (not a determination), next step, source URL and review caveats. It provides prefilled crop-insurance, solar-pump and crop-credit demonstration questions. Never sends staged research to Gemini or labels the results `VERIFIED`.
2. **Relevant local research appears in existing PMFBY, PACS, credit and agriculture-support navigation**, without fake claim history, loan balances, farmer profiles, or privileged requests. Those private workflows remain unavailable.
3. **Approved-source AI retrieval improved.** Long natural-language questions are tokenized and ranked against up to 500 currently published records per catalog rather than using the entire question as a single SQL substring. Scheme-specific questions explicitly select only the verified scheme code; an unapproved/missing code fails closed. Terms for common needs (insurance, solar, irrigation, loans, mandi, soil, some Hindi keywords) are supported. Does not assess eligibility.
4. **Scheme → verified assistant navigation.** A farmer can select an approved scheme and ask the assistant a contextual question without copying the title. The assistant displays numbered official-source links. HTTP assistant status endpoint identifies whether a Gemini server key is configured. If no approved sources are found, the assistant returns an explicit no-source answer without attempting to invoke Gemini.
5. **Independent errors and safer request handling.** Scheme catalog and policy catalog load independently (a failed policy fetch doesn't erase a successful scheme fetch). AI requests can be canceled when superseded/navigation changes. Local research error, retry and refresh states are shown, with scoped guided questions.
6. **Config consistency.** Shared `.env.local` then `.env` loader (existing shell environment retains priority) used by database migrations, source registration, pilot preflight, ingest worker, research import, editorial CLI, development and production startup. Includes a safe `.env.example` with no credentials.
7. **Read-only hackathon preflight** distinguishes a *configured local research walkthrough* from a truly approved source-backed AI pipeline; its output explicitly says browser end-to-end behavior is not proven. Added test scripts.

## Run Phase 12 locally — Windows PowerShell

Back up your current project, then extract the ZIP into a clean project directory rather than overwriting `.env.local` with files from this package (no real secrets are included). Run from `D:\krishisahyog-ai` or your extracted folder:

```powershell
npm ci
# Copy .env.example to .env.local only if you have no local config already;
# set DATABASE_URL; do not publish this file or put it into source control.
npm run db:migrate
npm run research:check
npm run research:import
npm run test:all
npm run lint
npm run build
```

In your private `.env.local`, set `RESEARCH_PREVIEW_ENABLED=true` and use `NODE_ENV=development` for a **local-only** research demo. The research preview is served ONLY to a loopback client, and never in production. Use:

```powershell
npm run hackathon:preflight
npm run dev
```

Then visit `http://127.0.0.1:3000` **from the same computer**. Test these paths:

1. **Government schemes** → "Find agricultural scheme research" → choose **I need crop insurance** → open PMFBY details → see review caveat and official source link.
2. Same page → choose **How can I install a solar pump?** → open PM-KUSUM source-backed research summary.
3. Same page → choose **Where can I get a crop loan?** → open KCC/MISS research summary.
4. **Crop insurance (PMFBY)**, **PACS services**, **Credit and KCC loans**, **Agriculture support** → examine scoped research (private account services remain disabled).
5. **Government schemes** → if there is a published approved record, click **Ask AI about this verified scheme** → verify its specific scheme is passed to AI, and the answer cites an actual approved source. With no approved records, the assistant reports no verified sources. AI also requires a working server-side `GEMINI_API_KEY`.

Run `npm run pilot:preflight` separately for the **automated government source crawler**. `NO_APPROVED_SOURCES` is expected until a public source's applicable collection/reuse permissions are independently reviewed and registered. No scraping authorization has been granted by this phase.

## What was tested in the tool sandbox

- TypeScript compiler: **PASS** (`tsc --noEmit` using dependencies from the previous Windows project).
- Node automated suite: **78/78 PASS** (`tests/*.test.mjs`), including 8 new Phase 12 tests for question matching, rank and isolation of unapproved content.
- Vite/tsx CLI: **NOT VERIFIED HERE**. The available imported `node_modules` contains Windows-oriented native dependencies and lacks `@rollup/rollup-linux-x64-gnu` in this Linux tool sandbox. The same reused tree also lacks Linux esbuild binaries, so `tsx` CLI smoke tests could not run here. A clean `npm ci` + `npm run build` on Windows remains required.
- Real PostgreSQL migration/import and end-to-end browser clicks: **NOT VERIFIED HERE**; require your running local database and dev server.
- Gemini live generation, government collection permissions, authentication and real beneficiary systems: **NOT VERIFIED / NOT IMPLEMENTED BY THIS PHASE**.

## Residual P0/P1/P2 issues

**P0 before live hackathon judging:** Perform the Windows build and manual click-through; configure PostgreSQL and import data; ensure the local preview appears from localhost; validate relevant official links and carefully distinguish research-only from approved records. Record a backup demo video in case network access fails. Configure a verified government source and publish at least one independently-reviewed scheme if you want the verified AI flow to be genuinely live rather than the research walkthrough.

**P1:** PMFBY, PACS, document locker, claim tracking, grievances, notifications and farmer authentication have no real private backend and must remain explicitly unavailable. Voice is not connected to the grounded public assistant. No state-specific eligibility engine with independently approved rule versions is shipped.

**P2:** Large-scale vector search/RAG, operational monitoring, state-level policy synchronization, performance/load testing and production security review remain future work. The approved-content retrieval is currently bounded at 500 items for schemes and 500 for policies, not a full production search index.

**Do not claim** government partnership, official eligibility/payment status, production scraping authorization, live beneficiary lookup, fully operational PMFBY/PACS private services, or complete deployed readiness.
