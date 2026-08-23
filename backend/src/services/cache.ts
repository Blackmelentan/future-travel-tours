// Fare cache. Uses Redis if REDIS_URL is set and reachable; otherwise falls back
// to an in-memory Map so the API still runs with zero extra setup. This mirrors
// the "Redis fare cache" described in Document 02, Section 4.

import Redis from "ioredis";

interface CacheDriver {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
}

class InMemoryCache implements CacheDriver {
  private store = new Map<string, { value: string; expiresAt: number }>();

  async get(key: string) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds: number) {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }
}

class RedisCache implements CacheDriver {
  constructor(private client: Redis) {}

  async get(key: string) {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds: number) {
    await this.client.set(key, value, "EX", ttlSeconds);
  }
}

let driver: CacheDriver = new InMemoryCache();
let usingRedis = false;

export async function initCache() {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.log("[cache] REDIS_URL not set, using in-memory fare cache");
    return;
  }
  try {
    const client = new Redis(url, { lazyConnect: true, retryStrategy: () => null });
    await client.connect();
    driver = new RedisCache(client);
    usingRedis = true;
    console.log("[cache] connected to Redis, fare cache is persistent");
  } catch (err) {
    console.warn("[cache] could not reach Redis, falling back to in-memory fare cache:", (err as Error).message);
  }
}

export const cache = {
  get: (key: string) => driver.get(key),
  set: (key: string, value: string, ttlSeconds: number) => driver.set(key, value, ttlSeconds),
  isRedis: () => usingRedis,
};
