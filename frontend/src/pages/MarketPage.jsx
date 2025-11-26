import React, { useEffect, useState } from "react";
import Chart from "../components/Chart";
import ErrorBoundary from "../components/ErrorBoundary";

export default function MarketPage() {
  const [prices, setPrices] = useState([]);
  const [showChart, setShowChart] = useState(false);

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

  return (
    <div style={{ padding: "1.5rem", maxWidth: 1200, margin: "0 auto" }}>
      <h1>Green Bond Market (GRNB ETF Proxy)</h1>
      <p>ETF used as a proxy for overall green bond index performance.</p>

      <div style={{ marginBottom: "1rem" }}>
        <h3>Raw price data (first 10 rows)</h3>
        <pre
          style={{
            maxHeight: "200px",
            overflowY: "auto",
            background: "#f8f9fa",
            borderRadius: "8px",
            padding: "0.75rem",
            fontSize: "12px",
            border: "1px solid #ddd",
          }}
        >
          {prices.length > 0
            ? JSON.stringify(prices.slice(0, 10), null, 2) + "\n..."
            : "No data loaded"}
        </pre>
      </div>

      <h3>Chart</h3>
      <div style={{ marginBottom: 12 }}>
        <label>
          <input
            type="checkbox"
            checked={showChart}
            onChange={(e) => setShowChart(e.target.checked)}
            style={{ marginRight: 8 }}
          />
          Render chart (toggle to isolate runtime errors)
        </label>
      </div>

      {showChart ? (
        <ErrorBoundary>
          <Chart data={prices} height={400} />
        </ErrorBoundary>
      ) : (
        <p style={{ color: "#666" }}>Chart is hidden. Toggle to render.</p>
      )}
      
      {prices.length === 0 && <p style={{ marginTop: "1rem" }}>Awaiting market data…</p>}
    </div>
  );
}
