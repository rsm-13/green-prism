const API_BASE = "http://localhost:8000/api";

export type TransparencyMode = "rule" | "ml" | "blend";

export interface AnalyzePayload {
  text: string;
  claimed_impact_co2_tons?: number;
  mode?: TransparencyMode; // 👈 new
}

export async function analyzeText(payload: AnalyzePayload) {
  const res = await fetch(`${API_BASE}/analyze_text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "rule", // default if not provided
      ...payload,   // caller can override with "ml" or "blend"
    }),
  });
  if (!res.ok) throw new Error("Failed to analyze text");
  return res.json();
}

export async function fetchBonds(limit = 5000) {
  const res = await fetch(`${API_BASE}/bonds?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch bonds");
  return res.json();
}

export async function fetchBondDetail(bondId: string) {
  const res = await fetch(`${API_BASE}/bonds/${bondId}`);
  if (!res.ok) throw new Error("Failed to fetch bond detail");
  return res.json();
}
