import React, { useEffect, useState } from "react";
import { analyzeText, fetchBonds, fetchBondDetail } from "./api";
import { useTheme } from "./ThemeContext";
import Header from "./components/Header";
import Instructions from "./pages/Instructions";
import BondsPanel from "./components/BondsPanel";
import Analyzer from "./components/Analyzer";
import MarketView from "./components/MarketView";

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

  const [page, setPage] = useState("home");

  const [bonds, setBonds] = useState([]);
  const [selectedBondId, setSelectedBondId] = useState(null);
  const [bondDetail, setBondDetail] = useState(null);

  const [text, setText] = useState("");
  const [claimed, setClaimed] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  // transparency scoring mode: "rule" | "ml" | "blend"
  const [mode, setMode] = useState("rule");

  // impact scoring mode:
  const [impactMode, setImpactMode] = useState("ml");

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

  // When the user switches to Rule impact mode, explicitly request a
  // rule-based estimate for the currently selected bond so the UI can show
  // the numeric rule prediction (even if earlier the ML result was shown).
  useEffect(() => {
    if (impactMode !== "rule" || !selectedBondId) return;
    // call backend endpoint that runs the rule estimator for this bond
    fetch(`http://127.0.0.1:8000/api/bonds/${encodeURIComponent(selectedBondId)}/compute_rule`)
      .then((res) => {
        if (!res.ok) throw new Error("rule compute failed");
        return res.json();
      })
      .then((data) => {
        const rule = data.impact_prediction_rule;
        if (!rule) return;
        setBondDetail((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            scores: {
              ...prev.scores,
              impact_prediction: rule,
            },
          };
        });
      })
      .catch((err) => {
        console.debug("Could not compute rule estimate:", err);
      });
  }, [impactMode, selectedBondId]);

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

  function chooseImpact(ruleObj, mlObj) {
    // If the user explicitly selected ML mode, show ML when available.
    if (impactMode === "ml" && mlObj) {
      return { ...mlObj, source: "ml" };
    }

    // If Rule mode is selected prefer the rule-based prediction — but
    // if it doesn't include a usable `predicted` value, fall back to ML.
    if (impactMode === "rule") {
      if (ruleObj && ruleObj.predicted != null) {
        return { ...ruleObj, source: "rule" };
      }
      if (mlObj) {
        return { ...mlObj, source: "ml_fallback" };
      }
      return null;
    }

    // For blend or other modes prefer rule if present, otherwise ML
    if (ruleObj && ruleObj.predicted != null) {
      return { ...ruleObj, source: "rule" };
    }
    if (mlObj) {
      return { ...mlObj, source: "ml" };
    }
    return null;
  }

  const bgColor = theme === "dark" ? "#020617" : "#ffffff";
  const textColor = theme === "dark" ? "#e5e7eb" : "#111827";
  const cardBg = theme === "dark" ? "#0b1120" : "#ffffff";
  const cardBorder = theme === "dark" ? "#1f2937" : "#dddddd";

  return (
    <div
      style={{
        padding: "1.5rem",
        maxWidth: 1200,
        margin: "0 auto",
        minHeight: "100vh",
        backgroundColor: bgColor,
        color: textColor,
        transition: "background-color 0.25s ease, color 0.25s ease",
      }}
    >
      <Header theme={theme} toggleTheme={toggleTheme} currentPage={page} setPage={setPage} />

      {page === "home" ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "1.5rem" }}>
            <div>
              <BondsPanel
                filteredBonds={filteredBonds}
                bondFilter={bondFilter}
                setBondFilter={setBondFilter}
                selectedBondId={selectedBondId}
                setSelectedBondId={setSelectedBondId}
                bondDetail={bondDetail}
                theme={theme}
                cardBorder={cardBorder}
                cardBg={cardBg}
                textColor={textColor}
                impactMode={impactMode}
                setImpactMode={setImpactMode}
                chooseImpact={chooseImpact}
              />
            </div>

            <div>
              <Analyzer
                text={text}
                setText={setText}
                claimed={claimed}
                setClaimed={setClaimed}
                mode={mode}
                setMode={setMode}
                handleAnalyze={handleAnalyze}
                loading={loading}
                analysis={analysis}
                theme={theme}
                cardBorder={cardBorder}
                cardBg={cardBg}
                textColor={textColor}
              />
            </div>
          </div>

          <MarketView
            ETF_OPTIONS={ETF_OPTIONS}
            RANGE_LABELS={RANGE_LABELS}
            selectedEtf={selectedEtf}
            setSelectedEtf={setSelectedEtf}
            selectedRange={selectedRange}
            setSelectedRange={setSelectedRange}
            prices={prices}
            periodReturn={periodReturn}
            annualizedReturn={annualizedReturn}
            yieldInfo={yieldInfo}
            theme={theme}
            cardBorder={cardBorder}
            textColor={textColor}
          />
        </>
      ) : (
        <Instructions theme={theme} textColor={textColor} cardBg={cardBg} cardBorder={cardBorder} />
      )}
    </div>
  );
}
