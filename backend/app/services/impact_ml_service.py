# backend/app/services/impact_ml_service.py
# ml-backed impact estimator: load artifact + encoder, predict intensity
from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Optional

import numpy as np
from joblib import load
from sentence_transformers import SentenceTransformer

from app.ml.preprocessing import clean_text
# compute BACKEND_ROOT relative to this file (avoid importing missing app.config)
BACKEND_ROOT = Path(__file__).resolve().parents[2]

MODEL_DIR = BACKEND_ROOT / "app" / "models"
MODEL_PATH = MODEL_DIR / "impact_estimator_xgb_minilm.joblib"

_impact_artifact = None
_impact_encoder = None


def _load_artifact():
    global _impact_artifact, _impact_encoder
    if _impact_artifact is None:
        _impact_artifact = load(MODEL_PATH)
        model_name = _impact_artifact["text_model_name"]
        _impact_encoder = SentenceTransformer(model_name)
    return _impact_artifact, _impact_encoder


def _encode_metadata(row: Dict[str, Any], artifact: Dict[str, Any]) -> np.ndarray:
    num_cols = artifact["num_cols"]
    cat_cols = artifact["cat_cols"]
    cat_maps = artifact["cat_maps"]

    feats = []

    # numeric: convert configured numeric cols to floats
    for col in num_cols:
        val = row.get(col, 0.0)
        try:
            v = float(val)
        except Exception:
            v = 0.0
        feats.append(v)

    # categorical as label indices: map category -> label index used by model
    for col in cat_cols:
        mapping = cat_maps[col]
        raw_val = str(row.get(col, "UNKNOWN"))
        idx = mapping.get(raw_val, mapping.get("UNKNOWN", 0))
        feats.append(float(idx))

    return np.array(feats, dtype=np.float32).reshape(1, -1)


def predict_ml_impact_for_bond(
    *, text: str, amount_issued_usd: Optional[float], project_category: Optional[str]
) -> Optional[Dict[str, Any]]:
    """
    run the ml intensity model for a single bond.

    returns dict with:
        - predicted_impact_mean (tons/year)
        - predicted_impact_std  (tons/year)
        - predicted_intensity_tco2_per_musd
    or None if something is missing
    """
    # require amount to convert intensity -> total tons; return None if missing
    if amount_issued_usd is None or amount_issued_usd <= 0:
        # intensity model needs an amount to turn intensity -> total tons
        return None

    artifact, encoder = _load_artifact()

    # clean and embed text using sentence-transformers encoder
    cleaned = clean_text(text)
    emb = encoder.encode([cleaned])
    emb = np.asarray(emb, dtype=np.float32)  # (1, H)

    # build meta row
    # build metadata vector expected by the saved artifact
    meta = {"amount_issued_usd": amount_issued_usd}
    if project_category is not None:
        meta["project_category"] = project_category

    meta_vec = _encode_metadata(meta, artifact)  # (1, M)
    # final feature array = [text_embedding, numeric/categorical meta]
    feats = np.concatenate([emb, meta_vec], axis=1)  # (1, H+M)

    model = artifact["model"]
    pred_log_intensity = float(model.predict(feats)[0])

    # model predicts log1p(intensity); convert back to intensity (tCO2 per $1M)
    pred_intensity = float(np.expm1(pred_log_intensity))  # tCO2 per $1M
    amount_musd = amount_issued_usd / 1_000_000.0
    pred_tons = pred_intensity * amount_musd
    # simple uncertainty heuristic (15% of predicted tons)
    pred_std_tons = float(abs(pred_tons) * 0.15)

    return {
        "predicted_impact_mean": pred_tons,
        "predicted_impact_std": pred_std_tons,
        "predicted_intensity_tco2_per_musd": pred_intensity,
    }
