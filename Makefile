.PHONY: help backend-install backend-dev backend-run frontend-install frontend-dev frontend-build lint smoke

help:
	@printf "Available targets:\n"
	@printf "  backend-install   create backend venv and install requirements\n"
	@printf "  backend-dev       start backend uvicorn (dev)\n"
	@printf "  backend-run       run backend with gunicorn (production-like)\n"
	@printf "  frontend-install  install frontend deps (npm)\n"
	@printf "  frontend-dev      start frontend dev server\n"
	@printf "  frontend-build    build frontend for production\n"
	@printf "  lint              run basic linting checks\n"
	@printf "  smoke             run a quick backend import smoke test\n"

backend-install:
	@echo "creating venv and installing backend dependencies..."
	cd backend && python -m venv .venv && . .venv/bin/activate && python -m pip install --upgrade pip && python -m pip install -r requirements.txt

backend-dev:
	@echo "starting backend (uvicorn) on 127.0.0.1:8000"
	cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

backend-run:
	@echo "running backend with gunicorn (uvicorn worker)"
	cd backend && source .venv/bin/activate && gunicorn -k uvicorn.workers.UvicornWorker app.main:app -b 127.0.0.1:8000

frontend-install:
	@echo "installing frontend dependencies (npm)"
	cd frontend && npm ci

frontend-dev:
	@echo "starting frontend dev server (vite)"
	cd frontend && npm run dev

frontend-build:
	@echo "building frontend for production"
	cd frontend && npm run build

lint:
	@echo "running basic lint checks"
	@cd backend && if [ -f .venv/bin/activate ]; then . .venv/bin/activate; fi && python -m pip install --upgrade pip >/dev/null 2>&1 || true
	@cd backend && if [ -f requirements.txt ]; then python -m pip install ruff mypy >/dev/null 2>&1 || true; fi
	@cd backend && ruff check . || true
	@cd backend && mypy app || true
	@cd frontend && if [ -f package.json ]; then npm run lint || true; fi

smoke:
	@echo "running quick backend import smoke test"
	cd backend && if [ -f .venv/bin/activate ]; then . .venv/bin/activate; fi && python -c "import app; print('import ok')"
