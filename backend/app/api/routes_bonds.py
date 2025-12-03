from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException

from app.data.load_bonds import list_bonds, get_bond
from app.services.scoring_service import score_disclosure
from app.services.impact_ml_service import predict_ml_impact_for_bond
from app.ml.impact_gap_model import predict_impact_gap

router = APIRouter()


@router.get("/bonds", response_model=List[Dict[str, Any]])
def get_bonds(limit: int = 100):
    return list_bonds(limit=limit)


@router.get("/bonds/{bond_id}", response_model=Dict[str, Any])
def get_bond_detail(bond_id: str):
    bond = get_bond(bond_id)
    if not bond:
        raise HTTPException(status_code=404, detail="Bond not found")

    # For Phase 1, just use the use_of_proceeds text as the "disclosure"
    disclosure_text = str(bond.get("use_of_proceeds") or "")
    claimed = bond.get("claimed_impact_co2_tons")

    # score_disclosure currently accepts: text, claimed_impact_co2_tons, mode
    # Pass only supported args to avoid unexpected keyword errors.
    scores = score_disclosure(
        text=disclosure_text,
        claimed_impact_co2_tons=claimed,
        amount_issued_usd=bond.get("amount_issued_usd"),
    )

    ml_impact = predict_ml_impact_for_bond(
        text=str(bond.get("disclosure_text") or bond.get("use_of_proceeds") or ""),
        amount_issued_usd=bond.get("amount_issued_usd"),
        project_category=bond.get("project_category"),
    )

    # Map ML impact output to the UI-friendly shape expected by frontend
    if ml_impact is not None:
        ml_mapped = {
            "claimed": claimed,
            "predicted": ml_impact.get("predicted_impact_mean"),
            "uncertainty": ml_impact.get("predicted_impact_std"),
            # keep original intensity if the UI or downstream needs it
            "predicted_intensity_tco2_per_musd": ml_impact.get("predicted_intensity_tco2_per_musd"),
        }
        scores["impact_prediction_ml"] = ml_mapped

        # If the rule-based prediction is missing (no claimed value and no
        # amount-based fallback), make the ML prediction available under
        # `impact_prediction` as a fallback so the UI shows a prediction when
        # the user selects the Rule button.
        try:
            rule_pred = scores.get("impact_prediction", {}).get("predicted")
        except Exception:
            rule_pred = None

        if rule_pred in (None, 0) and ml_mapped.get("predicted") is not None:
            # copy ML output into the rule slot as a fallback
            scores["impact_prediction"] = {**ml_mapped, "source": "ml_fallback"}


    return {
        "bond": bond,
        "scores": scores,
    }


@router.get("/bonds/{bond_id}/compute_rule", response_model=Dict[str, Any])
def compute_rule_estimate(bond_id: str):
    """Run the rule-based impact estimator for a bond and return its output.

    This endpoint is used by the frontend to explicitly run the rule estimator
    on-demand (for example when the user selects Rule mode) and return a
    numeric prediction even if the initial fetch used ML or had no claim.
    """
    bond = get_bond(bond_id)
    if not bond:
        raise HTTPException(status_code=404, detail="Bond not found")

    claimed = bond.get("claimed_impact_co2_tons")
    amount = bond.get("amount_issued_usd")

    result = predict_impact_gap(claimed, amount, bond.get("project_category"))

    return {"impact_prediction_rule": result}

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