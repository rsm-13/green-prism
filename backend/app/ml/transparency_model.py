# backend/app/ml/transparency_model.py
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from app.ml.features import TextFeatures, extract_text_features


@dataclass
class TransparencyComponents:
    use_of_proceeds_clarity: float
    reporting_practices: float
    verification_strength: float
    raw_features: TextFeatures

    @property
    def overall(self) -> float:
        return round(
            (0.4 * self.use_of_proceeds_clarity)
            + (0.3 * self.reporting_practices)
            + (0.3 * self.verification_strength),
            1,
        )


def _score_use_of_proceeds(feats: TextFeatures) -> float:
    base = 20.0
    if feats.has_use_of_proceeds:
        base += 40.0
    base += feats.environmental_focus_score * 30.0
    base += min(feats.num_numbers, 10) * 1.0
    return max(0.0, min(100.0, base))


def _score_reporting(feats: TextFeatures) -> float:
    base = 10.0
    if feats.has_reporting:
        base += 50.0
    if feats.has_kpi:
        base += 20.0
    base += feats.kpi_density * 20.0
    return max(0.0, min(100.0, base))


def _score_verification(feats: TextFeatures) -> float:
    base = 10.0
    if feats.has_verification:
        base += 60.0
    if feats.has_reporting:
        base += 10.0
    return max(0.0, min(100.0, base))


def score_transparency(
    text: str, *, precomputed_features: Optional[TextFeatures] = None
) -> TransparencyComponents:
    feats = precomputed_features or extract_text_features(text)

    uop = _score_use_of_proceeds(feats)
    rep = _score_reporting(feats)
    ver = _score_verification(feats)

    return TransparencyComponents(
        use_of_proceeds_clarity=round(uop, 1),
        reporting_practices=round(rep, 1),
        verification_strength=round(ver, 1),
        raw_features=feats,
    )
