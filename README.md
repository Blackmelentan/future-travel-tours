# Future Travel and Tours — Full-Stack Reference Build

This is a real, runnable implementation of the platform described in Documents 01–08:
a Node.js/Express + PostgreSQL backend and a React web frontend, wired together and
working end to end for the core booking flow (search → fare hold → add a tour →
checkout → e-ticket), plus a staff back-office API.

**What's real vs. mocked:** the app is 100% functional offline. Amadeus (flights),
ModemPay (mobile money), Stripe (cards) and WhatsApp are all implemented as clearly
labelled mock adapters in `backend/src/services/` that return realistic data instantly,
since none of those providers publish public sandbox credentials you can drop in
(see Document 07). Swapping a mock for the real thing later is a contained change —
each adapter file has a comment showing exactly what to replace.

**What's scaffolded but not built out:** the corporate portal, tour guide management,
CMS, and analytics endpoints are in the schema and partially in `internal.ts`, but
the full staff dashboard UI isn't built as React pages yet — the HTML prototype
(`Future_Travel_and_Tours_System_Prototype.html`) is still the design reference for
those screens. This build focused depth over breadth: one flow, fully wired,
rather than every screen half-wired.

---

## 1. What to install first

You need three things on your machine before opening this in VS Code:

1. **Node.js 20 or later** — https://nodejs.org (installs `npm` automatically)
2. **Docker Desktop** — https://www.docker.com/products/docker-desktop (runs Postgres and Redis for you, no manual database install)
3. **VS Code** — https://code.visualstudio.com, plus these two extensions (optional but recommended): **ESLint** and **Prisma/Drizzle** aren't required, just the built-in TypeScript support VS Code already has.

You do **not** need to install Postgres or Redis yourself — Docker Compose handles both.

## 2. Import into VS Code

1. Unzip this project anywhere on your machine.
2. Open VS Code → **File → Open Folder** → select the unzipped `future-travel-tours` folder.
3. Open a terminal inside VS Code: **Terminal → New Terminal**. Everything below runs from there.

## 3. Start the database

From the project root (the folder with `docker-compose.yml`):

```bash
docker compose up -d
```

This starts Postgres on port 5432 and Redis on port 6379 in the background. Leave it running.

## 4. Set up and run the backend

```bash
cd backend
npm install
cp .env.example .env
npm run db:push      # creates all the tables from src/db/schema.ts
npm run db:seed      # adds sample tours and staff logins
npm run dev
```

The API is now running at **http://localhost:4000**. Check it worked:
open http://localhost:4000/health in a browser, you should see `{"ok":true,...}`.

Leave this terminal running. Open a **second terminal** in VS Code for the frontend.

## 5. Set up and run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. Sign in with any Gambian-style phone number —
in development mode the OTP code is always shown on screen (no real SMS is sent),
so you can complete the whole flow immediately.

## 6. Try the full flow

1. Sign in (any phone number, dev OTP shown on screen)
2. Search Banjul (BJL) → London (LGW)
3. Pick a fare, it holds for 20 minutes with a live countdown
4. Optionally add a tour
5. Checkout — pick a mobile money wallet or a card, both settle instantly (mocked)
6. See the confirmed e-ticket with your PNR

## 7. Staff / internal API

There's no staff web UI yet (see "what's scaffolded" above), but the API is live.
Test it with `curl` or a tool like Postman:

```bash
curl -X POST http://localhost:4000/api/v1/agency/auth/staff/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@futuretravelandtours.gm","password":"admin123"}'
```

Use the returned token as a `Authorization: Bearer <token>` header against
`/api/v1/agency/internal/dashboard`, `/manifest`, `/tours`, `/shifts`, `/staff`.

All seeded dev staff logins (from `backend/src/db/seed.ts`):
| Email | Password | Role |
|---|---|---|
| admin@futuretravelandtours.gm | admin123 | super_admin |
| agent@futuretravelandtours.gm | agent123 | ticketing_agent |
| finance@futuretravelandtours.gm | finance123 | finance_lead |
| marketing@futuretravelandtours.gm | marketing123 | marketing_manager |

**Change these before this ever goes near production.** Passwords are stored as
plaintext in the seed for local-dev convenience only — see the comment in
`backend/src/routes/auth.ts` for where to swap in real bcrypt hashing.

## 8. Project structure

```
future-travel-tours/
├── docker-compose.yml       Postgres + Redis for local dev
├── backend/
│   ├── src/
│   │   ├── db/schema.ts     All tables (Drizzle ORM)
│   │   ├── db/seed.ts       Sample tours + staff accounts
│   │   ├── routes/          One file per API area (auth, flights, tours, checkout, tickets, internal)
│   │   ├── services/        Amadeus / ModemPay / Stripe / WhatsApp / cache adapters (mocked)
│   │   ├── middleware/      JWT auth guards, error handler
│   │   └── index.ts         Server entry point
│   └── .env.example         Copy to .env and fill in
└── frontend/
    └── src/
        ├── pages/           One file per screen (Login, Home, Results, Hold, Tours, Checkout, Ticket)
        ├── context/         Booking state shared across the flow
        ├── api/client.ts    Fetch wrapper for the backend
        └── styles/theme.css Brand colours (navy / blue / coral)
```

## 9. Going from mock to real integrations

Each service file in `backend/src/services/` has a comment block explaining exactly
what to change. In short, once you have real credentials:

1. Set `USE_MOCKS=false` in `.env`
2. Fill in the relevant keys (`AMADEUS_*`, `MODEMPAY_*`, `STRIPE_SECRET_KEY`, `WHATSAPP_*`)
3. Replace the mocked function body in that one service file with a real API call —
   nothing else in the codebase needs to change, since every route only depends on
   that function's return shape, not its implementation.

## 10. Common issues

- **"DATABASE_URL is not set"** — you skipped `cp .env.example .env` in `backend/`.
- **Port 5432 or 6379 already in use** — you already have Postgres/Redis running locally; stop those first, or change the ports in `docker-compose.yml` and `.env` together.
- **Frontend shows network errors** — make sure the backend terminal is still running on port 4000; the frontend proxies `/api` to it via `vite.config.ts`.
- **OTP code not shown** — only shown when `NODE_ENV=development` (the default in `.env.example`).
