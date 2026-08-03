import { describe, it, expect } from "vitest";
import { getDailyQuotaStatus, QUOTA_LIMITS } from "@/lib/quota";

describe("Gemini Quota Tracker & Smart Router", () => {
  it("should report default quota limits correctly", () => {
    expect(QUOTA_LIMITS["gemini-3.6-flash"]).toBe(20);
    expect(QUOTA_LIMITS["gemini-3.5-flash-lite"]).toBe(500);
  });

  it("should calculate quota status summary format", async () => {
    const status = await getDailyQuotaStatus();

    expect(status).toHaveProperty("flash36");
    expect(status).toHaveProperty("flash35Lite");
    expect(status).toHaveProperty("healthStatus");
    expect(status.flash36.limit).toBe(20);
    expect(status.flash35Lite.limit).toBe(500);
  });
});
