"""
Impact realization gap model.
Predicts actual vs claimed impact.
"""


def predict_impact_gap(
    claimed_impact_co2_tons: float | None,
    amount_issued_usd: float | None = None,
    project_category: str | None = None,
) -> dict:
    """
    Rule-based prediction implementation with a simple fallback.

    If `claimed_impact_co2_tons` is provided, return a basic realization
    prediction (a fraction of the claim). If no claim is provided but
    `amount_issued_usd` is available, estimate impact using a rule-of-thumb
    intensity (tons CO2 per $1M). Otherwise return all None.
    """

    # Prefer an amount-based estimate when an issuance amount is available.
    # This uses a simple intensity heuristic (tCO2 per $1M) and is the
    # rule-of-thumb the UI should surface when the user selects Rule mode.
    if amount_issued_usd is not None and amount_issued_usd > 0:
        amount_musd = float(amount_issued_usd) / 1_000_000.0
        # Default intensity (tCO2 per $1M) — placeholder that can be tuned later
        default_intensity_tco2_per_musd = 5.0
        predicted = default_intensity_tco2_per_musd * amount_musd
        # If a claimed value exists, keep it for display; gap can be computed
        # as claimed - predicted (useful information), otherwise gap is None.
        claimed = float(claimed_impact_co2_tons) if claimed_impact_co2_tons is not None else None
        gap = (claimed - predicted) if claimed is not None else None
        return {
            "claimed": claimed,
            "predicted": predicted,
            "uncertainty": max(0.1 * predicted, 1.0),
            "gap": gap,
        }

    # If no amount is available, fall back to using the claim (if present)
    # and compute a conservative realized fraction.
    if claimed_impact_co2_tons is not None:
        claimed = float(claimed_impact_co2_tons)
        predicted = 0.65 * claimed
        gap = claimed - predicted
        return {
            "claimed": claimed,
            "predicted": predicted,
            "uncertainty": 0.15 * claimed,
            "gap": gap,
        }

    # Nothing to estimate
    return {"claimed": None, "predicted": None, "uncertainty": None, "gap": None}
