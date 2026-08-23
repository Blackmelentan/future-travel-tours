import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

export default function Home() {
  const [origin, setOrigin] = useState("BJL");
  const [destination, setDestination] = useState("LGW");
  const [departDate, setDepartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 21);
    return d.toISOString().slice(0, 10);
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function search() {
    setLoading(true);
    setError("");
    try {
      const res = await api.searchFlights({ origin, destination, departDate, currency: "GMD" });
      navigate("/results", { state: { results: res.results, origin, destination, departDate } });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 480 }}>
      <h2 className="display">Where to?</h2>
      <p style={{ color: "var(--ink-dim)", fontSize: 13, marginBottom: 20 }}>
        Fly Future, Sky, Smiles and Beyond
      </p>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <div className="row" style={{ gap: 10 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>From</label>
            <input value={origin} onChange={(e) => setOrigin(e.target.value.toUpperCase())} maxLength={3} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>To</label>
            <input value={destination} onChange={(e) => setDestination(e.target.value.toUpperCase())} maxLength={3} />
          </div>
        </div>
        <div className="field">
          <label>Depart</label>
          <input type="date" value={departDate} onChange={(e) => setDepartDate(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={search} disabled={loading}>
          {loading ? "Searching..." : "Search flights"}
        </button>
      </div>
    </div>
  );
}
