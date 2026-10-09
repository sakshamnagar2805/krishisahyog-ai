# KrishiSahyog — Agricultural Research Dataset Integration

## Scope
Integrated the previously supplied 12-record `KrishiSahyog_government_scheme_research.json` into the existing project as **research only**, without source-permission fabrication, individual farmer data, fake prices or automatic approval. Product header, dashboard shell, sidebar, modules and verified public endpoints remain intact.

## New or updated components
- `data/research/government_scheme_research.json` — exact research seed used for staged import.
- `server/db/migrations/0006_research_staging.sql` — editorial staging and import history.
- `server/research/model.ts`, `import.ts`, `candidate.ts`, `access.ts`, `previewApi.ts` — validation, provenance, draft criteria and localhost-only preview.
- `scripts/import-research.ts` — dry-run and PostgreSQL research import.
- `scripts/research-to-draft.ts` — manual reviewed-document-to-draft bridge. Uses original review/publishing service; never approves automatically.
- `src/components/public/ResearchPreviewPanel.tsx` — developer-only unverified catalog card list inside existing Government schemes page.
- `src/App.tsx`, `server/index.ts`, `vite.config.ts`, `package.json` — only small additive wiring changes.
- `tests/research_integration.test.mjs` — 7 additional tests.
- `docs/RESEARCH_DATA_INTEGRATION.md` — Windows command runbook and status interpretation.

## Coverage
PM-KISAN, PM-KUSUM, PMKSY, PDMC, PMFBY, e-NAM, PM-AASHA, KCC/MISS, Soil Health Card, SMAM, AIF, WDC-PMKSY.

## Tests and limitations
- 70 of 70 focused tests passed under Node 22.16.0.
- TypeScript (`tsc --noEmit`) passed when the previously uploaded Windows dependency tree was made available for type checking.
- Vite build was **not** confirmed: Windows-installed dependency archive lacks `@rollup/rollup-linux-x64-gnu` for this Linux sandbox. The Windows laptop with its native dependencies should run `npm run build`.
- Live PostgreSQL migrations and imports were not run in this sandbox. `npm run research:import` must be run against the laptop's working PostgreSQL installation after `npm run db:migrate`.
- No live government webpage collection or government source approval occurred. `pilot:preflight` can still legitimately return `NO_APPROVED_SOURCES`.
- Policy source links are included as references where present, but the dataset does not contain review-complete, effective policy amendments; none were fabricated or automatically published.

## Developer execution
```powershell
npm ci
npm run db:migrate
npm run research:check
npm run research:import
npm run test:research
npm run lint
npm run build
```
Add `RESEARCH_PREVIEW_ENABLED=true` to local `.env.local`, restart `npm run dev`, open `http://127.0.0.1:3000`, choose **Government schemes**.

The original approved public scheme and policy catalogs remain unchanged and may still be empty. Research items appear **only** in the labeled local preview panel. Production never exposes that panel. Do not mark research entries APPROVED without original collected documentation, source permissions, and independent human review.
