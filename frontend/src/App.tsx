import { useEffect, useState } from "react";

interface Bond {
  bond_id: string;
  issuer_name: string;
  currency: string;
  use_of_proceeds: string;
  claimed_impact_co2_tons?: number;
}

const API_BASE = "http://localhost:8000/api";

function App() {
  const [bonds, setBonds] = useState<Bond[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/bonds?limit=10`)
      .then((res) => res.json())
      .then(setBonds)
      .catch(console.error);
  }, []);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "1.5rem" }}>
      <h1>Green Prism</h1>
      <p>Green bond transparency &amp; impact predictor MVP scaffold.</p>

      <h2>Sample Bonds</h2>
      <ul>
        {bonds.map((b) => (
          <li key={b.bond_id}>
            <strong>{b.issuer_name}</strong> ({b.currency}) –{" "}
            <small>{b.use_of_proceeds}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
