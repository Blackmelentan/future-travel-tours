import { useLocation, useNavigate } from "react-router-dom";
import { useBooking } from "../context/BookingContext";

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setSelectedFare } = useBooking();
  const state = location.state as { results: any[]; origin: string; destination: string; departDate: string } | undefined;

  if (!state) {
    return (
      <div className="container">
        <p>No search yet. <a href="/">Go back and search a route.</a></p>
      </div>
    );
  }

  function pick(fare: any) {
    setSelectedFare(fare);
    navigate("/hold");
  }

  return (
    <div className="container" style={{ maxWidth: 620 }}>
      <h2 className="display">{state.origin} to {state.destination}</h2>
      <p style={{ color: "var(--ink-dim)", fontSize: 13, marginBottom: 20 }}>{state.departDate}</p>

      {state.results.map((fare) => (
        <div className="card" key={fare.fareId} style={{ cursor: "pointer" }} onClick={() => pick(fare)}>
          <div className="row">
            <strong>{fare.airline}</strong>
            <span className="badge">{fare.stops === 0 ? "Direct" : `${fare.stops} stop`}</span>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{new Date(fare.departAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
              <div style={{ fontSize: 11, color: "var(--ink-dim)" }}>{fare.origin}</div>
            </div>
            <div style={{ flex: 1, textAlign: "center", fontSize: 11, color: "var(--ink-dim)" }}>
              {Math.floor(fare.durationMinutes / 60)}h {fare.durationMinutes % 60}m {fare.via ? `via ${fare.via}` : ""}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{new Date(fare.arriveAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
              <div style={{ fontSize: 11, color: "var(--ink-dim)" }}>{fare.destination}</div>
            </div>
          </div>
          <div className="divider" />
          <div className="row">
            <span style={{ fontSize: 11, color: "var(--ink-dim)" }}>Fare expires {new Date(fare.fareExpiresAt).toLocaleTimeString()}</span>
            <span style={{ fontWeight: 700, fontSize: 16, color: "var(--blue-light)" }}>
              {fare.price.currency} {fare.price.amount.toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
