"""
Impact realization gap model.
Predicts actual vs claimed impact.
"""


def predict_impact_gap(claimed_impact_co2_tons: float | None) -> dict:
    """
    Placeholder implementation.
    Replace with trained regression model later.
    """
    if claimed_impact_co2_tons is None:
        return {"claimed": None, "predicted": None, "uncertainty": None, "gap": None}

    claimed = float(claimed_impact_co2_tons)
    predicted = 0.65 * claimed
    gap = claimed - predicted
    return {
        "claimed": claimed,
        "predicted": predicted,
        "uncertainty": 0.15 * claimed,
        "gap": gap,
    }
