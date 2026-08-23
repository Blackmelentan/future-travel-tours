// Run with: npm run db:seed (after db:push has created the tables)
import "dotenv/config";
import { db, pool } from "./client.js";
import { tours, staff } from "./schema.js";

async function seed() {
  console.log("Seeding tours...");
  await db.insert(tours).values([
    {
      title: "London Historic Walk + Thames Cruise",
      city: "London",
      durationHours: 5,
      price: "3200",
      currency: "GMD",
      rating: "4.8",
      guideName: "Verified Local Partner",
      verified: true,
      description: "Walk the South Bank, Tower Bridge and Westminster with a verified local guide, then close with a relaxed Thames river cruise at golden hour.",
    },
    {
      title: "Camden Market Food Trail",
      city: "London",
      durationHours: 3,
      price: "1850",
      currency: "GMD",
      rating: "4.6",
      guideName: "Verified Local Partner",
      verified: true,
      description: "A guided tasting trail through Camden's best street food stalls.",
    },
    {
      title: "Kachikally Crocodile Pool Tour",
      city: "Banjul",
      durationHours: 3,
      price: "850",
      currency: "GMD",
      rating: "4.9",
      guideName: "Verified Local Partner",
      verified: true,
      description: "A guided visit to the sacred crocodile pool, one of The Gambia's best-known cultural sites.",
    },
  ]);

  console.log("Seeding staff accounts (dev passwords, change before production)...");
  await db.insert(staff).values([
    { email: "admin@futuretravelandtours.gm", passwordHash: "admin123", fullName: "Adama Bah", role: "super_admin" },
    { email: "agent@futuretravelandtours.gm", passwordHash: "agent123", fullName: "Ousman Jatta", role: "ticketing_agent" },
    { email: "finance@futuretravelandtours.gm", passwordHash: "finance123", fullName: "Fatoumata Ceesay", role: "finance_lead" },
    { email: "marketing@futuretravelandtours.gm", passwordHash: "marketing123", fullName: "Lamin Jobe", role: "marketing_manager" },
  ]);

  console.log("Done. Staff logins (dev only):");
  console.log("  admin@futuretravelandtours.gm / admin123 (super_admin)");
  console.log("  agent@futuretravelandtours.gm / agent123 (ticketing_agent)");
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
