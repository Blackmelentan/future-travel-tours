import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useBooking } from "../context/BookingContext";

export default function Hold() {
  const { selectedFare, hold, setHold } = useBooking();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!selectedFare) return;
    if (hold) return;
    (async () => {
      setLoading(true);
      try {
        const res = await api.holdFare({ fare: selectedFare, holdMinutes: 20 });
        setHold(res);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedFare]);

  useEffect(() => {
    if (!hold) return;
    const timer = setInterval(() => {
      const diff = new Date(hold.expires_at).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("Expired");
        clearInterval(timer);
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemaining(`${mins}:${String(secs).padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [hold]);

  if (!selectedFare) {
    return <div className="container"><p>No fare selected. <a href="/">Start a new search.</a></p></div>;
  }

  return (
    <div className="container" style={{ maxWidth: 480 }}>
      <h2 className="display">Confirm your fare</h2>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <div className="row">
          <strong>{selectedFare.airline}</strong>
          <span className="badge">Economy</span>
        </div>
        <div className="row" style={{ marginTop: 14 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 20 }}>{new Date(selectedFare.departAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
            <div style={{ fontSize: 11, color: "var(--ink-dim)" }}>{selectedFare.origin}</div>
          </div>
          <div>&rarr;</div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 700, fontSize: 20 }}>{new Date(selectedFare.arriveAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
            <div style={{ fontSize: 11, color: "var(--ink-dim)" }}>{selectedFare.destination}</div>
          </div>
        </div>
      </div>

      {loading && <div className="spinner" />}

      {hold && (
        <>
          <div className="card" style={{ background: "rgba(238,122,98,0.08)", borderColor: "rgba(238,122,98,0.3)" }}>
            <div className="row">
              <span style={{ fontSize: 12, color: "var(--coral-light)", fontWeight: 600 }}>Seat held, complete booking within</span>
              <span className="display" style={{ fontSize: 16, fontWeight: 700, color: "var(--coral-light)" }}>{remaining}</span>
            </div>
          </div>
          <div className="row" style={{ fontSize: 13, padding: "6px 4px" }}>
            <span style={{ color: "var(--ink-dim)" }}>Total</span>
            <strong style={{ color: "var(--blue-light)" }}>{selectedFare.price.currency} {selectedFare.price.amount.toLocaleString()}</strong>
          </div>
          <button className="btn btn-primary" onClick={() => navigate("/tours")} disabled={remaining === "Expired"}>
            Continue
          </button>
        </>
      )}
    </div>
  );
}
