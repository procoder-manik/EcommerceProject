import "dotenv/config";

const isProd = process.env.NODE_ENV === "production";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

// In development, secrets fall back to throwaway values so the API boots with
// nothing but MONGODB_URI. In production every secret is mandatory.
function secret(name: string, devFallback: string): string {
  return isProd ? required(name) : process.env[name] || devFallback;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProd,
  mongoUri: required("MONGODB_URI"),
  // Optional: without it, sessions are stored in MongoDB and emails are
  // logged instead of queued (see config/redis.ts, jobs/queue.ts).
  redisUrl: process.env.REDIS_URL || "",
  jwt: {
    accessSecret: secret("JWT_ACCESS_SECRET", "dev-access-secret-change-me"),
    refreshSecret: secret("JWT_REFRESH_SECRET", "dev-refresh-secret-change-me"),
    accessTtl: process.env.JWT_ACCESS_TTL ?? "15m",
    refreshTtl: process.env.JWT_REFRESH_TTL ?? "7d",
  },
  stripe: {
    // Optional: without a key, checkout runs in "test mode" and orders are
    // marked paid immediately (see order.service.ts).
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  },
  corsOrigins: (process.env.CORS_ORIGIN ?? "http://localhost:3000,http://localhost:5173").split(",").filter(Boolean),
};
