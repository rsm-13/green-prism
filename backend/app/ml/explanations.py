"""
Map model outputs to human-readable explanations for the UI.
"""

from typing import List
from .transparency_model import TransparencyComponents


def build_explanations(
    text: str,
    components: TransparencyComponents,
    impact_result: dict,
) -> List[str]:
    # TODO: refine explanations later
    explanations: List[str] = []
    explanations.append("Placeholder explanation about transparency.")
    explanations.append("Placeholder explanation about impact vs claims.")
    return explanations
