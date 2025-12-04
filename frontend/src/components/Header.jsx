import React from "react";
import logo from "../assets/green_prism_logo.png";

// header: top-level navigation, logo and theme toggle
export default function Header({ theme, toggleTheme, currentPage, setPage }) {
    const textColor = theme === "dark" ? "#e5e7eb" : "#111827";
    const inactive = theme === "dark" ? "#0b1120" : "transparent";

    return (
        <div
        style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
        }}
        >
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
            {/* logo: brand image for the app header */}
            <img
            src={logo}
            alt="Green Prism logo"
            style={{
                width: 160,
                height: 85,
                objectFit: "cover",
                borderRadius: 40,
                border: `1px solid ${theme === "dark" ? "#1f2937" : "#e5e7eb"}`,
            }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
            {/* app title and short description */}
            <h1 style={{ marginTop: 50, marginBottom: 4 }}>GREEN PRISM: <i>Fixed Insight</i></h1>
            <p style={{ maxWidth: 700, marginTop: 0 }}>
                Green bond transparency &amp; impact predictor — select a sample
                bond or paste disclosure text to analyze it. Below, compare green
                bond ETF performance over various time horizons.
            </p>
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            {/* navigation buttons: set page state when clicked */}
            <button
                onClick={() => setPage && setPage("home")}
                style={{
                padding: "0.35rem 0.7rem",
                borderRadius: 6,
                border: "1px solid transparent",
                backgroundColor: currentPage === "home" ? (theme === "dark" ? "#f3f4f6" : "#e5e7eb") : inactive,
                color: currentPage === "home" ? "#000" : textColor,
                cursor: "pointer",
                fontSize: 13,
                }}
            >
                Home
            </button>

            <button
                onClick={() => setPage && setPage("instructions")}
                style={{
                padding: "0.35rem 0.7rem",
                borderRadius: 6,
                border: "1px solid transparent",
                backgroundColor: currentPage === "instructions" ? (theme === "dark" ? "#f3f4f6" : "#e5e7eb") : inactive,
                color: currentPage === "instructions" ? "#000" : textColor,
                cursor: "pointer",
                fontSize: 13,
                }}
            >
                Instructions
            </button>
            </div>
        </div>
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
            {theme === "dark" ? "☀  Light mode" : "⏾  Dark mode"}
        </button>
        </div>
    );
}
