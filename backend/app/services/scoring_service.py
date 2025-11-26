from typing import Any, Dict

def score_disclosure(
    text: str,
    claimed_impact_co2_tons: float | None = None,
) -> Dict[str, Any]:
    """
    Phase 1: hard-coded / dummy scores.
    We ignore the text and just return believable-looking values.
    """

    # Use a default claimed impact if none given
    claimed = float(claimed_impact_co2_tons) if claimed_impact_co2_tons is not None else 50000.0

    transparency_score = 78.5
    components = {
        "use_of_proceeds_clarity": 82.0,
        "reporting_practices": 75.0,
        "verification_strength": 76.0,
    }

    predicted = 33000.0
    uncertainty = 6000.0
    gap = claimed - predicted

    impact_prediction = {
        "claimed": claimed,
        "predicted": predicted,
        "uncertainty": uncertainty,
        "gap": gap,
    }

    # super simple heuristic
    greenwashing_risk = "medium"

    explanations = [
        "This bond clearly specifies project type and intended environmental outcomes.",
        "Reporting is described at a high level, but the frequency and exact metrics are not fully detailed.",
        "There is some mention of external review, but the strength of third-party verification could be clearer.",
        f"The bond claims {claimed:,.0f} tons CO₂ avoided, while the model predicts about {predicted:,.0f} ± {uncertainty:,.0f} tons.",
    ]

    return {
        "transparency_score": transparency_score,
        "components": components,
        "impact_prediction": impact_prediction,
        "greenwashing_risk": greenwashing_risk,
        "explanations": explanations,
    }


# --------------------
"""
Orchestrates preprocessing, NLP, transparency model,
impact model, and explanation generation.
"""

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
"""