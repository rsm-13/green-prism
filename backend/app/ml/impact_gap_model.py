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

    # prefer an amount-based estimate when an issuance amount is available
    # use a simple intensity heuristic (tCO2 per $1M) as a rule-of-thumb
    if amount_issued_usd is not None and amount_issued_usd > 0:
        # convert amount in USD to $million units for intensity multiplication
        amount_musd = float(amount_issued_usd) / 1_000_000.0
        # default intensity (tCO2 per $1M) — tunable placeholder
        default_intensity_tco2_per_musd = 5.0
        # predicted total tons = intensity * amount (in $1M)
        predicted = default_intensity_tco2_per_musd * amount_musd
        # if a claim exists, keep it and compute gap = claimed - predicted
        claimed = (
            float(claimed_impact_co2_tons)
            if claimed_impact_co2_tons is not None
            else None
        )
        gap = (claimed - predicted) if claimed is not None else None
        # uncertainty: simple floor of 1.0 or 10% of predicted
        return {
            "claimed": claimed,
            "predicted": predicted,
            "uncertainty": max(0.1 * predicted, 1.0),
            "gap": gap,
        }

    # fallback: if only a claimed value is present, estimate realized fraction
    if claimed_impact_co2_tons is not None:
        claimed = float(claimed_impact_co2_tons)
        # assume conservative realized fraction ~65% (placeholder)
        predicted = 0.65 * claimed
        gap = claimed - predicted
        # uncertainty as 15% of the claimed amount
        return {
            "claimed": claimed,
            "predicted": predicted,
            "uncertainty": 0.15 * claimed,
            "gap": gap,
        }

    # Nothing to estimate
    return {"claimed": None, "predicted": None, "uncertainty": None, "gap": None}
