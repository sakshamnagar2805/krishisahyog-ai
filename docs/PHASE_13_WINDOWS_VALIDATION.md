# Phase 13 Windows Acceptance Commands

After extracting the entire source ZIP, run these in **PowerShell** at project root. Copy `.env.local` from a secure location; never share credentials or data from a real farmer.

```powershell
npm ci
npm run db:migrate
npm run research:import
npm run test:all
npm run lint
npm run build
```

Set `NODE_ENV=development`, `VITE_HACKATHON_DEMO_ENABLED=true`, and `RESEARCH_PREVIEW_ENABLED=true` in `.env.local` (not `.env.example`). Make sure your configured PostgreSQL database is reachable and migrations are applied.

In PowerShell window 1:

```powershell
npm run dev
```

Open `http://127.0.0.1:3000` in Chrome/Edge. In PowerShell window 2:

```powershell
npm run phase13:preflight
```

`readyForSupervisedDemo` may be `false` until `dist/index.html`, running backend, approved record database query, and both preview flags pass. A failing preflight is NOT evidence the code is broken; read the individual checks. `browserFlowsVerified` will always be false because you must still personally complete the user-interface walkthrough in `PHASE_13_HACKATHON_DEMO.md`.

**Known local Linux packaging limitation:** the dependency tree available to the coding environment was built on Windows, so the Rollup Linux native module is missing. `npm ci` on your Windows laptop obtains the correct native optional dependencies. Do not copy our node_modules; they are excluded from the ZIP.

**Security:** local demo is not authentication. Use invented names only; localStorage may contain the synthetic scenario and can be cleared from Profile. The verified catalog/API and publishing database do not accept these local records. Demo mode never enables a live production submission.
