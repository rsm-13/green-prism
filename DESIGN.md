# Green Prism — Design Document

This document describes the technical design and implementation decisions behind the Green Prism prototype. it is intended to give reviewers a concise tour of the project's internals: how the backend and frontend are organized, how the machine-learning pieces are integrated, and why the particular architectural choices were made.

## high-level architecture

Green Prism is a two-tier web prototype composed of a Python FastAPI backend and a React (Vite) frontend. the backend exposes a small set of REST endpoints under `/api` for listing bonds, returning bond details, running text analysis, and computing rule-based or ML-assisted impact estimates. the frontend is a single page app that consumes the backend endpoints to provide exploratory UI and visualizations.

why this split: using a lightweight HTTP backend (FastAPI) plus a separate SPA keeps concerns separated: data ingestion, preprocessing, and ML logic live in the Python layer (where pandas, scikit-learn/xgboost, and joblib fit naturally), while interactivity and visualization live in the frontend. this separation simplifies local development (start two dev servers) and allows the backend to be used independently (e.g., for batch processing scripts or notebook experiments under `backend/app/ml/notebooks`).

## backend structure and responsibilities

key directories and responsibilities inside `backend/app`:

- `api/` — HTTP route handlers (thin controllers). routes validate and translate incoming JSON into domain calls to `services`.
- `services/` — orchestration and business logic. services glue together data loading, rules, and ML predictors. this keeps the `api` layer lightweight and testable.
- `data/` — CSV loaders, canonical datasets, and utilities used by both scripts and the API.
- `ml/` — model preprocessing, feature engineering, and wrapper functions for ML artifacts. notebooks for experimentation are under `ml/notebooks`.
- `scripts/` — one-off or repeatable data preparation tasks (building unified CSVs, extracting disclosure text from PDFs).

the backend favors explicit loaders and clear function boundaries because the project mixes interactive analysis (notebooks) and runtime inference. `app/data/load_bonds.py` provides the canonical dataset and is used by the API routes to keep route code minimal. `services/scoring_service.py` centralizes scoring and blending logic so the same behavior is used whether scoring is triggered from an endpoint or a script.

## ML integration, artifacts, and fallbacks

the project stores model artifacts in `backend/app/models/` as `joblib` serialized objects (e.g., `impact_estimator_xgb_minilm.joblib`). these artifacts are optional at runtime: the system is explicitly designed to fall back to deterministic rule-based heuristics if artifacts are missing or fail to load. this design choice helps reviewers run the system without heavyweight ML dependencies while still preserving the optional ML enhancement.

key ML design choices:

- lazy loading: ML artifacts and encoder models (transformers) are loaded on demand rather than at process startup to avoid long cold-start times and reduce memory usage for lightweight dev runs. the loader caches artifacts so repeated calls are inexpensive.
- small, explainable fallback rules: when an ML model is absent, rule-based estimators provide a reasonable baseline. these rules also act as a fallback for unit tests and reviewers running the prototype without CUDA or large encoder models.
- separation of preprocessing: feature extraction is implemented in `ml/features.py` and `ml/preprocessing.py`, separate from model wrappers (`transparency_model.py`, `impact_gap_model.py`). this keeps feature logic testable and decoupled from specific model file formats.

## API design and operational choices

the API is intentionally small and synchronous, implemented with FastAPI and driven by `uvicorn` in development. endpoints accept JSON payloads and return JSON. key design considerations:

- explicit validation: route-level Pydantic models validate incoming requests, preventing invalid inputs from propagating into the services layer.
- single responsibility: routes are small and delegate heavy lifting to `services`, improving testability and maintainability.
- clear response shapes: scoring endpoints return a combined structure containing `transparency_score`, `components`, `impact_prediction`, and optional `explanations`. this uniform shape simplifies frontend rendering and future client integrations.

## frontend choices

the frontend is built with React and Vite. Vite provides a fast dev experience and simple production builds. the frontend focuses on a few core components (`src/components`) and a tiny data access layer in `src/api.ts` that centralizes the backend base URL and fetch wrappers. this low-friction approach was chosen to keep the UI easy to read and modify for reviewers while providing sufficient interactivity (charts, panels, and the analyze workflow).

## local development

there are no heavy CI scripts in the prototype, but the repository includes a `Makefile` with common convenience targets (create venv, start dev servers, run a smoke test, basic linting). this was added to reduce onboarding friction for reviewers. the `smoke` target performs a quick `python -c "import app"` check, which validates that the backend package imports cleanly after dependency installation.


## deployment and production considerations

the current prototype is not production-ready. if this project were to be hardened, recommended next steps include:

- add authentication and authorization for API endpoints
- serve a production-built frontend from a dedicated webserver
- introduce logging and structured error telemetry in `services` (context-rich errors for ML failures)
- add containerization (a `Dockerfile` and optionally `docker-compose.yml` for local full-stack runs) and deploy behind an HTTPS reverse proxy with strict network rules
- add end-to-end tests that exercise the main API flows and UI smoke tests for critical user journeys

## trade-offs and rationale

-TODO!
- using `joblib`-serialized artifacts allows model portability without requiring full retraining or complex model registries for a prototype.

## future work

areas that would benefit from further engineering:

- TODO

## closing notes

the goal was to make the prototype easy to run, inspect, and extend. code is organized to minimize surprises for reviewers: data loading and transformation logic lives in `backend/app/data` and `backend/app/ml`, the scoring logic in `backend/app/services`, and the UI in `frontend/src`. if you want, i can add the `docker-compose.yml` and example tests next — tell me which to do and i'll implement them.
