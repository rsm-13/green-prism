# backend/app/ml/transparency_model_ml.py
# ml transparency regressor wrapper: lazy-load artifact + encoder
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import List, Optional

import numpy as np
import torch
from joblib import load
from transformers import AutoTokenizer, AutoModel

from app.ml.preprocessing import clean_text

# ---- Paths ----
BACKEND_ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = BACKEND_ROOT / "app" / "models" / "transparency_regressor_from_txt.joblib"

# same patterns as in the notebook
import re

PATTERNS = {
    "has_third_party_review": [
        r"second[- ]party opinion",
        r"external review",
        r"third[- ]party verification",
        r"assurance",
        r"spo by",
        r"sustainalytics",
        r"cicero",
        r"vigeo",
    ],
    "has_reporting_annual": [
        r"annual report",
        r"annual reporting",
    ],
    "has_reporting_semi_annual": [
        r"semi[- ]annual",
        r"semiannual",
    ],
    "has_kpi_co2": [
        r"\\bco2\\b",
        r"carbon emissions",
        r"greenhouse gas",
        r"\\bghg\\b",
    ],
    "has_kpi_energy": [
        r"mwh",
        r"kwh",
        r"kw\\b",
        r"energy efficiency",
        r"renewable energy",
    ],
}


def handcrafted_features(text: str) -> np.ndarray:
    t = text.lower()
    feats = []

    for patterns in PATTERNS.values():
        flag = any(re.search(p, t) for p in patterns)
        feats.append(1.0 if flag else 0.0)

    num_numbers = len(re.findall(r"\\d+(?:\\.\\d+)?", t))
    feats.append(float(num_numbers))

    return np.array(feats, dtype=np.float32)


def clamp_0_100(val: float) -> float:
    return float(max(0.0, min(100.0, val)))


# ---- Lazy-load model + encoder ----

@lru_cache(maxsize=1)
def _load_artifact() -> Optional[dict]:
    if not MODEL_PATH.exists():
        print(f"[transparency_model_ml] WARNING: model file not found at {MODEL_PATH}")
        return None

    artifact = load(MODEL_PATH)
    return artifact


@lru_cache(maxsize=1)
def _load_encoder():
    artifact = _load_artifact()
    if artifact is None:
        return None, None

    model_name = artifact.get("base_nlp_model_name", "ProsusAI/finbert")
    device = "cuda" if torch.cuda.is_available() else "cpu"

    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModel.from_pretrained(model_name)
    model.to(device)
    model.eval()

    return tokenizer, model


def ml_model_available() -> bool:
    return _load_artifact() is not None


@torch.no_grad()
def _embed_texts(texts: List[str]) -> np.ndarray:
    tokenizer, model = _load_encoder()
    if tokenizer is None or model is None:
        raise RuntimeError("ML transparency encoder not available")

    device = next(model.parameters()).device
    all_embs = []

    # embed texts in small batches to avoid OOM on GPU/CPU
    for i in range(0, len(texts), 4):
        batch = texts[i : i + 4]
        enc = tokenizer(
            batch,
            padding=True,
            truncation=True,
            max_length=256,
            return_tensors="pt",
        )
        # move tensors to encoder device
        enc = {k: v.to(device) for k, v in enc.items()}
        outputs = model(**enc)
        # use CLS token embedding as sentence representation
        cls_emb = outputs.last_hidden_state[:, 0, :]
        all_embs.append(cls_emb.cpu().numpy())

    return np.vstack(all_embs)


def predict_transparency_score_ml(text: str) -> Optional[float]:
    """
    Returns an ML transparency score in [0, 100], or None if the model
    is not available.
    """
    artifact = _load_artifact()
    if artifact is None:
        return None

    cleaned = clean_text(text)
    emb = _embed_texts([cleaned])                             # (1, hidden)
    hand = np.stack([handcrafted_features(cleaned)], axis=0)  # (1, H)
    feats = np.concatenate([emb, hand], axis=1)               # (1, D)

    model = artifact["model"]
    score = model.predict(feats)[0]
    return clamp_0_100(score)
