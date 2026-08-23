import "dotenv/config";
import express from "express";
import cors from "cors";

import { initCache } from "./services/cache.js";
import { authRouter } from "./routes/auth.js";
import { flightsRouter } from "./routes/flights.js";
import { toursRouter } from "./routes/tours.js";
import { checkoutRouter } from "./routes/checkout.js";
import { ticketsRouter } from "./routes/tickets.js";
import { internalRouter } from "./routes/internal.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true, service: "future-travel-tours-api" }));

// Route prefixes mirror the endpoint paths defined in Document 02.
app.use("/api/v1/agency/auth", authRouter);
app.use("/api/v1/agency/flights", flightsRouter);
app.use("/api/v1/agency/tours", toursRouter);
app.use("/api/v1/agency/checkout", checkoutRouter);
app.use("/api/v1/agency/tickets", ticketsRouter); // also serves GET / for "my bookings"
app.use("/api/v1/agency/internal", internalRouter);

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  await initCache();
  app.listen(PORT, () => {
    console.log(`\nFuture Travel and Tours API listening on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health\n`);
  });
}

start();
