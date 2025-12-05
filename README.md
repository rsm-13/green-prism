# Green Prism: Fixed Insight
#### Made By: Radha Munver

## Project Overview

- **what**: Green Prism is a small end-to-end prototype that analyzes green-bond disclosures for transparency and estimates impact (tons of CO₂). it combines a python/FastAPI backend with a React + Vite frontend for exploration and visualization.
- **purpose**: provide reviewers with a reproducible service that (a) lists sample bonds and metadata, (b) scores disclosure transparency (rule-based and optional ML), and (c) predicts/estimates impact using a rule-of-thumb fallback plus an optional ML intensity model.

## Pitch Video
https://www.youtube.com/watch?v=HO3zVZAcv1M


## Architecture

### Repository layout (quick)

- `backend/` — FastAPI application, data loaders, ML wrappers, and data-prep scripts
- `frontend/` — React + Vite single-page application
- `LICENSE` — project license

this file is the user manual: follow the steps below to install, run, and evaluate the project locally. if you need more implementation detail, consult `backend/README.md` and `frontend/README.md`.

### system requirements (tested)

- macOS (zsh) — steps assume `zsh` and macOS, but Linux is similar
- python 3.10+ (3.11 recommended) for backend
- node 18+ and npm/yarn for frontend

---

## Step-by-Step: Run the full stack locally

these exact commands will get the backend and frontend running on a macOS developer machine.

1) backend: create venv, install dependencies, and run

```bash
# from repository root
cd green-prism/backend
python -m venv .venv
source .venv/bin/activate   # macOS / zsh
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
# start the API (dev mode)
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- after successful startup the api is reachable at `http://127.0.0.1:8000` and routes are mounted under `/api`.
- quick smoke-check: `python -c "import app; print('import ok')"` inside the activated venv.

2) frontend: install dependencies and start dev server

```bash
# in a new terminal (frontend runs separately)
cd green-prism/frontend
npm install
npm run dev
```

- open `http://localhost:5173` (vite dev server) while backend is running at port 8000.
- the frontend expects the backend at `http://localhost:8000/api`; adjust `frontend/src/api.ts` if you run the backend elsewhere.

---

### Makefile (quick dev targets)

- `make backend-install` — create backend venv and install requirements
- `make backend-dev` — start backend uvicorn (dev)
- `make backend-run` — run backend via gunicorn + uvicorn worker (production-like)
- `make frontend-install` — install frontend deps (`npm ci`)
- `make frontend-dev` — start frontend dev server
- `make frontend-build` — build frontend for production
- `make lint` — run basic lint checks (ruff, mypy where available)
- `make smoke` — quick backend import smoke test

Usage examples:

```bash
# create backend venv & install deps
make backend-install

# start backend (dev)
make backend-dev

# start frontend dev server (new terminal)
make frontend-dev

# run quick backend smoke test
make smoke
```


## API reference & examples

- `GET /api/bonds?limit={n}` — list bonds (json)
- `GET /api/bonds/{bond_id}` — bond detail (metadata + scores)
- `GET /api/bonds/{bond_id}/compute_rule` — run rule-based impact estimator for a bond
- `POST /api/analyze_text` — analyze free text; body example:

```json
{
	"text": "proceeds are used to build a 10 MW solar farm that will avoid 5,000 tCO2/yr",
	"claimed_impact_co2_tons": 5000,
	"mode": "blend"
}
```

curl example:

```bash
curl -X POST http://127.0.0.1:8000/api/analyze_text \
	-H 'Content-Type: application/json' \
	-d '{"text":"some disclosure text","mode":"rule"}' | jq .
```

expected response shape (abridged):

```json
{
	"mode": "rule",
	"transparency_score": 72.5,
	"rule_based_score": 72.5,
	"ml_score": null,
	"components": { "use_of_proceeds_clarity": 60.0, "reporting_practices": 80.0, "verification_strength": 78.0 },
	"impact_prediction": { "claimed": 5000, "predicted": 3250, "uncertainty": 487.5, "gap": 1750 },
	"greenwashing_risk": "medium",
	"explanations": ["...", "..."]
}
```

---

### Data & model artifacts

- canonical datasets live in `backend/app/data/`, including `bonds.csv` and `market_series.csv`.
- ML artifacts (optional) live in `backend/app/models/`:
	- `impact_estimator_xgb_minilm.joblib` — intensity model
	- `transparency_regressor_*.joblib` — optional transparency ML models

notes:
- if ML artifacts are missing the backend falls back to rule-based behavior; the service remains usable for basic scoring.
- ML encoders (transformers) can be large and may require significant memory to load.

---

### Scripts (data preparation)

- build unified bonds CSV from multiple source CSVs:

```bash
cd backend
source .venv/bin/activate
python app/scripts/build_bonds_unified.py \
	--world-bank app/data/green_bonds_since_2008_11-28-2025.csv \
	--kapsarc app/data/green-bond-issuances.csv \
	--cbi app/data/bonds_export.csv \
	--kaggle app/data/Global_Sustainable_Bonds_Data.csv \
	--output app/data/bonds.csv
```

- build market series CSV:

```bash
python app/scripts/build_market_series.py --sp-index app/data/Green_Bond_Data.csv --ishares app/data/iShares_Green_Bond_Index_Fund_IE.csv --output app/data/market_series.csv
```

- extract text from disclosures PDF directory:

```bash
python app/scripts/extract_disclosure_text.py
```

---

### Notebooks & model development

- notebooks are located under `backend/app/ml/notebooks/`. they document exploratory work and model training steps. notebooks are not required to run the service.

---

### Recommended manual checks

```bash
# backend smoke import
cd backend
source .venv/bin/activate
python -c "import app; print('import ok')"

# optional static checks (install inside venv)
python -m pip install ruff mypy vulture
ruff check .
mypy app || true
vulture app || true
```

note: `vulture` can generate false positives for code used only in notebooks or imported dynamically.

---

## Troubleshooting

- backend import errors: ensure .venv is activated and `requirements.txt` installed.
- frontend cannot reach backend: make sure backend is running on `127.0.0.1:8000` or update `frontend/src/api.ts::API_BASE` to the running host. also check browser console and backend logs for CORS/connection errors.
- missing ML artifacts: check `backend/app/models` and backend logs for warnings; the service will fall back to rule-based predictions when artifacts are absent.

---

### Submission checklist for reviewers

1. ensure python and node are installed
2. run backend steps in `backend/` folder (venv, pip install, uvicorn)
3. run frontend dev server in `frontend/` folder (`npm install`, `npm run dev`)
4. exercise UI or use curl to call API endpoints listed above

if you follow the step-by-step instructions above you should be able to run the system locally without needing additional information.