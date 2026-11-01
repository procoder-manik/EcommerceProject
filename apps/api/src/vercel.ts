import type { IncomingMessage, ServerResponse } from "node:http";
import { app } from "./app.js";
import { connectDb } from "./config/db.js";

// Serverless entry for Vercel (bundled by scripts/vercel-build.mjs). Each warm
// instance reuses one MongoDB connection; server.ts is the long-running entry.
let ready: Promise<void> | undefined;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  ready ??= connectDb();
  try {
    await ready;
  } catch (err) {
    ready = undefined;
    throw err;
  }
  app(req as any, res as any);
}
