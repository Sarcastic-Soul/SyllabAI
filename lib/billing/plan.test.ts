import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));

import { resolvePlan } from "./plan";

const now = new Date("2026-10-03T00:00:00Z");

describe("resolvePlan", () => {
  it("is basic when there is no user row", () => {
    expect(resolvePlan(undefined, now)).toEqual({ isPro: false, proUntil: null });
  });

  it("is pro while the paid period is running", () => {
    const proUntil = new Date("2026-10-20T00:00:00Z");
    expect(resolvePlan({ subscriptionPlan: "basic", proUntil }, now)).toEqual({
      isPro: true,
      proUntil,
    });
  });

  it("falls back to basic once the paid period is over", () => {
    const proUntil = new Date("2026-09-20T00:00:00Z");
    expect(resolvePlan({ subscriptionPlan: "basic", proUntil }, now)).toEqual({
      isPro: false,
      proUntil: null,
    });
  });

  it("keeps a manual pro grant with no end date", () => {
    expect(resolvePlan({ subscriptionPlan: "pro", proUntil: null }, now)).toEqual({
      isPro: true,
      proUntil: null,
    });
  });
});
