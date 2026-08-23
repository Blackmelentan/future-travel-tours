import { Router } from "express";
import { eq, desc, gte } from "drizzle-orm";
import { db } from "../db/client.js";
import { bookings, fareHolds, staff, shifts, tours } from "../db/schema.js";
import { requireStaff, type AuthedRequest } from "../middleware/auth.js";

export const internalRouter = Router();

// GET /api/v1/agency/internal/dashboard
internalRouter.get("/dashboard", requireStaff(), async (_req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todaysBookings = await db.select().from(bookings).where(gte(bookings.createdAt, startOfDay));
  const revenueToday = todaysBookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);
  const expiringHolds = await db.select().from(fareHolds).where(gte(fareHolds.expiresAt, new Date()));

  const recent = await db.select().from(bookings).orderBy(desc(bookings.createdAt)).limit(10);

  res.json({
    bookings_today: todaysBookings.length,
    revenue_today: revenueToday,
    fare_holds_active: expiringHolds.length,
    recent_bookings: recent.map((b) => ({ pnr: b.pnr, status: b.status, amount: b.totalAmount, currency: b.currency })),
  });
});

// GET /api/v1/agency/internal/manifest/:flightRef - simple manifest lookup by airline + date
internalRouter.get("/manifest", requireStaff("super_admin", "ticketing_agent", "operations_staff"), async (req, res) => {
  const rows = await db
    .select({ pnr: bookings.pnr, status: bookings.status, seat: fareHolds.seat, airline: fareHolds.airline, departAt: fareHolds.departAt })
    .from(bookings)
    .innerJoin(fareHolds, eq(bookings.fareHoldId, fareHolds.id));

  res.json({ manifest: rows });
});

// GET /api/v1/agency/internal/tours - manage the tour marketplace
internalRouter.get("/tours", requireStaff(), async (_req, res) => {
  const rows = await db.select().from(tours);
  res.json({ tours: rows });
});

// GET /api/v1/agency/internal/shifts - who's on shift right now
internalRouter.get("/shifts", requireStaff(), async (_req, res) => {
  const rows = await db
    .select({ shiftId: shifts.id, clockIn: shifts.clockIn, clockOut: shifts.clockOut, staffName: staff.fullName, role: staff.role })
    .from(shifts)
    .innerJoin(staff, eq(shifts.staffId, staff.id))
    .orderBy(desc(shifts.clockIn));

  res.json({ shifts: rows });
});

// GET /api/v1/agency/internal/staff - RBAC list, super admin only
internalRouter.get("/staff", requireStaff("super_admin"), async (_req, res) => {
  const rows = await db.select({ id: staff.id, email: staff.email, fullName: staff.fullName, role: staff.role }).from(staff);
  res.json({ staff: rows });
});
