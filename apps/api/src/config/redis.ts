import Redis from "ioredis";
import mongoose from "mongoose";
import { env } from "./env.js";

// Minimal surface the app uses: set(key, val, "EX", seconds) / get / del.
export interface KeyValueStore {
  set(key: string, value: string, mode?: "EX", seconds?: number): Promise<unknown>;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<unknown>;
}

// Fallback when there's no Redis. Unlike an in-memory map it survives
// restarts and is shared across serverless instances (e.g. on Vercel).
const kvSchema = new mongoose.Schema<{ _id: string; value: string; expiresAt?: Date }>({
  _id: { type: String, required: true },
  value: { type: String, required: true },
  expiresAt: Date,
});
kvSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const KeyValue = mongoose.model("KeyValue", kvSchema);

class MongoStore implements KeyValueStore {
  async set(key: string, value: string, mode?: "EX", seconds?: number) {
    const expiresAt = mode === "EX" && seconds ? new Date(Date.now() + seconds * 1000) : undefined;
    await KeyValue.updateOne({ _id: key }, { value, expiresAt }, { upsert: true });
    return "OK";
  }
  async get(key: string) {
    const hit = await KeyValue.findById(key).lean();
    if (!hit) return null;
    // MongoDB's TTL sweep runs about once a minute, so check expiry here too.
    if (hit.expiresAt && hit.expiresAt < new Date()) return null;
    return hit.value;
  }
  async del(key: string) {
    await KeyValue.deleteOne({ _id: key });
    return 1;
  }
}

export const usingRedis = Boolean(env.redisUrl);
export const redis: KeyValueStore = usingRedis ? (new Redis(env.redisUrl) as unknown as KeyValueStore) : new MongoStore();
