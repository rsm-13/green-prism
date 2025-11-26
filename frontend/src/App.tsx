import { useEffect, useState } from "react";
import { analyzeText, fetchBonds, fetchBondDetail } from "./api";

interface Bond {
  bond_id: string;
  issuer_name: string;
  currency: string;
  use_of_proceeds: string;
  claimed_impact_co2_tons?: number;
}

function App() {
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [selectedBondId, setSelectedBondId] = useState<string | null>(null);
  const [bondDetail, setBondDetail] = useState<any | null>(null);

  const [text, setText] = useState("");
  const [claimed, setClaimed] = useState<string>("");
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

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

  async function handleAnalyze() {
    setLoading(true);
    setAnalysis(null);
    try {
      const payload: any = { text };
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
        Green bond transparency &amp; impact predictor. Select a sample bond or paste disclosure text to see dummy scores.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
          marginTop: "1.5rem",
        }}
      >
        {/* Left column: sample bonds */}
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

          {bondDetail && (
            <div
              style={{
                marginTop: "1rem",
                padding: "1rem",
                borderRadius: 8,
                border: "1px solid #ddd",
              }}
            >
              <h3>Bond Detail</h3>
              <p>
                <strong>Issuer:</strong> {bondDetail.bond.issuer_name}
                <br />
                <strong>Use of proceeds:</strong>{" "}
                {bondDetail.bond.use_of_proceeds}
              </p>
              <p>
                <strong>Transparency score:</strong>{" "}
                {bondDetail.scores.transparency_score}
                <br />
                <strong>Greenwashing risk:</strong>{" "}
                {bondDetail.scores.greenwashing_risk}
              </p>
              <p>
                <strong>Impact (dummy):</strong>{" "}
                {bondDetail.scores.impact_prediction.claimed
                  ? `Claims ${
                      bondDetail.scores.impact_prediction.claimed
                    } tons CO₂, model predicts ${
                      bondDetail.scores.impact_prediction.predicted
                    } ± ${
                      bondDetail.scores.impact_prediction.uncertainty
                    }`
                  : "No claimed impact provided"}
              </p>
            </div>
          )}
        </div>

        {/* Right column: text analysis */}
        <div>
          <h2>Analyze Disclosure Text</h2>
          <textarea
            style={{ width: "100%", minHeight: 160, padding: "0.5rem" }}
            placeholder="Paste bond framework or disclosure text here..."
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

          {analysis && (
            <div
              style={{
                marginTop: "1rem",
                padding: "1rem",
                borderRadius: 8,
                border: "1px solid #ddd",
              }}
            >
              <h3>Results (Dummy Scores)</h3>
              <p>
                <strong>Transparency score:</strong>{" "}
                {analysis.transparency_score}
                <br />
                <strong>Greenwashing risk:</strong>{" "}
                {analysis.greenwashing_risk}
              </p>
              {analysis.impact_prediction && (
                <p>
                  <strong>Impact prediction:</strong>{" "}
                  {analysis.impact_prediction.claimed
                    ? `Claims ${
                        analysis.impact_prediction.claimed
                      } tons CO₂, predicts ${
                        analysis.impact_prediction.predicted
                      } ± ${
                        analysis.impact_prediction.uncertainty
                      }`
                    : "No claimed impact provided"}
                </p>
              )}
              <h4>Explanations</h4>
              <ul>
                {analysis.explanations.map((ex: string, i: number) => (
                  <li key={i}>{ex}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
