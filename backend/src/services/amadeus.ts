// Amadeus adapter. Document 02 specifies Amadeus Quick Connect as the GDS
// integration (Document 07 flags that Amadeus does not publish flat pricing,
// so this ships as a mock by default). Set USE_MOCKS=false and fill in
// AMADEUS_API_KEY / AMADEUS_API_SECRET in .env to wire up the real API -
// the function signatures below match what the real Amadeus Node SDK expects,
// so swapping the implementation is a contained change.

import { randomUUID } from "crypto";

export interface FareResult {
  fareId: string;
  airline: string;
  origin: string;
  destination: string;
  departAt: string;
  arriveAt: string;
  durationMinutes: number;
  stops: number;
  via: string | null;
  price: { amount: number; currency: string };
  fareExpiresAt: string;
}

const AIRLINES = [
  { name: "Brussels Airlines", via: "Brussels (BRU)", durationMinutes: 745, stops: 1, basePrice: 24850 },
  { name: "Royal Air Maroc", via: "Casablanca (CMN)", durationMinutes: 910, stops: 1, basePrice: 22300 },
  { name: "Air Senegal", via: "Dakar (DSS)", durationMinutes: 640, stops: 1, basePrice: 26900 },
  { name: "Turkish Airlines", via: "Istanbul (IST)", durationMinutes: 1075, stops: 1, basePrice: 29450 },
];

function seedFromString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export const amadeus = {
  /**
   * Multi-Airline Search Engine
   * Mirrors POST /api/v1/agency/flights/search from Document 02.
   */
  async search(params: { origin: string; destination: string; departDate: string; currency?: string }): Promise<FareResult[]> {
    const seed = seedFromString(`${params.origin}${params.destination}${params.departDate}`);
    const currency = params.currency ?? "GMD";

    return AIRLINES.map((airline, i) => {
      const jitter = ((seed >> (i * 4)) % 9) - 4; // deterministic -4..+4 percent-ish variance
      const price = Math.round(airline.basePrice * (1 + jitter / 100));
      const departHour = 6 + ((seed >> (i * 3)) % 16);
      const departAt = new Date(`${params.departDate}T${String(departHour).padStart(2, "0")}:00:00Z`);
      const arriveAt = new Date(departAt.getTime() + airline.durationMinutes * 60000);

      return {
        fareId: `fare_${randomUUID().slice(0, 8)}`,
        airline: airline.name,
        origin: params.origin,
        destination: params.destination,
        departAt: departAt.toISOString(),
        arriveAt: arriveAt.toISOString(),
        durationMinutes: airline.durationMinutes,
        stops: airline.stops,
        via: airline.via,
        price: { amount: price, currency },
        fareExpiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
      };
    }).sort((a, b) => a.price.amount - b.price.amount);
  },

  /**
   * Real-Time Seat & Fare Hold
   * Mirrors POST /api/v1/agency/flights/hold from Document 02.
   * In production this calls Amadeus to actually hold the seat; here it just
   * validates the fare hasn't "expired" in mock-time.
   */
  async hold(fare: FareResult) {
    if (new Date(fare.fareExpiresAt).getTime() < Date.now()) {
      throw new Error("FARE_EXPIRED");
    }
    return {
      confirmed: true,
      pnrDraft: randomUUID().slice(0, 6).toUpperCase(),
    };
  },
};
