/**
 * Resilient Rate Limiter for SyllabAI.
 * Uses an in-memory sliding window fallback by default, and seamlessly integrates
 * with Upstash Redis when UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set.
 */

interface RateLimitStore {
    [key: string]: number[];
}

const memoryStore: RateLimitStore = {};

// Default: 20 requests per hour per user
const DEFAULT_MAX_REQUESTS = 20;
const DEFAULT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function checkRateLimit(
    identifier: string,
    maxRequests = DEFAULT_MAX_REQUESTS,
    windowMs = DEFAULT_WINDOW_MS
): Promise<{ success: boolean; remaining: number; reset: number }> {
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (upstashUrl && upstashToken) {
        try {
            // Dynamically import @upstash/ratelimit & @upstash/redis if available
            const { Redis } = await import("@upstash/redis");
            const { Ratelimit } = await import("@upstash/ratelimit");

            const redis = new Redis({
                url: upstashUrl,
                token: upstashToken,
            });

            const ratelimit = new Ratelimit({
                redis,
                limiter: Ratelimit.slidingWindow(maxRequests, `${Math.round(windowMs / 1000)}s`),
                analytics: true,
            });

            const result = await ratelimit.limit(`syllabai:${identifier}`);
            return {
                success: result.success,
                remaining: result.remaining,
                reset: result.reset,
            };
        } catch (e) {
            console.warn("Upstash rate limiter unavailable, falling back to memory store:", e);
        }
    }

    // In-memory sliding window fallback
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!memoryStore[identifier]) {
        memoryStore[identifier] = [];
    }

    // Filter timestamps within the current sliding window
    memoryStore[identifier] = memoryStore[identifier].filter((timestamp) => timestamp > windowStart);

    if (memoryStore[identifier].length >= maxRequests) {
        const oldest = memoryStore[identifier][0];
        const resetTime = oldest + windowMs;
        return {
            success: false,
            remaining: 0,
            reset: resetTime,
        };
    }

    memoryStore[identifier].push(now);
    return {
        success: true,
        remaining: maxRequests - memoryStore[identifier].length,
        reset: now + windowMs,
    };
}
