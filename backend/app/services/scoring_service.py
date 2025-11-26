"""
Orchestrates preprocessing, NLP, transparency model,
impact model, and explanation generation.
"""

from typing import Any, Dict, Optional
from app.ml.preprocessing import clean_text
from app.ml.transparency_model import score_transparency
from app.ml.impact_gap_model import predict_impact_gap
from app.ml.explanations import build_explanations


def score_disclosure(
    text: str, claimed_impact_co2_tons: Optional[float] = None
) -> Dict[str, Any]:
    cleaned = clean_text(text)
    transparency_components = score_transparency(cleaned)
    impact_result = predict_impact_gap(claimed_impact_co2_tons)

    transparency_score = round(transparency_components.overall, 1)

    # naive greenwashing risk placeholder
    greenwashing_risk = "medium"

    explanations = build_explanations(
        cleaned, transparency_components, impact_result
    )

    return {
        "transparency_score": transparency_score,
        "components": {
            "use_of_proceeds_clarity": transparency_components.use_of_proceeds_clarity,
            "reporting_practices": transparency_components.reporting_practices,
            "verification_strength": transparency_components.verification_strength,
        },
        "impact_prediction": impact_result,
        "greenwashing_risk": greenwashing_risk,
        "explanations": explanations,
    }
