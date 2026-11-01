import dns from "node:dns";
import mongoose from "mongoose";
import { env } from "./env.js";

// On some Windows setups Node's resolver points at a loopback DNS proxy that
// can't answer SRV queries, so mongodb+srv:// URIs fail with querySrv
// ECONNREFUSED. Fall back to public resolvers in that case.
function ensureSrvResolvable() {
  if (!env.mongoUri.startsWith("mongodb+srv://")) return;
  const servers = dns.getServers();
  if (servers.length && servers.every((s) => s.startsWith("127.") || s === "::1")) {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  }
}

export async function connectDb() {
  ensureSrvResolvable();
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
  // eslint-disable-next-line no-console
  console.log("MongoDB connected");
}
