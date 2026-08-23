import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "crypto";
import { amadeus, type FareResult } from "../services/amadeus.js";
import { cache } from "../services/cache.js";
import { db } from "../db/client.js";
import { fareHolds } from "../db/schema.js";
import { requireUser, type AuthedRequest } from "../middleware/auth.js";

export const flightsRouter = Router();

// POST /api/v1/agency/flights/search
const searchSchema = z.object({
  origin: z.string().length(3),
  destination: z.string().length(3),
  departDate: z.string(), // YYYY-MM-DD
  returnDate: z.string().optional(),
  passengers: z.object({ adults: z.number().min(1), children: z.number().min(0).default(0), infants: z.number().min(0).default(0) }).optional(),
  cabinClass: z.string().default("economy"),
  currency: z.string().default("GMD"),
});

flightsRouter.post("/search", async (req, res) => {
  const parsed = searchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: "INVALID_REQUEST", message: parsed.error.message, status: 400 } });
  }
  const { origin, destination, departDate, currency } = parsed.data;

  const cacheKey = `search:${origin}:${destination}:${departDate}:${currency}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return res.json({ search_id: randomUUID(), results: JSON.parse(cached), cache_hit: true });
  }

  try {
    const results = await amadeus.search({ origin, destination, departDate, currency });
    await cache.set(cacheKey, JSON.stringify(results), 120); // 2 minute fare cache
    res.json({ search_id: randomUUID(), results, cache_hit: false });
  } catch (err) {
    // Mirrors the GDS-timeout fallback described in Document 02, Section 4.
    res.status(503).json({
      error: { code: "GDS_TIMEOUT", message: "Live search timed out.", status: 503, fallback: "cached_fares" },
    });
  }
});

// POST /api/v1/agency/flights/hold
const holdSchema = z.object({
  fare: z.custom<FareResult>((v) => typeof v === "object" && v !== null && "fareId" in v),
  holdMinutes: z.number().default(20),
  passengerNames: z.array(z.string()).default([]),
});

flightsRouter.post("/hold", requireUser, async (req: AuthedRequest, res) => {
  const parsed = holdSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: "INVALID_REQUEST", message: parsed.error.message, status: 400 } });
  }
  const { fare, holdMinutes } = parsed.data;

  try {
    const confirmation = await amadeus.hold(fare);
    const holdRef = `hold_${randomUUID().slice(0, 8)}`;
    const expiresAt = new Date(Date.now() + holdMinutes * 60000);

    const [row] = await db
      .insert(fareHolds)
      .values({
        holdRef,
        userId: req.user!.userId,
        origin: fare.origin,
        destination: fare.destination,
        airline: fare.airline,
        departAt: new Date(fare.departAt),
        arriveAt: new Date(fare.arriveAt),
        fareAmount: String(fare.price.amount),
        currency: fare.price.currency,
        raw: fare,
        expiresAt,
      })
      .returning();

    res.json({
      hold_id: holdRef,
      hold_db_id: row.id,
      status: "confirmed",
      expires_at: expiresAt.toISOString(),
      pnr_draft: confirmation.pnrDraft,
    });
  } catch (err) {
    if ((err as Error).message === "FARE_EXPIRED") {
      return res.status(410).json({ error: { code: "FARE_EXPIRED", message: "This fare is no longer available, please search again.", status: 410 } });
    }
    throw err;
  }
});
