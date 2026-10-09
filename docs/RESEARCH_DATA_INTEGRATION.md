# KrishiSahyog AI — Research data integration (local editorial preview)

## What was implemented

- 12 **real research source references** from `data/research/government_scheme_research.json`, including PM-KISAN, PM-KUSUM, PMKSY, PDMC, PMFBY, e-NAM, PM-AASHA, KCC/MISS, Soil Health Card, mechanization, AIF and watershed programs.
- Each research record stores title, category, department, coverage, benefit *research summary*, broad eligibility guidance, next step, official URLs, source-check date and caveats.
- `0006_research_staging.sql` introduces dedicated `research_catalog_records` and `research_import_log`, not government approved tables.
- `npm run research:check`: validates the file (no PostgreSQL writes).
- `npm run research:import`: imports only into **editorial staging**, idempotently and transactionally.
- An **opt-in, localhost-only development preview** appears under the original **Government schemes** screen. It is visibly labeled *Research preview — not verified*. It cannot be activated with `NODE_ENV=production`.
- The existing public endpoints `/api/v1/public/schemes`, `/policies`, source permissions, approval controls, and verified AI retrieval remain unchanged.
- No farmer personal data, fake prices, benefit statuses, or fake approval decisions were inserted.

## Run on your Windows laptop

From the project directory containing `package.json`:

```powershell
npm ci
npm run db:migrate
npm run research:check
npm run research:import
npm run test:research
```

Configure your private `.env.local` with `DATABASE_URL` and:

```dotenv
NODE_ENV=development
RESEARCH_PREVIEW_ENABLED=true
```

**Restart** your development server:

```powershell
npm run dev
```

Then open `http://127.0.0.1:3000` and select **Government schemes** in the original sidebar. The local preview panel should display **12 unverified research items** with government reference links and clear caveats. If you access the app through an external LAN IP, the preview will not appear (intentional security restriction).

To switch off the preview, set `RESEARCH_PREVIEW_ENABLED=false` and restart. Production always blocks preview.

## Important: avoid false readiness claims

- `npm run pilot:preflight` may still return `NO_APPROVED_SOURCES`. This is correct: editorial research is **not** approval to scrape public government websites.
- `/api/v1/public/schemes` may still report zero approved records. This is correct: importing a research seed does **not** pass government source permissions or the independent review workflow.
- The research source list is **not current eligibility** and does not authorize automatic release of the government text or bulk scraping. Time-sensitive policy, rate, subsidy, current window, and state/district applicability require separate primary-source checks.
- The file contains references to guidelines and circulars but not a verified, effective amendment-level policy catalog. The **Farmer policies** approved catalog remains unchanged.
- Do not mark all 12 as APPROVED just to populate a public screen. To publish, collect approved-permission official evidence using the existing source workflow, reconcile factual claims and effective dates, then complete independent review.

## Failure diagnosis

If no research preview appears:
1. Check `npm run research:check` says 12 records.
2. Check `npm run db:migrate` applies `0006_research_staging` and `npm run research:import` inserts the records.
3. Check `.env.local` contains `RESEARCH_PREVIEW_ENABLED=true`; stop/restart `npm run dev`.
4. Access from `http://127.0.0.1:3000` rather than a LAN address.
5. Check in the browser Network tab that `/api/v1/internal/research-preview` returns 200. A 404 is intentional if the preview is disabled; a 503 indicates a local database problem.

## No major architecture changes

The data provider, production API, source approval state, and existing UI shell remain unchanged. The new staging model and opt-in preview are additive. No private administrative authorization routes were exposed.

## What is still not proven in this sandbox

A live PostgreSQL migration/import, clean npm install, full frontend build, government collection rights, and a deployed source-to-screen publication flow all need validation on a configured machine. Automated tests exercise pure validation, security gating, and an in-memory imitation of SQL transaction calls—not real database integration.

## Optional: transition ONE researched scheme to the existing independent review workflow

After a real source has completed access approval and your collection worker has stored a real public document and extracted nonempty passages, you may create a manual **draft** (never an approved record):

```powershell
npm run content:workflow -- documents .\admin.json
npm run research:to-draft -- PM_KISAN ACTUAL-COLLECTED-DOCUMENT-UUID editor-1 --reviewed
```

The draft command requires a source on one of the referenced official hosts, an approved source collection policy and an actual extracted passage. Its `--reviewed` flag is an editor attestation that they have read and compared the exact original source. It **does not** assert permission to scrape or certify factual accuracy on its own. The creator must independently check the draft against the document and submit it for review; a **different** reviewer must approve it through `content:workflow`.

No scheme records are auto-approved or published through the research import process.
