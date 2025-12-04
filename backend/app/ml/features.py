from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Dict

# text feature extraction utils (keyword counts, simple density scores)


@dataclass
class TextFeatures:
    length_chars: int
    length_words: int
    num_numbers: int
    has_use_of_proceeds: bool
    has_reporting: bool
    has_verification: bool
    has_kpi: bool
    environmental_focus_score: float
    kpi_density: float


USE_OF_PROCEEDS_KEYWORDS = [
    "use of proceeds",
    "use-of-proceeds",
    "allocated to",
    "allocation of proceeds",
    "proceeds will be used",
]

REPORTING_KEYWORDS = [
    "annual report",
    "annual reporting",
    "impact report",
    "reporting",
    "disclosure",
    "monitoring",
]

VERIFICATION_KEYWORDS = [
    "second party opinion",
    "second-party opinion",
    "external review",
    "third party verification",
    "third-party verification",
    "assurance",
    "spo by",
    "cicero",
    "sustainalytics",
    "vigeo",
]

KPI_KEYWORDS = [
    "kpi",
    "key performance indicator",
    "metric",
    "indicator",
    "target",
    "baseline",
]

ENVIRONMENTAL_KEYWORDS = [
    "co2",
    "carbon",
    "emissions",
    "greenhouse gas",
    "ghg",
    "renewable",
    "solar",
    "wind",
    "geothermal",
    "hydro",
    "energy efficiency",
    "energy-efficient",
    "electric vehicle",
    "ev charging",
    "biodiversity",
    "climate",
    "resilience",
]


def _count_occurrences(text: str, keywords: list[str]) -> int:
    text_l = text.lower()
    return sum(text_l.count(kw.lower()) for kw in keywords)


def extract_text_features(text: str) -> TextFeatures:
    """
    very simple feature extraction. this is intentionally lightweight,
    so later you can replace/augment with embeddings, bert outputs, etc.
    """
    if not text:
        text = ""

    # basic size metrics
    length_chars = len(text)
    words = re.findall(r"\w+", text)
    length_words = len(words)

    # numbers ~ potential quantitative KPIs or impact claims
    num_numbers = len(re.findall(r"\d+(?:\.\d+)?", text))

    # keyword hits for various categories
    use_of_proceeds_hits = _count_occurrences(text, USE_OF_PROCEEDS_KEYWORDS)
    reporting_hits = _count_occurrences(text, REPORTING_KEYWORDS)
    verification_hits = _count_occurrences(text, VERIFICATION_KEYWORDS)
    kpi_hits = _count_occurrences(text, KPI_KEYWORDS)
    env_hits = _count_occurrences(text, ENVIRONMENTAL_KEYWORDS)

    # crude scores: normalize by log(length) to avoid bias for very long text
    length_norm = max(1.0, (length_words ** 0.5))

    environmental_focus_score = min(1.0, env_hits / length_norm)
    kpi_density = min(1.0, kpi_hits / length_norm)

    return TextFeatures(
        length_chars=length_chars,
        length_words=length_words,
        num_numbers=num_numbers,
        has_use_of_proceeds=use_of_proceeds_hits > 0,
        has_reporting=reporting_hits > 0,
        has_verification=verification_hits > 0,
        has_kpi=kpi_hits > 0,
        environmental_focus_score=environmental_focus_score,
        kpi_density=kpi_density,
    )