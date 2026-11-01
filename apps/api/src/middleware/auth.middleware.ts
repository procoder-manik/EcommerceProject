import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AuthedRequest extends Request {
  user?: { id: string; role: "customer" | "admin" };
}

export function authenticate(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Missing token" } });
  }
  try {
    const token = header.slice("Bearer ".length);
    req.user = jwt.verify(token, env.jwt.accessSecret) as AuthedRequest["user"];
    next();
  } catch {
    res.status(401).json({ error: { code: "INVALID_TOKEN", message: "Invalid or expired token" } });
  }
}

// Verifies the token when one is sent, but never rejects the request when
// it's missing or invalid — used on routes guests can hit too (the cart).
export function maybeAuthenticate(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      req.user = jwt.verify(header.slice("Bearer ".length), env.jwt.accessSecret) as AuthedRequest["user"];
    } catch {
      // guest request with a stale/invalid token — treat as unauthenticated
    }
  }
  next();
}

export function requireRole(role: "admin") {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Insufficient permissions" } });
    }
    next();
  };
}
