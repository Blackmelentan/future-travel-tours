import { Router } from "express";
import { ilike } from "drizzle-orm";
import { db } from "../db/client.js";
import { tours } from "../db/schema.js";

export const toursRouter = Router();

// GET /api/v1/agency/tours/match?destination=LGW
toursRouter.get("/match", async (req, res) => {
  const destinationCity = String(req.query.city || req.query.destination || "");

  const results = destinationCity
    ? await db.select().from(tours).where(ilike(tours.city, `%${destinationCity}%`))
    : await db.select().from(tours);

  res.json({
    matches: results.map((t) => ({
      tour_id: t.id,
      title: t.title,
      city: t.city,
      guide: { name: t.guideName, verified: t.verified, rating: Number(t.rating) },
      price: { amount: Number(t.price), currency: t.currency },
      duration_hours: t.durationHours,
      description: t.description,
    })),
  });
});
