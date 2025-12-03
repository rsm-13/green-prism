# backend/app/services/scoring_service.py
"""
Orchestrates preprocessing, NLP, transparency model,
impact model, and explanation generation.
"""

from typing import Any, Dict, Optional

from app.ml.preprocessing import clean_text
from app.ml.transparency_model import score_transparency
from app.ml.impact_gap_model import predict_impact_gap
from app.ml.explanations import build_explanations
from app.ml.transparency_model_ml import (
    predict_transparency_score_ml,
    ml_model_available,
)


def score_disclosure(
    text: str,
    claimed_impact_co2_tons: Optional[float] = None,
    amount_issued_usd: Optional[float] = None,
    mode: str = "rule",  # "rule" | "ml" | "blend"
) -> Dict[str, Any]:
    cleaned = clean_text(text)

    # Rule-based teacher
    transparency_components = score_transparency(cleaned)
    rule_score = round(transparency_components.overall, 1)

    # Optional ML score
    ml_score: Optional[float] = None
    if mode in ("ml", "blend") and ml_model_available():
        ml_score = predict_transparency_score_ml(cleaned)

    # Decide final transparency_score
    if mode == "ml" and ml_score is not None:
        transparency_score = round(ml_score, 1)
        source = "ml"
    elif mode == "blend" and ml_score is not None:
        blended = 0.5 * rule_score + 0.5 * ml_score
        transparency_score = round(blended, 1)
        source = "blend"
    else:
        transparency_score = rule_score
        source = "rule"

    # Impact model: pass amount through so a rule-based fallback can estimate
    # predicted impact when no claimed value is provided.
    impact_result = predict_impact_gap(claimed_impact_co2_tons, amount_issued_usd)

    # naive greenwashing risk placeholder
    greenwashing_risk = "medium"

    explanations = build_explanations(
        cleaned, transparency_components, impact_result
    )

    return {
        "mode": source,
        "transparency_score": transparency_score,
        "rule_based_score": rule_score,
        "ml_score": ml_score,
        "components": {
            "use_of_proceeds_clarity": transparency_components.use_of_proceeds_clarity,
            "reporting_practices": transparency_components.reporting_practices,
            "verification_strength": transparency_components.verification_strength,
        },
        "impact_prediction": impact_result,
        "greenwashing_risk": greenwashing_risk,
        "explanations": explanations,
    }
