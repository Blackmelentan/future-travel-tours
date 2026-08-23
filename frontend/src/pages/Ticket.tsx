import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";

export default function Ticket() {
  const { bookingId } = useParams();
  const [ticket, setTicket] = useState<any | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!bookingId) return;
    api.getTicket(Number(bookingId)).then(setTicket).catch((err) => setError(err.message));
  }, [bookingId]);

  if (error) return <div className="container"><div className="error-banner">{error}</div></div>;
  if (!ticket) return <div className="container"><div className="spinner" /></div>;

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{
          width: 54, height: 54, borderRadius: "50%", background: "rgba(108,184,214,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: 24,
        }}>✓</div>
        <h2 className="display" style={{ margin: 0 }}>Booking confirmed</h2>
        <p style={{ fontSize: 12, color: "var(--ink-dim)" }}>Sent to WhatsApp and email</p>
      </div>

      <div className="card" style={{ background: "linear-gradient(160deg, var(--navy-800), var(--navy-700))" }}>
        <div className="row">
          <span className="badge badge-coral">E-TICKET</span>
          <span style={{ fontSize: 11, color: "var(--ink-dim)" }}>PNR {ticket.pnr}</span>
        </div>
        {ticket.flight && (
          <div className="row" style={{ margin: "18px 0" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 21 }}>{ticket.flight.origin}</div>
              <div style={{ fontSize: 10, color: "var(--ink-dim)" }}>{new Date(ticket.flight.depart_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
            </div>
            <div style={{ color: "var(--blue-light)" }}>&rarr;</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 21 }}>{ticket.flight.destination}</div>
              <div style={{ fontSize: 10, color: "var(--ink-dim)" }}>{new Date(ticket.flight.arrive_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
            </div>
          </div>
        )}
        <div className="divider" />
        <div className="row" style={{ fontSize: 11 }}>
          <span style={{ color: "var(--ink-dim)" }}>Status</span>
          <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{ticket.status}</span>
        </div>
        {ticket.eticket_url && (
          <div className="row" style={{ fontSize: 11, marginTop: 8 }}>
            <span style={{ color: "var(--ink-dim)" }}>E-ticket</span>
            <a href={ticket.eticket_url} style={{ color: "var(--blue-light)" }}>Download PDF</a>
          </div>
        )}
      </div>

      <a href="/" className="btn btn-ghost" style={{ marginTop: 16, display: "block", textAlign: "center", textDecoration: "none" }}>
        Back to home
      </a>
    </div>
  );
}
