import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectDb } from "./config/db.js";
import { usingRedis } from "./config/redis.js";
import { stripe } from "./config/stripe.js";

async function main() {
  await connectDb();
  if (!usingRedis) console.log("[dev] REDIS_URL not set: using in-memory sessions and logging emails.");
  if (!stripe) console.log("[dev] STRIPE_SECRET_KEY not set: checkout runs in test mode (orders are paid instantly).");
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Fatal startup error", err);
  process.exit(1);
});
