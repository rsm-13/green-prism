import React from "react";

export default function BondsPanel({
    filteredBonds,
    bondFilter,
    setBondFilter,
    selectedBondId,
    setSelectedBondId,
    bondDetail,
    theme,
    cardBorder,
    cardBg,
    textColor,
    impactMode,
    setImpactMode,
    chooseImpact,
}) {
    return (
    <div>
        <h2>BONDS</h2>
        <div style={{ marginBottom: "0.5rem" }}>
        <label style={{ display: "block", marginBottom: 6 }}>
            <small>Search bonds (issuer, bond id, ISIN):</small>
        </label>
        <input
            type="search"
            placeholder="Type to filter bonds..."
            value={bondFilter || ""}
            onChange={(e) => setBondFilter(e.target.value)}
            style={{
            width: "100%",
            padding: "0.5rem",
            borderRadius: 6,
            border: `1px solid ${cardBorder}`,
            marginBottom: "0.5rem",
            backgroundColor: theme === "dark" ? "#020617" : "#fff",
            color: textColor,
            }}
        />

        <div style={{ marginBottom: 6, fontSize: 12, color: "#6b7280" }}>
            Showing {Math.min(filteredBonds.length, 200)} of {filteredBonds.length} matching bonds
            {filteredBonds.length > 200 ? " (showing first 200)" : ""}
        </div>

        <div
            role="listbox"
            aria-label="Bond search results"
            style={{
            width: "100%",
            border: `1px solid ${cardBorder}`,
            borderRadius: 6,
            overflow: "hidden",
            backgroundColor: cardBg,
            color: textColor,
            }}
        >
            <div
            style={{
                display: "flex",
                gap: 12,
                padding: "0.5rem",
                borderBottom: `1px solid ${cardBorder}`,
                fontSize: 12,
                color: "#6b7280",
            }}
            >
            <div style={{ flex: 3 }}>Issuer</div>
            <div style={{ flex: 1 }}>Currency</div>
            <div style={{ flex: 1 }}>Years</div>
            <div style={{ flex: 2 }}>Amount</div>
            </div>

            <div style={{ maxHeight: 300, overflow: "auto" }}>
            {filteredBonds.slice(0, 200).map((b) => {
                const isSelected = selectedBondId === b.bond_id;
                return (
                <div
                    key={b.bond_id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => setSelectedBondId(b.bond_id)}
                    style={{
                    display: "flex",
                    gap: 12,
                    padding: "0.5rem",
                    cursor: "pointer",
                    alignItems: "center",
                    backgroundColor: isSelected
                        ? theme === "dark"
                        ? "#1e293b"
                        : "#eef"
                        : "transparent",
                    borderBottom: `1px solid ${cardBorder}`,
                    }}
                >
                    <div style={{ flex: 3 }}>
                    <div style={{ fontWeight: 600 }}>{b.issuer_name}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{(b.use_of_proceeds || "").slice(0, 80)}{(b.use_of_proceeds||"").length>80?"…":""}</div>
                    </div>
                    <div style={{ flex: 1 }}>{b.currency}</div>
                    <div style={{ flex: 1 }}>
                    {b.issue_year || "?"} → {b.maturity_year || "?"}
                    </div>
                    <div style={{ flex: 2, color: "#374151" }}>
                    {b.amount_issued_usd
                        ? `$${Number(b.amount_issued_usd).toLocaleString()}`
                        : b.amount_issued || "—"}
                    </div>
                </div>
                );
            })}
            </div>
        </div>
        </div>

        {bondDetail && (
        <div
            style={{
            marginTop: "1rem",
            padding: "1rem",
            borderRadius: 8,
            border: `1px solid ${cardBorder}`,
            backgroundColor: cardBg,
            }}
        >
            <h3>{bondDetail.bond.issuer_name}</h3>
            <p>
            <strong>Use of proceeds:</strong> {bondDetail.bond.use_of_proceeds}
            </p>

            <h4>Bond metadata</h4>
            <p style={{ margin: 0 }}>
            <strong>Bond ID:</strong> {bondDetail.bond.bond_id || "—"}
            <br />
            <strong>ISIN:</strong> {bondDetail.bond.isin || "—"}
            <br />
            <strong>Dataset:</strong> {bondDetail.bond.source_dataset || "—"}
            <br />
            <strong>Amount issued:</strong>{" "}
            {bondDetail.bond.amount_issued_usd
                ? `$${Number(bondDetail.bond.amount_issued_usd).toLocaleString()}`
                : bondDetail.bond.amount_issued || "—"}
            <br />
            <strong>Issue → Maturity:</strong>{" "}
            {(bondDetail.bond.issue_year || "?") +
                " → " +
                (bondDetail.bond.maturity_year || "?")}
            </p>

            <p style={{ marginTop: 8 }}>
            <strong>External review:</strong> {bondDetail.bond.external_review_type || "None"}
            <br />
            <strong>Certification:</strong> {bondDetail.bond.certification || "None"}
            </p>

            <h4 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Impact</span>
            <span style={{ fontSize: 12 }}>
                Mode: {" "}
                    {(() => {
                        const inactiveBg = theme === "dark" ? "#0b1120" : "#f9fafb";
                        const activeBg = theme === "dark" ? "#f3f4f6" : "#e3f2fd";
                        return (
                            <>
                            <button
                                type="button"
                                onClick={() => setImpactMode("rule")}
                                style={{
                                    marginRight: 4,
                                    padding: "2px 6px",
                                    borderRadius: 999,
                                    border: impactMode === "rule" ? "1px solid #2962FF" : `1px solid ${cardBorder}`,
                                    background: impactMode === "rule" ? activeBg : inactiveBg,
                                    color: impactMode === "rule" ? "#000" : textColor,
                                    fontSize: 11,
                                    cursor: "pointer",
                                }}
                            >
                            Rule
                            </button>
                            <button
                                type="button"
                                onClick={() => setImpactMode("ml")}
                                style={{
                                    padding: "2px 6px",
                                    borderRadius: 999,
                                    border: impactMode === "ml" ? "1px solid #2962FF" : `1px solid ${cardBorder}`,
                                    background: impactMode === "ml" ? activeBg : inactiveBg,
                                    color: impactMode === "ml" ? "#000" : textColor,
                                    fontSize: 11,
                                    cursor: "pointer",
                                }}
                            >
                            ML
                            </button>
                            </>
                        );
                    })()}
            </span>
            </h4>

            {(() => {
            const rule = bondDetail.scores.impact_prediction;
            const ml = bondDetail.scores.impact_prediction_ml;
            const impact = chooseImpact(rule, ml);
            if (!impact) {
                return <p>No impact prediction available.</p>;
            }
            return (
                <p>
                {impact.claimed != null && (
                    <>
                    Claims {typeof impact.claimed === 'number' ? impact.claimed.toFixed(2) : impact.claimed} tons CO₂ <br />
                    </>
                )}
                Predicted {typeof impact.predicted === 'number' ? impact.predicted.toFixed(2) : impact.predicted} tons CO₂/year
                {impact.uncertainty != null && (
                    <>
                    {" "}± {typeof impact.uncertainty === 'number' ? impact.uncertainty.toFixed(2) : impact.uncertainty}
                    </>
                )}
                {(impact.source === "ml" || impact.source === "ml_fallback") && (
                    <span style={{ fontSize: 11, color: "#6b7280", display: "block" }}>
                    (ML intensity model)
                    </span>
                )}
                </p>
            );
            })()}

            <h4>Transparency Score</h4>
            <p>
            {bondDetail.scores.transparency_score} / 100
            <br />
            <strong>Greenwashing risk:</strong> {bondDetail.scores.greenwashing_risk}
            </p>

            <h4>Impact</h4>
            {bondDetail.scores.impact_prediction ? (
            <p>
                Claims {bondDetail.scores.impact_prediction.claimed} tons CO₂ → Predicted {bondDetail.scores.impact_prediction.predicted} tons
            </p>
            ) : (
            <p>No claimed impact data.</p>
            )}
        </div>
        )}
    </div>
    );
}
