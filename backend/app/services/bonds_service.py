# backend/app/services/bonds_service.py
from pathlib import Path
from typing import List, Dict, Optional
import csv

DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "app" / "bonds.csv"


def load_bonds(limit: Optional[int] = None) -> List[Dict]:
    if not DATA_PATH.exists():
        # Make this loud so you see it in the FastAPI logs if wrong path
        raise RuntimeError(f"bonds.csv not found at {DATA_PATH}")

    bonds: List[Dict] = []
    with DATA_PATH.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            bonds.append(row)
            if limit is not None and limit > 0 and len(bonds) >= limit:
                break
    return bonds


def get_bond(bond_id: str) -> Optional[Dict]:
    for row in load_bonds(limit=None):
        if row.get("bond_id") == bond_id:
            return row
    return None
