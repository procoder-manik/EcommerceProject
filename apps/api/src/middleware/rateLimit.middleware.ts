import rateLimit from "express-rate-limit";

// Tighter limiter for auth/checkout routes; a looser global limiter can wrap
// the whole app in app.ts. Swap the default memory store for rate-limit-redis
// once running more than one API instance.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many attempts, try again later" } },
});
