"""
FastAPI application entrypoint.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_analyze import router as analyze_router
from app.api.routes_bonds import router as bonds_router
from app.api.routes_market import router as market_router

app = FastAPI(title="Green Prism API", debug=True)

app.include_router(market_router, prefix="/api")

# CORS for local dev (React on Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "app": "Green Prism API"}


app.include_router(analyze_router, prefix="/api")
app.include_router(bonds_router, prefix="/api")
