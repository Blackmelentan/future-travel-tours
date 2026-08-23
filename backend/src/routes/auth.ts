import { Router } from "express";
import { z } from "zod";
import { randomInt } from "crypto";
import { eq, and, gt } from "drizzle-orm";
import { db } from "../db/client.js";
import { users, otpCodes, staff, shifts } from "../db/schema.js";
import { signUserToken, signStaffToken } from "../utils/jwt.js";

export const authRouter = Router();

// ===== Traveller: phone OTP =====

const requestOtpSchema = z.object({ phone: z.string().min(6) });

authRouter.post("/otp/request", async (req, res) => {
  const parsed = requestOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: "INVALID_REQUEST", message: parsed.error.message, status: 400 } });
  }
  const { phone } = parsed.data;
  const code = process.env.NODE_ENV === "development" ? "123456" : String(randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + 5 * 60000);

  await db.insert(otpCodes).values({ phone, code, expiresAt });

  // Real integration: send via WhatsApp/SMS. In dev, it's just logged.
  console.log(`[otp] ${phone} -> ${code} (dev mode: always 123456)`);

  res.json({ sent: true, devHint: process.env.NODE_ENV === "development" ? code : undefined });
});

const verifyOtpSchema = z.object({ phone: z.string().min(6), code: z.string().length(6) });

authRouter.post("/otp/verify", async (req, res) => {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: "INVALID_REQUEST", message: parsed.error.message, status: 400 } });
  }
  const { phone, code } = parsed.data;

  const [otp] = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.phone, phone), eq(otpCodes.code, code), eq(otpCodes.consumed, false), gt(otpCodes.expiresAt, new Date())))
    .limit(1);

  if (!otp) {
    return res.status(401).json({ error: { code: "INVALID_OTP", message: "Code is incorrect or expired", status: 401 } });
  }

  await db.update(otpCodes).set({ consumed: true }).where(eq(otpCodes.id, otp.id));

  let [user] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  if (!user) {
    [user] = await db.insert(users).values({ phone }).returning();
  }

  const token = signUserToken({ userId: user.id, phone: user.phone });
  res.json({ token, user });
});

// ===== Staff: email + password =====

const staffLoginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

authRouter.post("/staff/login", async (req, res) => {
  const parsed = staffLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: "INVALID_REQUEST", message: parsed.error.message, status: 400 } });
  }
  const { email, password } = parsed.data;

  const [member] = await db.select().from(staff).where(eq(staff.email, email)).limit(1);
  if (!member) {
    return res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Email or password is incorrect", status: 401 } });
  }

  // NOTE: seed data stores a plaintext dev password for local testing convenience.
  // Swap this for a real bcrypt.compare(password, member.passwordHash) before production.
  const ok = password === member.passwordHash;
  if (!ok) {
    return res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Email or password is incorrect", status: 401 } });
  }

  const [openShift] = await db.insert(shifts).values({ staffId: member.id }).returning();

  const token = signStaffToken({ staffId: member.id, email: member.email, role: member.role });
  res.json({ token, staff: { id: member.id, email: member.email, fullName: member.fullName, role: member.role }, shiftId: openShift.id });
});

authRouter.post("/staff/clock-out", async (req, res) => {
  const { shiftId } = req.body as { shiftId?: number };
  if (!shiftId) {
    return res.status(400).json({ error: { code: "INVALID_REQUEST", message: "shiftId is required", status: 400 } });
  }
  await db.update(shifts).set({ clockOut: new Date() }).where(eq(shifts.id, shiftId));
  res.json({ clockedOut: true });
});
