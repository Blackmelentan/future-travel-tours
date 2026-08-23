import { Router } from "express";
import { z } from "zod";
import { randomUUID, createHash } from "crypto";
import { eq, inArray } from "drizzle-orm";
import { db } from "../db/client.js";
import { fareHolds, bookings, bookingTours, tours, payments, tickets } from "../db/schema.js";
import { requireUser, type AuthedRequest } from "../middleware/auth.js";
import { modempay, type Wallet } from "../services/modempay.js";
import { stripeGateway, type CardMethod } from "../services/stripe.js";
import { whatsapp } from "../services/whatsapp.js";

export const checkoutRouter = Router();

const MOBILE_MONEY_WALLETS = ["wave", "afrimoney", "qmoney"] as const;
const CARD_METHODS = ["card", "bank_transfer"] as const;
const AGENCY_COMMISSION_RATE = 0.02; // 2% agency take on the flight portion, illustrative

const checkoutSchema = z.object({
  holdId: z.string(), // fareHolds.holdRef
  tourIds: z.array(z.number()).default([]),
  paymentMethod: z.enum([...MOBILE_MONEY_WALLETS, ...CARD_METHODS]),
  currency: z.string().default("GMD"),
});

// POST /api/v1/agency/checkout/pay
checkoutRouter.post("/pay", requireUser, async (req: AuthedRequest, res) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: "INVALID_REQUEST", message: parsed.error.message, status: 400 } });
  }
  const { holdId, tourIds, paymentMethod, currency } = parsed.data;

  const [hold] = await db.select().from(fareHolds).where(eq(fareHolds.holdRef, holdId)).limit(1);
  if (!hold) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Fare hold not found", status: 404 } });
  }
  if (new Date(hold.expiresAt).getTime() < Date.now()) {
    return res.status(410).json({ error: { code: "FARE_EXPIRED", message: "This fare hold has expired", status: 410 } });
  }

  const selectedTours = tourIds.length
    ? await db.select().from(tours).where(inArray(tours.id, tourIds))
    : [];

  const tourTotal = selectedTours.reduce((sum, t) => sum + Number(t.price), 0);
  const fareAmount = Number(hold.fareAmount);
  const totalAmount = fareAmount + tourTotal;
  const agencyCommission = Math.round(fareAmount * AGENCY_COMMISSION_RATE * 100) / 100;
  const reference = `bk_${randomUUID().slice(0, 10)}`;

  // Charge via the correct gateway based on the method the traveller chose.
  let gateway: "modempay" | "stripe";
  let providerRef: string;
  try {
    if ((MOBILE_MONEY_WALLETS as readonly string[]).includes(paymentMethod)) {
      const result = await modempay.charge({ wallet: paymentMethod as Wallet, amountMinor: Math.round(totalAmount * 100), currency, reference });
      gateway = "modempay";
      providerRef = result.providerRef;
    } else {
      const result = await stripeGateway.charge({ method: paymentMethod as CardMethod, amountMinor: Math.round(totalAmount * 100), currency, reference });
      gateway = "stripe";
      providerRef = result.providerRef;
    }
  } catch {
    return res.status(402).json({ error: { code: "PAYMENT_DECLINED", message: "Payment provider declined the transaction.", status: 402, retryable: true } });
  }

  const pnr = randomUUID().slice(0, 6).toUpperCase();

  const [booking] = await db
    .insert(bookings)
    .values({
      pnr,
      userId: req.user!.userId,
      fareHoldId: hold.id,
      status: "paid",
      totalAmount: String(totalAmount),
      currency,
      agencyCommission: String(agencyCommission),
    })
    .returning();

  if (selectedTours.length) {
    await db.insert(bookingTours).values(
      selectedTours.map((t) => ({ bookingId: booking.id, tourId: t.id, price: t.price }))
    );
  }

  await db.insert(payments).values({
    bookingId: booking.id,
    method: paymentMethod,
    gateway,
    amount: String(totalAmount),
    currency,
    status: "settled",
    providerRef,
  });

  // Generate the e-ticket + AES-256-style encrypted QR voucher payload (mocked hash for the prototype).
  const qrPayload = createHash("sha256").update(`${pnr}:${booking.id}:${Date.now()}`).digest("hex");
  const eTicketUrl = `https://vault.futuretravelandtours.gm/eticket/${booking.id}.pdf`;
  await db.insert(tickets).values({ bookingId: booking.id, eTicketUrl, qrPayload });
  await db.update(bookings).set({ status: "ticketed" }).where(eq(bookings.id, booking.id));

  await whatsapp.sendBookingConfirmation(req.user!.phone, pnr, eTicketUrl);

  res.json({
    booking_id: booking.id,
    pnr,
    payment_status: "settled",
    gateway,
    split: {
      airline_fare: fareAmount,
      tour_guide_payout: tourTotal,
      agency_commission: agencyCommission,
    },
    receipt_url: `https://pay.futuretravelandtours.gm/r/${reference}`,
  });
});
