"""
Transparency score model interface.
Later: use embeddings + ML regressor/classifier.
"""

from dataclasses import dataclass


@dataclass
class TransparencyComponents:
    use_of_proceeds_clarity: float
    reporting_practices: float
    verification_strength: float

    @property
    def overall(self) -> float:
        return (
            0.4 * self.use_of_proceeds_clarity
            + 0.3 * self.reporting_practices
            + 0.3 * self.verification_strength
        )


def score_transparency(text: str) -> TransparencyComponents:
    """
    Placeholder scoring function.
    Replace with real NLP + ML later.
    """
    # TODO: implement model logic
    return TransparencyComponents(
        use_of_proceeds_clarity=50.0,
        reporting_practices=50.0,
        verification_strength=50.0,
    )
