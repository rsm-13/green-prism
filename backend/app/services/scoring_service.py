from typing import Any, Dict, Optional
import re

KEYWORDS = [
    "co2", "carbon", "emission", "emissions",
    "renewable", "solar", "wind", "energy",
    "reduction", "reduced", "capacity", "mwh",
    "tons", "efficiency", "impact", "verified",
]

def normalize_reporting(value: str | None) -> float:
    if not value:
        return 0.2
    value = value.lower()
    if "annual" in value:
        return 1.0
    if "semi" in value:
        return 0.7
    if "none" in value:
        return 0.2
    return 0.4  # fallback


def text_clarity(text: str) -> float:
    """Simple proxy: longer + keyword-rich = clearer"""
    if not text:
        return 0.0

    clarity = len(text.split()) / 50  # 50 words = decent detail
    clarity = min(clarity, 1.0)

    return clarity


KEYWORD_WEIGHTS = {
    "co2": 2.0, "carbon": 2.0, "emission": 2.0, "emissions": 2.0,
    "mwh": 2.0, "gw": 2.0, "capacity": 2.0,

    "renewable": 1.5, "solar": 1.5, "wind": 1.5, "geothermal": 1.5, "hydro": 1.5,

    "energy": 1.0, "efficiency": 1.0, "tons": 1.0, "avoid": 1.0,
    "avoided": 1.0, "footprint": 1.0, "methane": 1.0,

    "kpi": 1.0, "kpis": 1.0, "metric": 1.0, "metrics": 1.0, "verified": 1.0,
}

def kpi_specificity_from_text(text: str) -> float:
    """Weighted KPI keyword scoring"""
    if not text:
        return 0.0

    score = 0.0
    text_lower = text.lower()

    for kw, weight in KEYWORD_WEIGHTS.items():
        if re.search(rf"\b{kw}\b", text_lower):
            score += weight

    # Weighted scale, cap at 1.0
    return min(score / 15.0, 1.0)



def score_disclosure(
    text: str,
    claimed_impact_co2_tons: Optional[float] = None,
    external_review: Optional[int] = None,
    reporting_practices: Optional[str] = None,
    certification: Optional[int] = None,
) -> Dict[str, Any]:

    clarity = text_clarity(text)
    reporting = normalize_reporting(reporting_practices)
    verification = float(external_review) if external_review is not None else 0.0
    kpi = kpi_specificity_from_text(text)
    cert = float(certification) if certification is not None else 0.0

    transparency_score = (
        0.30 * clarity +
        0.25 * reporting +
        0.20 * verification +
        0.15 * kpi +
        0.10 * cert
    ) * 100

    claimed = claimed_impact_co2_tons or None
    predicted = (claimed * 0.65) if claimed else None
    gap = claimed - predicted if claimed else None

    return {
        "transparency_score": round(transparency_score, 1),
        "components": {
            "clarity": round(clarity * 100, 1),
            "reporting": round(reporting * 100, 1),
            "verification": round(verification * 100, 1),
            "kpi_specificity": round(kpi * 100, 1),
            "certification": round(cert * 100, 1),
        },
        "impact_prediction": {
            "claimed": claimed,
            "predicted": round(predicted, 1) if predicted else None,
            "gap": round(gap, 1) if gap else None,
        },
        "greenwashing_risk": "low" if transparency_score > 75 else "medium",
        "explanations": [
            f"Use-of-proceeds clarity score: {round(clarity*100)}",
            f"KPI specificity score: {round(kpi*100)}",
            f"Reporting practices: {reporting_practices}",
            f"External review: {'yes' if verification else 'no'}",
            f"Certification: {'yes' if cert else 'no'}",
        ],
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