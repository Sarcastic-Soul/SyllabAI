import { describe, it, expect, vi } from "vitest";
import { withRetry } from "./retry";
import { checkRateLimit } from "@/lib/ratelimit";

describe("withRetry Utility", () => {
    it("should return result on first successful attempt", async () => {
        const fn = vi.fn().mockResolvedValue("success");
        const result = await withRetry(fn);
        expect(result).toBe("success");
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should retry transient 429 errors and succeed", async () => {
        const fn = vi
            .fn()
            .mockRejectedValueOnce(new Error("429 Too Many Requests"))
            .mockResolvedValueOnce("recovered");

        const result = await withRetry(fn, { initialDelayMs: 1, maxRetries: 2 });
        expect(result).toBe("recovered");
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should fail immediately on non-transient errors", async () => {
        const fn = vi.fn().mockRejectedValue(new Error("Invalid parameters"));

        await expect(withRetry(fn, { initialDelayMs: 1 })).rejects.toThrow("Invalid parameters");
        expect(fn).toHaveBeenCalledTimes(1);
    });
});

describe("checkRateLimit Utility", () => {
    it("should allow requests up to limit and block excess in memory fallback", async () => {
        const userId = "test_user_rate_limit_" + Date.now();
        
        for (let i = 0; i < 3; i++) {
            const res = await checkRateLimit(userId, 3, 10000);
            expect(res.success).toBe(true);
        }

        const blockedRes = await checkRateLimit(userId, 3, 10000);
        expect(blockedRes.success).toBe(false);
        expect(blockedRes.remaining).toBe(0);
    });
});
