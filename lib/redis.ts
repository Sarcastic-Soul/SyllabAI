import Redis from "ioredis";

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

// Singleton Redis connection using ioredis (supports Upstash Redis TCP protocol rediss://...)
let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;
  if (!redisUrl) {
    return null;
  }

  if (!redisClient) {
    try {
      redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        lazyConnect: true,
        retryStrategy(times) {
          if (times > 3) {
            console.warn("Redis connection retries exceeded. Falling back to in-memory mode.");
            return null;
          }
          return Math.min(times * 200, 1000);
        },
      });

      redisClient.on("error", (err) => {
        console.warn("Redis error, in-memory fallback will be used:", err.message);
      });
    } catch (e) {
      console.warn("Failed to initialize Redis client:", e);
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
  if (redis && redis.status === "ready") {
    try {
      return await redis.get(key);
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
  if (redis && redis.status === "ready") {
    try {
      await redis.set(key, value, "EX", ttlSeconds);
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
