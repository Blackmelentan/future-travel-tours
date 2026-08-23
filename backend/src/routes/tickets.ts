import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/client.js";
import { bookings, fareHolds, tickets, bookingTours, tours } from "../db/schema.js";
import { requireUser, type AuthedRequest } from "../middleware/auth.js";

export const ticketsRouter = Router();

// GET /api/v1/agency/tickets/:bookingId
ticketsRouter.get("/:bookingId", requireUser, async (req: AuthedRequest, res) => {
  const bookingId = Number(req.params.bookingId);

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (!booking || booking.userId !== req.user!.userId) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Booking not found", status: 404 } });
  }

  const [ticket] = await db.select().from(tickets).where(eq(tickets.bookingId, bookingId)).limit(1);
  const [hold] = booking.fareHoldId ? await db.select().from(fareHolds).where(eq(fareHolds.id, booking.fareHoldId)).limit(1) : [];

  res.json({
    booking_id: booking.id,
    pnr: booking.pnr,
    status: booking.status,
    flight: hold
      ? { airline: hold.airline, origin: hold.origin, destination: hold.destination, depart_at: hold.departAt, arrive_at: hold.arriveAt, seat: hold.seat }
      : null,
    eticket_url: ticket?.eTicketUrl ?? null,
    tour_voucher_qr: ticket ? `AES256:${ticket.qrPayload.slice(0, 24)}...` : null,
  });
});

// GET /api/v1/agency/bookings - list the traveller's own bookings (upcoming + past)
ticketsRouter.get("/", requireUser, async (req: AuthedRequest, res) => {
  const rows = await db
    .select()
    .from(bookings)
    .where(eq(bookings.userId, req.user!.userId))
    .orderBy(desc(bookings.createdAt));

  const withFlights = await Promise.all(
    rows.map(async (b) => {
      const [hold] = b.fareHoldId ? await db.select().from(fareHolds).where(eq(fareHolds.id, b.fareHoldId)).limit(1) : [];
      const tourRows = await db.select().from(bookingTours).innerJoin(tours, eq(bookingTours.tourId, tours.id)).where(eq(bookingTours.bookingId, b.id));
      return {
        booking_id: b.id,
        pnr: b.pnr,
        status: b.status,
        total_amount: b.totalAmount,
        currency: b.currency,
        flight: hold ? { airline: hold.airline, origin: hold.origin, destination: hold.destination, depart_at: hold.departAt } : null,
        tours: tourRows.map((r) => r.tours.title),
      };
    })
  );

  res.json({ bookings: withFlights });
});
