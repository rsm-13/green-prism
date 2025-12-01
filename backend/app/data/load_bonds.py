"""
Functions to load and query bond metadata (from CSV or DB).
"""

from pathlib import Path
from typing import List, Dict, Any
import pandas as pd

# Use the `app/data` directory (same directory as this module) so the
# API loads `backend/app/data/bonds.csv` rather than the top-level
# `data/bonds.csv` in the repo root.
DATA_DIR = Path(__file__).resolve().parent
BONDS_CSV = DATA_DIR / "bonds.csv"


def load_bonds() -> pd.DataFrame:
    """Load bonds.csv into a pandas DataFrame."""
    if not BONDS_CSV.exists():
        return pd.DataFrame()
    return pd.read_csv(BONDS_CSV)


def list_bonds(limit: int = 20) -> List[Dict[str, Any]]:
    """Return a list of bonds for the API."""
    df = load_bonds()
    if df.empty:
        return []
    return df.head(limit).to_dict(orient="records")


def get_bond(bond_id: str) -> Dict[str, Any] | None:
    """Return a single bond by id."""
    df = load_bonds()
    if df.empty or "bond_id" not in df.columns:
        return None
    match = df[df["bond_id"] == bond_id]
    if match.empty:
        return None
    return match.iloc[0].to_dict()