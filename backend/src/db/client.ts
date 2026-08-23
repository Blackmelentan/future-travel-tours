import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and configure it, " +
    "or run `docker compose up -d` from the project root to start the bundled Postgres."
  );
}

export const pool = new pg.Pool({ connectionString });

export const db = drizzle(pool, { schema });
