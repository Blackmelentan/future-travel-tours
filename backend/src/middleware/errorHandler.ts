import type { Request, Response, NextFunction } from "express";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error("[error]", err);
  const message = err instanceof Error ? err.message : "Unexpected server error";
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message, status: 500 } });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "No route matches this request", status: 404 } });
}
