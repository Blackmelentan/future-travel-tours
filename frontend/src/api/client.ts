const BASE = "/api/v1/agency";

function getToken() {
  return localStorage.getItem("ftt_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data?.error?.message || `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

export const api = {
  requestOtp: (phone: string) => request<{ sent: boolean; devHint?: string }>("/auth/otp/request", { method: "POST", body: JSON.stringify({ phone }) }),
  verifyOtp: (phone: string, code: string) => request<{ token: string; user: any }>("/auth/otp/verify", { method: "POST", body: JSON.stringify({ phone, code }) }),

  searchFlights: (body: { origin: string; destination: string; departDate: string; currency?: string }) =>
    request<{ search_id: string; results: any[]; cache_hit: boolean }>("/flights/search", { method: "POST", body: JSON.stringify(body) }),

  holdFare: (body: { fare: any; holdMinutes?: number }) =>
    request<{ hold_id: string; expires_at: string; pnr_draft: string }>("/flights/hold", { method: "POST", body: JSON.stringify(body) }),

  matchTours: (city: string) => request<{ matches: any[] }>(`/tours/match?city=${encodeURIComponent(city)}`),

  checkout: (body: { holdId: string; tourIds: number[]; paymentMethod: string; currency?: string }) =>
    request<{ booking_id: number; pnr: string; payment_status: string; split: any }>("/checkout/pay", { method: "POST", body: JSON.stringify(body) }),

  getTicket: (bookingId: number) => request<any>(`/tickets/${bookingId}`),

  getMyBookings: () => request<{ bookings: any[] }>("/tickets"),

  setToken: (token: string) => localStorage.setItem("ftt_token", token),
  clearToken: () => localStorage.removeItem("ftt_token"),
  isAuthed: () => !!getToken(),
};
