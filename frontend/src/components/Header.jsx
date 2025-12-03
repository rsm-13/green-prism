import React from "react";

export default function Header({ theme, toggleTheme }) {
  const textColor = theme === "dark" ? "#e5e7eb" : "#111827";

  return (
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
  );
}
