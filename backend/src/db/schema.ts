import {
  pgTable, serial, text, varchar, integer, numeric, timestamp, boolean, jsonb, pgEnum
} from "drizzle-orm/pg-core";

// ===== ENUMS =====
export const bookingStatusEnum = pgEnum("booking_status", [
  "hold", "paid", "ticketed", "cancelled", "expired"
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "wave", "afrimoney", "qmoney", "card", "bank_transfer"
]);

export const staffRoleEnum = pgEnum("staff_role", [
  "super_admin", "ticketing_agent", "finance_lead", "marketing_manager", "operations_staff"
]);

// ===== TRAVELLERS =====
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 32 }).notNull().unique(),
  fullName: text("full_name"),
  email: varchar("email", { length: 255 }),
  passportNumber: varchar("passport_number", { length: 64 }),
  nationality: varchar("nationality", { length: 64 }),
  dateOfBirth: varchar("date_of_birth", { length: 32 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const otpCodes = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 32 }).notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  consumed: boolean("consumed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===== STAFF (internal back-office, Document 02 Hub C) =====
export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  role: staffRoleEnum("role").notNull().default("operations_staff"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").notNull().references(() => staff.id),
  clockIn: timestamp("clock_in").defaultNow().notNull(),
  clockOut: timestamp("clock_out"),
});

// ===== FLIGHTS / FARES =====
// Fare search results are not persisted (they come live from the Amadeus adapter),
// but a "hold" is persisted the moment a traveller commits to one, mirroring how a
// real GDS fare hold works.
export const fareHolds = pgTable("fare_holds", {
  id: serial("id").primaryKey(),
  holdRef: varchar("hold_ref", { length: 16 }).notNull().unique(),
  userId: integer("user_id").references(() => users.id),
  origin: varchar("origin", { length: 8 }).notNull(),
  destination: varchar("destination", { length: 8 }).notNull(),
  airline: text("airline").notNull(),
  departAt: timestamp("depart_at").notNull(),
  arriveAt: timestamp("arrive_at").notNull(),
  fareAmount: numeric("fare_amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 4 }).notNull().default("GMD"),
  seat: varchar("seat", { length: 8 }),
  raw: jsonb("raw"), // full fare payload returned by the Amadeus adapter, for audit/debug
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===== TOURS (Future Experiences marketplace) =====
export const tours = pgTable("tours", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  city: varchar("city", { length: 64 }).notNull(),
  durationHours: integer("duration_hours").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 4 }).notNull().default("GMD"),
  rating: numeric("rating", { precision: 2, scale: 1 }).default("0"),
  guideName: text("guide_name"),
  verified: boolean("verified").default(true).notNull(),
  description: text("description"),
});

// ===== BOOKINGS (a completed purchase: flight + optional tours) =====
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  pnr: varchar("pnr", { length: 16 }).notNull().unique(),
  userId: integer("user_id").notNull().references(() => users.id),
  fareHoldId: integer("fare_hold_id").references(() => fareHolds.id),
  status: bookingStatusEnum("status").notNull().default("hold"),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 4 }).notNull().default("GMD"),
  agencyCommission: numeric("agency_commission", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bookingTours = pgTable("booking_tours", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => bookings.id),
  tourId: integer("tour_id").notNull().references(() => tours.id),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => bookings.id),
  method: paymentMethodEnum("method").notNull(),
  gateway: varchar("gateway", { length: 32 }).notNull(), // "modempay" | "stripe"
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 4 }).notNull().default("GMD"),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  providerRef: varchar("provider_ref", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => bookings.id).unique(),
  eTicketUrl: text("e_ticket_url"),
  qrPayload: text("qr_payload").notNull(), // AES-256 encrypted voucher payload (mocked)
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
});
