import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useBooking } from "../context/BookingContext";

const MOBILE_MONEY = [
  { id: "wave", label: "Wave" },
  { id: "afrimoney", label: "AfriMoney" },
  { id: "qmoney", label: "QMoney" },
];
const CARDS = [
  { id: "card", label: "Visa / Mastercard" },
  { id: "bank_transfer", label: "Bank transfer" },
];

export default function Checkout() {
  const { selectedFare, hold, selectedTours } = useBooking();
  const [method, setMethod] = useState("wave");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  if (!selectedFare || !hold) {
    return <div className="container"><p>No active fare hold. <a href="/">Start a new search.</a></p></div>;
  }

  const tourTotal = selectedTours.reduce((sum, t) => sum + t.price.amount, 0);
  const total = selectedFare.price.amount + tourTotal;

  async function pay() {
    setLoading(true);
    setError("");
    try {
      const res = await api.checkout({
        holdId: hold!.hold_id,
        tourIds: selectedTours.map((t) => t.tour_id),
        paymentMethod: method,
        currency: "GMD",
      });
      navigate(`/ticket/${res.booking_id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 480 }}>
      <h2 className="display">Checkout</h2>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <div className="row" style={{ fontSize: 13, padding: "4px 0" }}>
          <span style={{ color: "var(--ink-dim)" }}>Flight, {selectedFare.origin} to {selectedFare.destination}</span>
          <span>{selectedFare.price.currency} {selectedFare.price.amount.toLocaleString()}</span>
        </div>
        {selectedTours.map((t) => (
          <div className="row" key={t.tour_id} style={{ fontSize: 13, padding: "4px 0" }}>
            <span style={{ color: "var(--ink-dim)" }}>{t.title}</span>
            <span>{t.price.currency} {t.price.amount.toLocaleString()}</span>
          </div>
        ))}
        <div className="divider" />
        <div className="row" style={{ fontWeight: 700, fontSize: 16 }}>
          <span>Total</span>
          <span style={{ color: "var(--blue-light)" }}>GMD {total.toLocaleString()}</span>
        </div>
      </div>

      <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-dim)", margin: "18px 0 8px" }}>MOBILE MONEY, VIA MODEMPAY</p>
      <div className="card" style={{ padding: 6 }}>
        {MOBILE_MONEY.map((m) => (
          <label key={m.id} className="row" style={{ padding: "10px 8px", cursor: "pointer" }}>
            <span>{m.label}</span>
            <input type="radio" name="method" checked={method === m.id} onChange={() => setMethod(m.id)} />
          </label>
        ))}
      </div>

      <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-dim)", margin: "18px 0 8px" }}>CARDS AND BANKS, VIA STRIPE</p>
      <div className="card" style={{ padding: 6 }}>
        {CARDS.map((m) => (
          <label key={m.id} className="row" style={{ padding: "10px 8px", cursor: "pointer" }}>
            <span>{m.label}</span>
            <input type="radio" name="method" checked={method === m.id} onChange={() => setMethod(m.id)} />
          </label>
        ))}
      </div>

      <button className="btn btn-primary" onClick={pay} disabled={loading} style={{ marginTop: 16 }}>
        {loading ? "Processing..." : `Pay GMD ${total.toLocaleString()}`}
      </button>
    </div>
  );
}
