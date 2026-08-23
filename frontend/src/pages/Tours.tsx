import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useBooking } from "../context/BookingContext";

export default function Tours() {
  const { selectedFare, selectedTours, toggleTour } = useBooking();
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!selectedFare) return;
    api.matchTours(selectedFare.destination).then((res) => {
      setTours(res.matches);
      setLoading(false);
    });
  }, [selectedFare]);

  if (!selectedFare) {
    return <div className="container"><p>No fare selected. <a href="/">Start a new search.</a></p></div>;
  }

  return (
    <div className="container" style={{ maxWidth: 480 }}>
      <h2 className="display">Add a Future Experience</h2>
      <p style={{ color: "var(--ink-dim)", fontSize: 13, marginBottom: 20 }}>Verified local guides at your destination</p>

      {loading && <div className="spinner" />}

      {tours.map((tour) => {
        const isSelected = selectedTours.find((t) => t.tour_id === tour.tour_id);
        return (
          <div className="card" key={tour.tour_id}>
            <div className="row">
              <strong>{tour.title}</strong>
              <span className="badge">{tour.duration_hours} hrs</span>
            </div>
            <p style={{ fontSize: 12, color: "var(--ink-dim)", margin: "8px 0" }}>{tour.description}</p>
            <div className="row">
              <span style={{ fontWeight: 700, color: "var(--blue-light)" }}>{tour.price.currency} {tour.price.amount.toLocaleString()}</span>
              <button className="btn btn-ghost" style={{ width: "auto", padding: "8px 16px" }} onClick={() => toggleTour(tour)}>
                {isSelected ? "Remove" : "Add"}
              </button>
            </div>
          </div>
        );
      })}

      <button className="btn btn-primary" onClick={() => navigate("/checkout")}>
        Continue {selectedTours.length > 0 ? `with ${selectedTours.length} tour(s)` : "without a tour"}
      </button>
    </div>
  );
}
