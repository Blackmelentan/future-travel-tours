import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export interface AuthTokenPayload {
  userId: number;
  phone: string;
}

export function signUserToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, SECRET, { expiresIn: "30d" });
}

export function verifyUserToken(token: string): AuthTokenPayload {
  return jwt.verify(token, SECRET) as AuthTokenPayload;
}

export interface StaffTokenPayload {
  staffId: number;
  email: string;
  role: string;
}

export function signStaffToken(payload: StaffTokenPayload) {
  return jwt.sign(payload, SECRET, { expiresIn: "12h" });
}

export function verifyStaffToken(token: string): StaffTokenPayload {
  return jwt.verify(token, SECRET) as StaffTokenPayload;
}
