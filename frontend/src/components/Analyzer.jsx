import React from "react";

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
      <h2>Analyze Disclosure Text</h2>
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

        <label>
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

        <button
          onClick={handleAnalyze}
          disabled={loading || !text}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: 999,
            border: "none",
            backgroundColor: "#2962FF",
            color: "#ffffff",
            cursor: loading || !text ? "not-allowed" : "pointer",
            opacity: loading || !text ? 0.6 : 1,
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
            <strong>Transparency score:</strong> {analysis.transparency_score}
            <br />
            <strong>Rule-based score:</strong> {analysis.rule_based_score ?? "—"}
            {analysis.ml_score != null && (
              <>
                <br />
                <strong>ML score:</strong> {analysis.ml_score}
              </>
            )}
            <br />
            <strong>Risk:</strong> {analysis.greenwashing_risk}
          </p>

          {analysis.impact_prediction && (
            <p>
              <strong>Impact:</strong> Claims {analysis.impact_prediction.claimed} → Predicted {analysis.impact_prediction.predicted}
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
