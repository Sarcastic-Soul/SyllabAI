import { Redis } from "@upstash/redis";

// Global cache store for in-memory fallback
const inMemoryCache = new Map<string, { value: string; expiresAt: number }>();

function cleanInMemoryCache() {
  const now = Date.now();
  for (const [key, item] of inMemoryCache.entries()) {
    if (item.expiresAt < now) {
      inMemoryCache.delete(key);
    }
  }
}

// Singleton Upstash HTTP REST Redis client
let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_TOKEN;

  if (!url || !token) {
    return null;
  }

  if (!redisClient) {
    try {
      redisClient = new Redis({ url, token });
    } catch (e) {
      console.warn("Failed to initialize Upstash Redis client:", e);
      redisClient = null;
    }
  }

  return redisClient;
}

/**
 * Get cached string from Redis or in-memory fallback
 */
export async function getCachedValue(key: string): Promise<string | null> {
  const redis = getRedisClient();
  if (redis) {
    try {
      const res = await redis.get<string>(key);
      if (res !== null && res !== undefined) {
        return typeof res === "string" ? res : JSON.stringify(res);
      }
    } catch (e) {
      console.warn(`Redis get failed for key ${key}:`, e);
    }
  }

  // In-memory fallback
  cleanInMemoryCache();
  const item = inMemoryCache.get(key);
  if (item && item.expiresAt > Date.now()) {
    return item.value;
  }
  return null;
}

/**
 * Set cached string in Redis or in-memory fallback
 */
export async function setCachedValue(
  key: string,
  value: string,
  ttlSeconds: number = 86400 // 24 hours default
): Promise<void> {
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set(key, value, { ex: ttlSeconds });
      return;
    } catch (e) {
      console.warn(`Redis set failed for key ${key}:`, e);
    }
  }

  // In-memory fallback
  inMemoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Atomically increment key in Redis or in-memory fallback
 */
export async function incrementCachedCounter(
  key: string,
  ttlSeconds: number = 86400
): Promise<number> {
  const redis = getRedisClient();
  if (redis) {
    try {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, ttlSeconds);
      }
      return count;
    } catch (e) {
      console.warn(`Redis incr failed for key ${key}:`, e);
    }
  }

  cleanInMemoryCache();
  const current = inMemoryCache.get(key);
  const val = (current && current.expiresAt > Date.now() ? parseInt(current.value, 10) || 0 : 0) + 1;
  inMemoryCache.set(key, {
    value: String(val),
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
  return val;
}

/**
 * Get cached Gemini embedding array
 */
export async function getCachedEmbedding(textHash: string): Promise<number[] | null> {
  const raw = await getCachedValue(`embed:${textHash}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as number[];
  } catch {
    return null;
  }
}

/**
 * Cache Gemini embedding array
 */
export async function setCachedEmbedding(
  textHash: string,
  embedding: number[],
  ttlSeconds: number = 604800 // 7 days default
): Promise<void> {
  await setCachedValue(`embed:${textHash}`, JSON.stringify(embedding), ttlSeconds);
}
