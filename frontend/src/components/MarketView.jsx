import React from "react";
import Chart from "./Chart";

export default function MarketView({
    ETF_OPTIONS,
    RANGE_LABELS,
    selectedEtf,
    setSelectedEtf,
    selectedRange,
    setSelectedRange,
    prices,
    periodReturn,
    annualizedReturn,
    yieldInfo,
    theme,
    cardBorder,
    textColor,
}) {
    return (
        <section style={{ marginTop: "2.5rem" }}>
            <h2>Green Bond ETFs – Market View</h2>

            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                    marginTop: "0.75rem",
                    marginBottom: "0.75rem",
                    alignItems: "center",
                }}
            >
            <div>
                <strong>ETF:</strong>{" "}
                {ETF_OPTIONS.map((etf) => (
                <button
                    key={etf.id}
                    onClick={() => setSelectedEtf(etf.id)}
                    style={{
                        marginLeft: "0.5rem",
                        padding: "0.25rem 0.6rem",
                        borderRadius: 999,
                        border:
                        selectedEtf === etf.id
                            ? "1px solid #2962FF"
                            : `1px solid ${cardBorder}`,
                        backgroundColor:
                            selectedEtf === etf.id
                                ? "#e3f2fd"
                                : theme === "dark"
                                ? "#020617"
                                : "#ffffff",
                        color: selectedEtf === etf.id ? "#000" : textColor,
                        cursor: "pointer",
                        fontSize: 12,
                    }}
                >
                {etf.label}
                </button>
        ))}
        </div>

        <div>
            <strong>Range:</strong>{" "}
            {RANGE_LABELS.map((label) => (
                <button
                    key={label}
                    onClick={() => setSelectedRange(label)}
                    style={{
                        marginLeft: "0.5rem",
                        padding: "0.25rem 0.6rem",
                        borderRadius: 999,
                        border:
                        selectedRange === label
                            ? "1px solid #2962FF"
                            : `1px solid ${cardBorder}`,
                        backgroundColor:
                            selectedRange === label
                                ? "#e3f2fd"
                                : theme === "dark"
                                ? "#020617"
                                : "#ffffff",
                        color: selectedRange === label ? "#000" : textColor,
                        cursor: "pointer",
                        fontSize: 12,
                    }}
                >
                    {label}
                </button>
            ))}
        </div>
    </div>

    <div style={{ marginBottom: "1rem" }}>
    {periodReturn !== null && (
        <p style={{ margin: 0 }}>
        <strong>Price return ({selectedRange}):</strong> {periodReturn.toFixed(2)}%
        </p>
    )}
    {annualizedReturn !== null && (
        <p style={{ margin: 0 }}>
        <strong>Annualized return (price-only proxy):</strong> {annualizedReturn.toFixed(2)}%
        </p>
    )}
    {periodReturn === null && (
        <p style={{ margin: 0 }}>Not enough data yet for return calculations.</p>
    )}

    {yieldInfo && (
        <>
        {yieldInfo.price != null && (
            <p style={{ margin: 0 }}>
            <strong>Latest price:</strong> {yieldInfo.price.toFixed(2)} (as of {yieldInfo.date})
            </p>
        )}
        {yieldInfo.yield_to_maturity != null && (
            <p style={{ margin: 0 }}>
            <strong>Yield to maturity:</strong> {yieldInfo.yield_to_maturity.toFixed(2)}%
            </p>
        )}
        {yieldInfo.yield_to_worst != null && (
            <p style={{ margin: 0 }}>
            <strong>Yield to worst:</strong> {yieldInfo.yield_to_worst.toFixed(2)}%
            </p>
        )}
        </>
    )}
    </div>

    {prices.length > 0 ? (
    <div style={{ marginTop: "1rem" }}>
        <Chart data={prices} height={420} theme={theme} />
    </div>
    ) : (
    <p style={{ marginTop: "1rem" }}>Market data is not available yet (or failed to load).</p>
    )}
</section>
);
}
