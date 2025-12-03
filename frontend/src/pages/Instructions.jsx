import React from "react";

export default function Instructions({ theme, textColor, cardBg, cardBorder }) {
    const bg = cardBg || (theme === "dark" ? "#0b1120" : "#fff");
    const border = cardBorder || (theme === "dark" ? "#1f2937" : "#ddd");

    return (
        <div style={{ padding: 16, borderRadius: 8, backgroundColor: bg, border: `1px solid ${border}`, color: textColor, lineHeight: 1.85 }}>
        <h2 style={{ marginTop: 0 }}><i>how to use Green Prism</i></h2>
        <ol>
            <li>Select a bond from the left panel to load its disclosure and details below.</li>
            <li>Paste green bond disclosure text into the analyzer on the panel on the right, then choose a transparency scoring mode and click "Run Analysis."</li>
            <li>Optionally enter a claimed CO₂ impact value before running analysis to compare estimated impacts.</li>
            <li>Use the market chart below to compare selected green bond ETFs across different time ranges.</li>
            <li>Toggle the theme using the button in the top-right of the header.</li>
        </ol>

        <p style={{ marginTop: 12 }}>
            For more detailed notes about the scoring and models, check out this project's <a
                href="https://github.com/rsm-13/green-prism/blob/main/README.md"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#8DA6FF' }}
            >
                README
            </a>.
        </p>
        </div>
    );
}
