import { createContext, useContext, useState, type ReactNode } from "react";

interface BookingState {
  selectedFare: any | null;
  hold: { hold_id: string; expires_at: string; pnr_draft: string } | null;
  selectedTours: any[];
  setSelectedFare: (fare: any) => void;
  setHold: (hold: BookingState["hold"]) => void;
  toggleTour: (tour: any) => void;
}

const BookingContext = createContext<BookingState | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [selectedFare, setSelectedFare] = useState<any | null>(null);
  const [hold, setHold] = useState<BookingState["hold"]>(null);
  const [selectedTours, setSelectedTours] = useState<any[]>([]);

  function toggleTour(tour: any) {
    setSelectedTours((prev) =>
      prev.find((t) => t.tour_id === tour.tour_id) ? prev.filter((t) => t.tour_id !== tour.tour_id) : [...prev, tour]
    );
  }

  return (
    <BookingContext.Provider value={{ selectedFare, setSelectedFare, hold, setHold, selectedTours, toggleTour }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used within BookingProvider");
  return ctx;
}
