import React, { useEffect, useState } from "react";
import { analyzeText, fetchBonds, fetchBondDetail } from "./api";
import Chart from "./components/Chart";
import { useTheme } from "./ThemeContext";

// Time range options (label -> days)
const RANGE_LABELS = ["3M", "6M", "1Y", "3Y"];
const RANGE_DAYS = {
  "3M": 90,
  "6M": 180,
  "1Y": 365,
  "3Y": 365 * 3,
};

// ETF options
const ETF_OPTIONS = [
  { id: "SP_GB_INDEX", label: "S&P Green Bond Index" },
  { id: "ISHARES_GB_INDEX_IE", label: "iShares Green Bond Index Fund (IE)" },
];


export default function App() {
  const { theme, toggleTheme } = useTheme();

  const [bonds, setBonds] = useState([]);
  const [selectedBondId, setSelectedBondId] = useState(null);
  const [bondDetail, setBondDetail] = useState(null);

  const [text, setText] = useState("");
  const [claimed, setClaimed] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  // scoring mode: "rule" | "ml" | "blend"
  const [mode, setMode] = useState("rule");

  // market-related state
  const [selectedEtf, setSelectedEtf] = useState("grnb");
  const [selectedRange, setSelectedRange] = useState("1Y");
  const [prices, setPrices] = useState([]);
  const [yieldInfo, setYieldInfo] = useState(null);

  // UI state for searchable bond selection (large CSV)
  const [bondFilter, setBondFilter] = useState("");
  const filteredBonds = React.useMemo(() => {
    if (!bondFilter) return bonds || [];
    const q = bondFilter.toString().toLowerCase();
    return (bonds || []).filter((b) => {
      return (
        (b.issuer_name || "").toString().toLowerCase().includes(q) ||
        (b.bond_id || "").toString().toLowerCase().includes(q) ||
        (b.isin || "").toString().toLowerCase().includes(q)
      );
    });
  }, [bonds, bondFilter]);


  // Load sample bonds on mount
  useEffect(() => {
    // Request a larger limit so the searchable dropdown can find across the
    // full dataset instead of defaulting to 20 rows.
    fetchBonds(5000)
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

  // Load market prices whenever ETF or range changes
  useEffect(() => {
    const days = RANGE_DAYS[selectedRange] || 365;
    fetch(
      `http://127.0.0.1:8000/api/market/${selectedEtf}?days=${encodeURIComponent(
        days
      )}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("Market data", selectedEtf, selectedRange, data);
        setPrices(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Market API error:", err);
        setPrices([]);
      });
  }, [selectedEtf, selectedRange]);

  useEffect(() => {
    const days = RANGE_DAYS[selectedRange] || 365;
    fetch(
      `http://127.0.0.1:8000/api/market/series/${selectedEtf}?days=${encodeURIComponent(
        days
      )}`
    )
      .then((res) => {
        if (!res.ok) throw new Error("summary fetch failed");
        return res.json();
      })
      .then((data) => {
        console.log("Market summary", data);
        setYieldInfo(data.latest || null);
      })
      .catch((err) => {
        console.error("Market summary error:", err);
        setYieldInfo(null);
      });
  }, [selectedEtf, selectedRange]);


  async function handleAnalyze() {
    setLoading(true);
    setAnalysis(null);
    try {
      const payload = { text };
      if (claimed) {
        payload.claimed_impact_co2_tons = parseFloat(claimed);
      }
      // include selected scoring mode
      payload.mode = mode;
      const res = await analyzeText(payload);
      setAnalysis(res);
    } catch (err) {
      console.error(err);
      alert("Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  // Compute simple return metrics from prices
  let periodReturn = null;
  let annualizedReturn = null;
  const daysForRange = RANGE_DAYS[selectedRange] || 365;

  if (prices.length > 1) {
    const first = prices[0].value;
    const last = prices[prices.length - 1].value;
    if (first > 0) {
      const ratio = last / first;
      periodReturn = (ratio - 1) * 100;
      const years = daysForRange / 365;
      if (years > 0) {
        annualizedReturn = (Math.pow(ratio, 1 / years) - 1) * 100;
      }
    }
  }

  const bgColor = theme === "dark" ? "#020617" : "#ffffff";
  const textColor = theme === "dark" ? "#e5e7eb" : "#111827";
  const cardBg = theme === "dark" ? "#0b1120" : "#ffffff";
  const cardBorder = theme === "dark" ? "#1f2937" : "#dddddd";

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        padding: "1.5rem",
        maxWidth: 1200,
        margin: "0 auto",
        minHeight: "100vh",
        backgroundColor: bgColor,
        color: textColor,
        transition: "background-color 0.25s ease, color 0.25s ease",
      }}
    >
      {/* Top bar: title + theme toggle */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <div>
          <h1 style={{ marginBottom: 4 }}>Green Prism MVP</h1>
          <p style={{ maxWidth: 700, marginTop: 0 }}>
            Green bond transparency &amp; impact predictor — select a sample
            bond or paste disclosure text to analyze it. Below, compare green
            bond ETF performance over various time horizons.
          </p>
        </div>
        <button
          onClick={toggleTheme}
          style={{
            padding: "0.4rem 0.8rem",
            borderRadius: 999,
            border: "1px solid #4b5563",
            backgroundColor: theme === "dark" ? "#111827" : "#f9fafb",
            color: textColor,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          {theme === "dark" ? "☀️ Light mode" : "🌙 Dark mode"}
        </button>
      </div>

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
          {/* Search + dropdown for large bond lists */}
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

            {/* Table-like selectable results */}
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
              {/* Header */}
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

              {/* Body (scrollable) */}
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

          {/* Bond Details */}
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
                <strong>Use of proceeds:</strong>{" "}
                {bondDetail.bond.use_of_proceeds}
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
                <strong>External review:</strong>{" "}
                {bondDetail.bond.external_review_type || "None"}
                <br />
                <strong>Certification:</strong>{" "}
                {bondDetail.bond.certification || "None"}
              </p>

              <h4>Impact reported</h4>
              <p style={{ margin: 0 }}>
                <strong>Claimed CO₂ (tons):</strong>{" "}
                {bondDetail.bond.claimed_impact_co2_tons || "—"}
                <br />
                <strong>Actual CO₂ (tons):</strong>{" "}
                {bondDetail.bond.actual_impact_co2_tons || "—"}
                <br />
                <strong>Impact source:</strong>{" "}
                {bondDetail.bond.impact_source || "—"}
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
            {/* Mode toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <small style={{ marginRight: 8, color: "#6b7280" }}>Mode:</small>
              {[["rule","Rule"],["ml","ML"],["blend","Blend"]].map(([m,label]) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    padding: "0.25rem 0.6rem",
                    borderRadius: 999,
                    border: mode === m ? "1px solid #2962FF" : `1px solid ${cardBorder}`,
                    backgroundColor: mode === m ? "#e3f2fd" : theme === "dark" ? "#020617" : "#ffffff",
                    color: textColor,
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

          {/* Analysis Results */}
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
      </div>

      {/* ---------- BOTTOM SECTION: MARKET CHART ---------- */}
      <section style={{ marginTop: "2.5rem" }}>
        <h2>Green Bond ETFs – Market View</h2>

        {/* ETF + Range controls */}
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
                  color: textColor,
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
                  color: textColor,
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div style={{ marginBottom: "1rem" }}>
          {periodReturn !== null && (
            <p style={{ margin: 0 }}>
              <strong>Price return ({selectedRange}):</strong>{" "}
              {periodReturn.toFixed(2)}%
            </p>
          )}
          {annualizedReturn !== null && (
            <p style={{ margin: 0 }}>
              <strong>Annualized return (price-only proxy):</strong>{" "}
              {annualizedReturn.toFixed(2)}%
            </p>
          )}
          {periodReturn === null && (
            <p style={{ margin: 0 }}>
              Not enough data yet for return calculations.
            </p>
          )}

          {/* NEW: yields from backend summary */}
          {yieldInfo && (
            <>
              {yieldInfo.price != null && (
                <p style={{ margin: 0 }}>
                  <strong>Latest price:</strong> {yieldInfo.price.toFixed(2)}{" "}
                  (as of {yieldInfo.date})
                </p>
              )}
              {yieldInfo.yield_to_maturity != null && (
                <p style={{ margin: 0 }}>
                  <strong>Yield to maturity:</strong>{" "}
                  {yieldInfo.yield_to_maturity.toFixed(2)}%
                </p>
              )}
              {yieldInfo.yield_to_worst != null && (
                <p style={{ margin: 0 }}>
                  <strong>Yield to worst:</strong>{" "}
                  {yieldInfo.yield_to_worst.toFixed(2)}%
                </p>
              )}
            </>
          )}
        </div>


        {/* Chart */}
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
