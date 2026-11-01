import Redis from "ioredis";
import { env } from "./env.js";

// Minimal surface the app uses: set(key, val, "EX", seconds) / get / del.
export interface KeyValueStore {
  set(key: string, value: string, mode?: "EX", seconds?: number): Promise<unknown>;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<unknown>;
}

class MemoryStore implements KeyValueStore {
  private data = new Map<string, { value: string; expiresAt?: number }>();

  async set(key: string, value: string, mode?: "EX", seconds?: number) {
    this.data.set(key, { value, expiresAt: mode === "EX" && seconds ? Date.now() + seconds * 1000 : undefined });
    return "OK";
  }
  async get(key: string) {
    const hit = this.data.get(key);
    if (!hit) return null;
    if (hit.expiresAt && hit.expiresAt < Date.now()) {
      this.data.delete(key);
      return null;
    }
    return hit.value;
  }
  async del(key: string) {
    this.data.delete(key);
    return 1;
  }
}

export const usingRedis = Boolean(env.redisUrl);
export const redis: KeyValueStore = usingRedis ? (new Redis(env.redisUrl) as unknown as KeyValueStore) : new MemoryStore();
