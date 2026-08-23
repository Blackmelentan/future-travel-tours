import type { Request, Response, NextFunction } from "express";
import { verifyUserToken, verifyStaffToken } from "../utils/jwt.js";

export interface AuthedRequest extends Request {
  user?: { userId: number; phone: string };
  staff?: { staffId: number; email: string; role: string };
}

export function requireUser(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Missing bearer token", status: 401 } });
  }
  try {
    req.user = verifyUserToken(header.slice(7));
    next();
  } catch {
    return res.status(401).json({ error: { code: "INVALID_TOKEN", message: "Token is invalid or expired", status: 401 } });
  }
}

export function requireStaff(...allowedRoles: string[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Missing bearer token", status: 401 } });
    }
    try {
      const payload = verifyStaffToken(header.slice(7));
      if (allowedRoles.length && !allowedRoles.includes(payload.role)) {
        return res.status(403).json({ error: { code: "FORBIDDEN", message: "Your role cannot access this resource", status: 403 } });
      }
      req.staff = payload;
      next();
    } catch {
      return res.status(401).json({ error: { code: "INVALID_TOKEN", message: "Token is invalid or expired", status: 401 } });
    }
  };
}
