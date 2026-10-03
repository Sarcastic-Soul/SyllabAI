import { describe, it, expect } from "vitest";
import { l2Normalize } from "@/lib/ai/embeddings";

describe("l2Normalize", () => {
  it("scales a vector to length 1", () => {
    const out = l2Normalize([3, 4]);
    expect(out[0]).toBeCloseTo(0.6);
    expect(out[1]).toBeCloseTo(0.8);
    expect(Math.hypot(...out)).toBeCloseTo(1);
  });

  it("leaves a zero vector alone", () => {
    expect(l2Normalize([0, 0, 0])).toEqual([0, 0, 0]);
  });
});
