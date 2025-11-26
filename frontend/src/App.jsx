import React, { useEffect, useState } from "react";
import { analyzeText, fetchBonds, fetchBondDetail } from "./api";
import Chart from "./components/Chart";

export default function App() {
  const [bonds, setBonds] = useState([]);
  const [selectedBondId, setSelectedBondId] = useState(null);
  const [bondDetail, setBondDetail] = useState(null);

  const [text, setText] = useState("");
  const [claimed, setClaimed] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const [prices, setPrices] = useState([]);

  // Load sample bonds on mount
  useEffect(() => {
    fetchBonds()
      .then(setBonds)
      .catch(console.error);
  }, []);

  // Load bond detail when a bond is selected
  useEffect(() => {
    if (!selectedBondId) return;
    setBondDetail(null);
    fetchBondDetail(selectedBondId)
      .then(setBondDetail)
      .catch(console.error);
  }, [selectedBondId]);

  // Load market prices once on mount
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/market/grnb")
      .then((res) => res.json())
      .then((data) => {
        console.log("Market prices:", data);
        setPrices(data || []);
      })
      .catch((err) => {
        console.error("Market API error:", err);
        setPrices([]);
      });
  }, []);

  async function handleAnalyze() {
    setLoading(true);
    setAnalysis(null);
    try {
      const payload = { text };
      if (claimed) {
        payload.claimed_impact_co2_tons = parseFloat(claimed);
      }
      const res = await analyzeText(payload);
      setAnalysis(res);
    } catch (err) {
      console.error(err);
      alert("Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        padding: "1.5rem",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      <h1>Green Prism MVP</h1>
      <p style={{ maxWidth: 700 }}>
        Green bond transparency &amp; impact predictor — select a sample bond or
        paste disclosure text to analyze it. Below, see how the green bond
        market proxy (GRNB ETF) has been performing.
      </p>

      {/* ---------- TOP GRID: BONDS + ANALYZER ---------- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
          marginTop: "1.5rem",
        }}
      >
        {/* LEFT SIDE — Sample Bonds */}
        <div>
          <h2>Sample Bonds</h2>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {bonds.map((b) => (
              <li
                key={b.bond_id}
                style={{
                  padding: "0.75rem",
                  marginBottom: "0.5rem",
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  cursor: "pointer",
                  backgroundColor:
                    selectedBondId === b.bond_id ? "#eef" : "#fff",
                }}
                onClick={() => setSelectedBondId(b.bond_id)}
              >
                <strong>{b.issuer_name}</strong> ({b.currency})<br />
                <small>{b.use_of_proceeds}</small>
              </li>
            ))}
          </ul>

          {/* Bond Details */}
          {bondDetail && (
            <div
              style={{
                marginTop: "1rem",
                padding: "1rem",
                borderRadius: 8,
                border: "1px solid #ddd",
              }}
            >
              <h3>{bondDetail.bond.issuer_name}</h3>
              <p>
                <strong>Use of proceeds:</strong>{" "}
                {bondDetail.bond.use_of_proceeds}
              </p>

              <h4>Transparency Score</h4>
              <p>
                {bondDetail.scores.transparency_score} / 100
                <br />
                <strong>Greenwashing risk:</strong>{" "}
                {bondDetail.scores.greenwashing_risk}
              </p>

              <h4>Impact</h4>
              {bondDetail.scores.impact_prediction ? (
                <p>
                  Claims {bondDetail.scores.impact_prediction.claimed} tons CO₂
                  → Predicted {bondDetail.scores.impact_prediction.predicted}{" "}
                  tons
                </p>
              ) : (
                <p>No claimed impact data.</p>
              )}
            </div>
          )}
        </div>

        {/* RIGHT SIDE — Text Input / Analyze */}
        <div>
          <h2>Analyze Disclosure Text</h2>
          <textarea
            style={{ width: "100%", minHeight: 160, padding: "0.5rem" }}
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
            <label>
              Claimed CO₂ avoided (tons):{" "}
              <input
                type="number"
                value={claimed}
                onChange={(e) => setClaimed(e.target.value)}
                style={{ width: 160 }}
              />
            </label>

            <button onClick={handleAnalyze} disabled={loading || !text}>
              {loading ? "Analyzing..." : "Run Analysis"}
            </button>
          </div>

          {/* Analysis Results */}
          {analysis && (
            <div
              style={{
                marginTop: "1rem",
                padding: "1rem",
                borderRadius: 8,
                border: "1px solid #ddd",
              }}
            >
              <h3>Analysis Results</h3>
              <p>
                <strong>Transparency score:</strong>{" "}
                {analysis.transparency_score}
                <br />
                <strong>Risk:</strong> {analysis.greenwashing_risk}
              </p>

              {analysis.impact_prediction && (
                <p>
                  <strong>Impact:</strong>{" "}
                  Claims {analysis.impact_prediction.claimed} → Predicted{" "}
                  {analysis.impact_prediction.predicted}
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
      </div>

      {/* ---------- BOTTOM SECTION: MARKET CHART ---------- */}
      <section style={{ marginTop: "2.5rem" }}>
        <h2>Green Bond Market Proxy (GRNB ETF)</h2>
        <p style={{ maxWidth: 700 }}>
          GRNB is a green bond ETF used as a proxy for the overall green bond
          market. This chart shows its recent price history.
        </p>

        {prices.length > 0 ? (
          <div style={{ marginTop: "1rem" }}>
            <Chart data={prices} height={420} />
          </div>
        ) : (
          <p style={{ marginTop: "1rem" }}>
            Market data is not available yet (or failed to load).
          </p>
        )}
      </section>
    </div>
  );
}
