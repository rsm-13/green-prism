from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException

from app.data.load_bonds import list_bonds, get_bond
from app.services.scoring_service import score_disclosure

router = APIRouter()


@router.get("/bonds", response_model=List[Dict[str, Any]])
def get_bonds(limit: int = 20):
    return list_bonds(limit=limit)


@router.get("/bonds/{bond_id}", response_model=Dict[str, Any])
def get_bond_detail(bond_id: str):
    bond = get_bond(bond_id)
    if not bond:
        raise HTTPException(status_code=404, detail="Bond not found")

    # For Phase 1, just use the use_of_proceeds text as the "disclosure"
    disclosure_text = str(bond.get("use_of_proceeds") or "")
    claimed = bond.get("claimed_impact_co2_tons")

    scores = score_disclosure(disclosure_text, claimed_impact_co2_tons=claimed)

    return {
        "bond": bond,
        "scores": scores,
    }

# -------------------

"""
Routes for sample bond listing and detail:
GET /api/bonds
GET /api/bonds/{bond_id}
"""

"""from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
from app.data.load_bonds import list_bonds, get_bond
from app.services.scoring_service import score_disclosure
from app.services.market_data_service import get_etf_price_history

router = APIRouter()


@router.get("/bonds", response_model=List[Dict[str, Any]])
def get_bonds(limit: int = 20):
    return list_bonds(limit=limit)


@router.get("/bonds/{bond_id}", response_model=Dict[str, Any])
def get_bond_detail(bond_id: str):
    bond = get_bond(bond_id)
    if not bond:
        raise HTTPException(status_code=404, detail="Bond not found")

    disclosure_text = str(
        bond.get("disclosure_text") or bond.get("use_of_proceeds") or ""
    )
    claimed = bond.get("claimed_impact_co2_tons")

    scores = score_disclosure(disclosure_text, claimed_impact_co2_tons=claimed)
    prices = get_etf_price_history(ticker="GRNB", days=60)

    return {
        "bond": bond,
        "scores": scores,
        "market_proxy": {"ticker": "GRNB", "prices": prices},
    }
"""