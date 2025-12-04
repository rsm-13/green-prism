# green-prism — frontend

This document explains the frontend application in `frontend/` (React + Vite), its structure, core components, data flow with the backend, how to run and build locally, and developer notes for submission.

**Overview**
- purpose: interactive UI for Green Prism — load and browse sample bond metadata, analyze disclosure text for transparency and impact, and show ETF/index performance charts.
- tech stack: React (JSX), Vite, lightweight-charts for plotting, plain CSS for styles. the frontend calls the backend API (`http://localhost:8000/api`) for data and analysis.

**High-level architecture**
- `index.html` mounts the React app into `#root`.
- `src/main.jsx` is the entrypoint and wraps the app with `ThemeProvider`.
- `src/App.jsx` is the root component: it loads data, coordinates page state, and composes major child components.
- `src/api.ts` contains thin fetch wrappers for backend endpoints: analyze, list bonds, bond detail.
- `src/components/` contains presentational and container UI components used by `App.jsx`.
- `src/pages/` contains static pages (e.g., `Instructions`).

**Folder / file map and responsibilities**
- `index.html`: minimal html shell and font links.
- `package.json` / `vite.config.ts`: project dev/build config.
- `src/main.jsx`: react entrypoint that mounts `App` and provides `ThemeProvider`.
- `src/api.ts`: typed (ts-style) fetch helpers used by the UI:
  - `analyzeText(payload)` → `POST /api/analyze_text`
  - `fetchBonds(limit)` → `GET /api/bonds`
  - `fetchBondDetail(id)` → `GET /api/bonds/{id}`

- `src/ThemeContext.js` & `src/ThemeProvider.jsx`:
  - lightweight theming context that persists into `localStorage` and toggles a `dark` class on `document.documentElement`.

- `src/App.jsx`:
  - loads the bond list, selected bond details, market series and summary for chosen ETF, and coordinates the Analyzer flow.
  - keeps local UI state for selected bond, analysis inputs (`text`, `claimed`), scoring/impact modes, and market range.
  - passes props and handlers to child components rather than using a central state manager.

- `src/components/` (key files):
  - `Header.jsx`: top navbar, brand, and page navigation.
  - `BondsPanel.jsx`: searchable list of bonds on the left and selected bond detail panel.
  - `Analyzer.jsx`: textarea and controls to run disclosure analysis and display results.
  - `MarketView.jsx`: ETF/range selectors and charting area.
  - `Chart.jsx`: wrapper around `lightweight-charts` to render time series.
  - `Loader.jsx` + `loader.css`: small spinner used for fetch loading states.

- `src/pages/Instructions.jsx`: static instructions/help page.
- `src/styles/global.css`: global CSS variables and app styles.
- `src/assets/`: images used in the UI (logo, icons).

**Data flow and what gets passed where**
- user actions → `App.jsx` handlers → `src/api.ts` fetch helpers → backend API.
- example analyzer flow:
  1. user pastes disclosure text in `Analyzer.jsx` and clicks “Run Analysis”.
  2. `App.handleAnalyze` builds payload and calls `analyzeText` (in `src/api.ts`).
  3. backend returns structured result with transparency score, impact prediction, and explanations.
  4. `App` stores the result (`analysis`) and passes it back to `Analyzer.jsx` for display.

- bond listing flow:
  1. `App` requests `fetchBonds(5000)` on mount to populate the client-side searchable dropdown.
  2. when a bond is selected, `App` calls `fetchBondDetail(id)` and displays bond metadata and scores via `BondsPanel`.

- market data flow:
  - `App` fetches `/api/market/{symbol}` to get time-series points for the chart and `/api/market/series/{symbol}` to retrieve the latest summary (price, yields).

**Scoring / Mode UX**
- transparency scoring modes: `rule`, `ml`, `blend` (default `rule`). the UI lets users select which scoring approach to prefer; the backend may fall back to rule-based scoring if ML artifacts are missing.
- impact mode (separate toggle) controls whether the UI prioritizes ML intensity model predictions or the rule-based estimate when showing impact predictions.

**Local development**
- prerequisites: node 18+ (or compatible), npm or yarn. backend should be running on `http://localhost:8000` for full functionality.

Quick start (from repo root):

```bash
# frontend
cd frontend
npm install
npm run dev
```

- the dev server (vite) usually runs at `http://localhost:5173`.
- ensure backend is running (see `backend/README.md`) or the app will show errors when trying to call the API.

**Build / production**
- to build a production bundle:

```bash
cd frontend
npm run build
# preview static build
npm run preview
```

- the built static files are in `frontend/dist` which you can serve with any static hosting or integrate into a combined deployment with the backend.

**Linting / formatting / types**
- the repository uses plain JSX and a small `api.ts` typed shapes. you may add `eslint`, `prettier`, or migrate to TypeScript if desired.

**Common issues and troubleshooting**
- CORS: the backend includes permissive CORS configuration for local dev. if you host backend on a different origin, update `frontend/src/api.ts::API_BASE` and backend CORS settings.
- large bond CSV: `App` requests up to 5000 rows to support client-side search; this is intentional but can be reduced for constrained environments.
- ML artifacts missing: when ML models are absent on the backend, ML predictions will be unavailable and UI will display rule-based fallback values.

**Developer notes / suggestions**
- consider converting `src` to TypeScript for stronger prop typing and easier maintenance.
- add small unit tests for core pure helpers (e.g., the `chooseImpact` function in `App.jsx`).
- add an integration smoke test that runs the backend locally and launches the frontend dev server to ensure the end-to-end flow works for reviewers.

**Where to look next**
- backend integration: `frontend/src/api.ts` and `backend/app/api` for how endpoints align.
- `src/components` for UI responsibilities and how props flow from `App.jsx`.