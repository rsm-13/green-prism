import React from "react";

// analyzer form: UI for pasting disclosure text and running transparency/impact analysis

export default function Analyzer({
    text,
    setText,
    claimed,
    setClaimed,
    mode,
    setMode,
    handleAnalyze,
    loading,
    analysis,
    theme,
    cardBorder,
    cardBg,
    textColor,
}) {
    return (
        <div>
            <h2>ANALYZE DISCLOSURE TEXT</h2>
            {/* main input area for disclosure text */}
            <textarea
                style={{
                    width: "100%",
                    minHeight: 160,
                    padding: "0.5rem",
                    borderRadius: 8,
                    border: `1px solid ${cardBorder}`,
                    backgroundColor: theme === "dark" ? "#020617" : "#ffffff",
                    color: textColor,
                }}
                placeholder="Paste disclosure text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
            />

        {/* controls row: mode selector, optional claimed input, and run button */}
        <div
            style={{
            marginTop: "0.5rem",
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
            flexWrap: "wrap",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <small style={{ marginRight: 8, color: "#6b7280" }}>Mode:</small>
            {[ ["rule","Rule"], ["ml","ML"], ["blend","Blend"] ].map(([m,label]) => (
                <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                    padding: "0.25rem 0.6rem",
                    borderRadius: 999,
                    border: mode === m ? "1px solid #2962FF" : `1px solid ${cardBorder}`,
                    backgroundColor: mode === m ? "#e3f2fd" : theme === "dark" ? "#020617" : "#ffffff",
                    color: mode === m ? "#000" : textColor,
                    cursor: "pointer",
                    fontSize: 12,
                }}
                >
                {label}
                </button>
            ))}
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 1 auto" }}>
            {/* optional claimed impact input used to compare against predicted impact */}
            Claimed CO₂ avoided (tons):{" "}
            <input
                type="number"
                value={claimed}
                onChange={(e) => setClaimed(e.target.value)}
                style={{
                width: 160,
                borderRadius: 6,
                border: `1px solid ${cardBorder}`,
                padding: "0.25rem",
                backgroundColor: theme === "dark" ? "#020617" : "#ffffff",
                color: textColor,
                }}
            />
            </label>

            {/* run analysis button: calls `handleAnalyze` and shows loading state */}
            <button
                onClick={handleAnalyze}
                disabled={loading || !text}
                style={{
                    padding: "0.5rem 1.1rem",
                    borderRadius: 999,
                    border: "none",
                    backgroundColor: "#2962FF",
                    color: "#ffffff",
                    cursor: loading || !text ? "not-allowed" : "pointer",
                    opacity: loading || !text ? 0.6 : 1,
                    marginLeft: "auto",
                }}
                >
                {loading ? "Analyzing..." : "Run Analysis"}
            </button>
        </div>

        {analysis && (
            <div
            style={{
                marginTop: "1rem",
                padding: "1rem",
                borderRadius: 8,
                border: `1px solid ${cardBorder}`,
                backgroundColor: cardBg,
            }}
            >
            <h3>Analysis Results</h3>
            <p>
                <strong>Mode used:</strong> {analysis.mode || "rule"}
                <br />
                <strong>Transparency score:</strong> {typeof analysis.transparency_score === 'number' ? analysis.transparency_score.toFixed(2) : analysis.transparency_score}
                <br />
                <strong>Rule-based score:</strong> {analysis.rule_based_score != null && typeof analysis.rule_based_score === 'number' ? analysis.rule_based_score.toFixed(2) : (analysis.rule_based_score ?? "—")}
                {analysis.ml_score != null && (
                <>
                    <br />
                    <strong>ML score:</strong> {typeof analysis.ml_score === 'number' ? analysis.ml_score.toFixed(2) : analysis.ml_score}
                </>
                )}
                <br />
                <strong>Risk:</strong> {analysis.greenwashing_risk}
            </p>

            {analysis.impact_prediction && (
                <p>
                <strong>Impact:</strong> Claims {typeof analysis.impact_prediction.claimed === 'number' ? analysis.impact_prediction.claimed.toFixed(2) : analysis.impact_prediction.claimed} → Predicted {typeof analysis.impact_prediction.predicted === 'number' ? analysis.impact_prediction.predicted.toFixed(2) : analysis.impact_prediction.predicted}
                {analysis.impact_prediction.uncertainty != null && (
                    <> {" "}± {typeof analysis.impact_prediction.uncertainty === 'number' ? analysis.impact_prediction.uncertainty.toFixed(2) : analysis.impact_prediction.uncertainty}</>
                )}
                </p>
            )}

            <h4>Why?</h4>
            <ul>
                {analysis.explanations.map((ex, i) => (
                <li key={i}>{ex}</li>
                ))}
            </ul>
            </div>
        )}
    </div>
);
}
