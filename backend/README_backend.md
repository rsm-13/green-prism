# green-prism — backend

This document describes the backend application under `backend/app`. It explains the architecture, each folder and important files, data flows, ML artifacts, scripts, and how to run and test the backend locally.

**Overview**
- **purpose**: backend implements the Green Prism API: bond metadata endpoints, disclosure analysis (transparency scoring and impact prediction), and market time-series endpoints used by the frontend.
- **tech stack**: FastAPI (HTTP API), pandas/numpy for data processing, joblib + sentence-transformers / transformers for ML artifacts, `pypdf` for PDF extraction in scripts. models are stored as serialized joblib artifacts in `app/models`.

**High-level architecture**
- incoming requests hit `app/main.py` (FastAPI app). routers in `app/api` mount endpoints under `/api`.
- `api` routes are thin: they load data (from `app/data`), call `services` to orchestrate business logic, and return JSON responses.
- `services` provide higher-level application logic (scoring, ML inference, market data adapters).
- `ml` contains text preprocessing, rule-based transparency scoring, ML wrappers, feature utilities, and small impact-estimation logic.
- `data` contains CSV datasets used by the API and loader utilities.
- `scripts` contain CLI utilities to build and normalize CSVs or extract disclosure text from PDFs.
- `models` stores trained artifacts (joblib files) that the ML wrappers load lazily at runtime.

**Folder / file map and responsibilities**
- **`app/main.py`**: FastAPI application entrypoint.
  - mounts routers from `app/api`; configures CORS for local development; exposes `/health`.

- **`app/api`**: API route definitions.
  - `routes_analyze.py`: `POST /api/analyze_text` — accepts free text and returns transparency score, impact prediction, explanations. delegates to `services.scoring_service.score_disclosure`.
  - `routes_bonds.py`: `GET /api/bonds` and `GET /api/bonds/{bond_id}` — load bond metadata from `app/data/load_bonds.py`, compute scores and ML impact predictions, and return combined JSON. also exposes `GET /api/bonds/{bond_id}/compute_rule` to force a rule-based impact estimate.
  - `routes_market.py`: `GET /api/market/{symbol}` and `GET /api/market/series/{symbol}` — return lightweight time series and a small summary for a given symbol from `app/services/market_data_csv.py`.

- **`app/data`**:
  - `bonds.csv` and other CSVs: canonical datasets used by the backend.
  - `load_bonds.py`: the canonical loader used by the API (`list_bonds`, `get_bond`). it reads `app/data/bonds.csv` into pandas and returns rows / records for the API.
  - `disclosures_raw/` and `disclosures_texts/`: raw PDF disclosure documents and corresponding extracted text files produced by `scripts/extract_disclosure_text.py`.

- **`app/services`**:
  - `scoring_service.py`: orchestrator that coordinates preprocessing -> transparency scoring (rule-based or ML) -> impact estimator -> explanations. this is the core entrypoint for `analyze_text` flow.
    - calls `app.ml.preprocessing.clean_text` (normalize text)
    - calls `app.ml.transparency_model.score_transparency` (rule-based decomposition)
    - optionally calls `app.ml.transparency_model_ml.predict_transparency_score_ml` when ML artifacts are available and chosen
    - calls `app.ml.impact_gap_model.predict_impact_gap` (rule-based fallback)
    - builds explanations with `app.ml.explanations.build_explanations`.
  - `impact_ml_service.py`: ML-backed impact estimator wrapper.
    - lazy loads `app/models/impact_estimator_xgb_minilm.joblib` and a `SentenceTransformer` encoder
    - accepts `text`, `amount_issued_usd`, `project_category`, and returns predicted impact mean/std and predicted intensity (tCO2 per $1M) when amount is present.
  - `market_data.py` (utility): a thin helper to fetch ETF/index time-series from stooq. note: not referenced by the API; the API uses the local CSV loader below.
  - `market_data_csv.py`: loads `app/data/market_series.csv` (cached with `lru_cache`) and exposes `get_price_series` and `get_series_summary` used by `routes_market.py`.
  - `bonds_service.py`: a small csv-backed loader that duplicates functionality in `app/data/load_bonds.py` — this repository currently uses `app/data/load_bonds.py`; `bonds_service.py` appears duplicated and can be removed or consolidated.

- **`app/ml`**:
  - `preprocessing.py`: `clean_text` — simple whitespace normalization.
  - `features.py`: lightweight, keyword-based text feature extraction (`extract_text_features`, `TextFeatures`), and a convenience `features_as_dict` helper (the latter is not referenced by other modules; it's safe to keep or remove based on preference).
  - `transparency_model.py`: rule-based transparency component scoring. returns a `TransparencyComponents` dataclass with three component scores and an `overall` property.
  - `transparency_model_ml.py`: ML transparency regressor wrapper.
    - lazy-loads a joblib artifact (if present) and an encoder (transformers). exposes `ml_model_available()` and `predict_transparency_score_ml(text)` which returns a 0–100 score.
  - `impact_gap_model.py`: rule-based impact estimator used as a fallback when a claim is present or amount is available. returns `claimed`, `predicted`, `uncertainty`, and `gap`.
  - `explanations.py`: converts model outputs into human-readable messages for the UI; currently a placeholder that should be refined.
  - `transparency_model_ml.py` and `impact` wrappers use ML artifacts stored in `app/models`.

- **`app/models`** (binary artifacts)
  - `impact_estimator_xgb_minilm.joblib` — saved artifact used by `impact_ml_service.py`.
  - `transparency_regressor_from_txt.joblib` and `transparency_regressor_gbr.joblib` — transparency model artifacts used by `transparency_model_ml.py` when available.

- **`app/scripts`** (CLI utilities)
  - `build_bonds_unified.py`: normalize and merge multiple public green bond datasets (World Bank, CBI export, KAPSARC, Kaggle) into a single `app/data/bonds.csv` following a canonical schema. used offline to prepare the `bonds.csv` file the API serves.
  - `build_market_series.py`: normalize index/ETF time series and produce `app/data/market_series.csv`.
  - `extract_disclosure_text.py`: batch-extract text from PDFs in `app/data/disclosures_raw` and write plain text into `app/data/disclosures_texts/`.

- **`app/ml/notebooks`**
  - exploration and model-building notebooks. these are used for experimentation and may call functions in `app/ml` or reimplement snippets; they are not imported by the running backend service.

**Data flow and what gets passed where (core analyzer flow)**
1. request: `POST /api/analyze_text` with JSON `{ "text": "...", "claimed_impact_co2_tons": <num?>, "mode": "rule|ml|blend" }`.
2. `routes_analyze.analyze_text` calls `services.scoring_service.score_disclosure`.
3. `scoring_service.score_disclosure` does:
   - `clean_text(text)` → normalized string
   - `score_transparency(cleaned)` (rule-based) → `TransparencyComponents`
   - if ML mode/blend and artifact present: `predict_transparency_score_ml(cleaned)` → ML float score
   - decide final transparency score (rule | ml | blend)
   - `predict_impact_gap(claimed, amount)` → rule-based impact prediction (fallback path)
   - (optionally) call `impact_ml_service.predict_ml_impact_for_bond` when an amount is present to compute ML-based impact prediction
   - `build_explanations(...)` → array[str]
   - returns a structured JSON containing transparency scores, component scores, impact predictions, and explanations.

**Where ML artifacts live and how they are used**
- artifacts are in `app/models` as joblib files.
- ML wrappers lazy-load joblib artifacts at runtime (to keep startup light). if artifacts are missing, the service falls back to a rule-based path.
- language/fine-tuning encoders are loaded via transformers or sentence-transformers at runtime when required (these are large; ensure CUDA/CPU availability and memory considerations).

**Running the backend locally (development)**
- prerequisites: python (3.10+ / 3.11 recommended), `virtualenv` or `venv`.
- basic steps (run from repo `green-prism/backend`):

```bash
cd green-prism/backend
# create venv if not present
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
# run the server
uvicorn app.main:app --reload
```
- the API will be available at `http://127.0.0.1:8000/` and the routers are mounted under `/api`.
- health check: `GET /health`

**Running scripts**
- build unified bonds CSV (example):

```bash
python app/scripts/build_bonds_unified.py \
  --world-bank app/data/green_bonds_since_2008_11-28-2025.csv \
  --kapsarc app/data/green-bond-issuances.csv \
  --cbi app/data/bonds_export.csv \
  --kaggle app/data/Global_Sustainable_Bonds_Data.csv \
  --output app/data/bonds.csv
```

- extract texts from PDFs:

```bash
python app/scripts/extract_disclosure_text.py
# reads PDFs from app/data/disclosures_raw and writes .txt to app/data/disclosures_texts
```

- build market series:

```bash
python app/scripts/build_market_series.py --sp-index app/data/Green_Bond_Data.csv --ishares app/data/iShares_Green_Bond_Index_Fund_IE.csv --output app/data/market_series.csv
```

**Testing, linting, and static checks**
- run a smoke import to make sure code is importable:

```bash
cd green-prism/backend
source .venv/bin/activate
python -c "import app; print('ok')"
```

- recommended tools:
  - `ruff` / `flake8` for linting
  - `mypy` for optional typing checks
  - `vulture` to surface dead code (be careful: it can miss dynamic uses)

**Notes on dead/duplicate code to review**
- `app/services/bonds_service.py` duplicates functionality found in `app/data/load_bonds.py`. the API imports `app.data.load_bonds`. safe to consolidate/remove the duplicate `services` file.
- `app/services/market_data.py` provides `fetch_etf_history` but the API uses `market_data_csv.py` for on-disk CSV lookups. consider removing or consolidating if not used.
- `app/ml/features.py::features_as_dict` is a small convenience helper not referenced elsewhere; keep it if you want the helper API, otherwise it can be removed.

**Methodologies and design reasoning**
- rule-first fallback: the backend prefers simple, explainable rule-based estimators for transparency and impact so the API can operate without heavy artifacts. ML predictions are additive/optional and only used when artifacts exist.
- lazy-loading ML artifacts: joblib and encoder models are loaded on demand to avoid long startup times and reduce memory use when the service is run in environments that don't need ML predictions.
- small, testable modules: the code splits responsibilities into `api` (HTTP), `services` (orchestration), `ml` (models & preprocessing), `data` (data loaders), and `scripts` (offline data preparation). this separation simplifies review and unit testing.

**Developer checklist before submission**
- ensure `app/models/*.joblib` artifacts are present if ML endpoints are required in the evaluation environment.
- run static checks (ruff/flake8/mypy) and smoke import (`python -c "import app"`).
- reconcile duplicates (`app/services/bonds_service.py`) and confirm `app/data/load_bonds.py` is canonical.
- update `app/ml/explanations.py` to produce more informative human explanations if required by reviewers.
