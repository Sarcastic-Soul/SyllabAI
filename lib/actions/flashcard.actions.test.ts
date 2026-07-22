import { describe, it, expect } from "vitest";
import { calculateSM2 } from "../utils/sm2";

describe("calculateSM2", () => {
  it("should increase interval and ease factor on a perfect score (3)", () => {
    const result = calculateSM2(3, 250, 1);
    
    // Quality 3: ease factor slightly increases, interval increases
    expect(result.interval).toBeGreaterThan(1);
    expect(result.easeFactor).toBeGreaterThanOrEqual(250);
  });

  it("should decrease ease factor but increase interval on an okay score (2)", () => {
    const result = calculateSM2(2, 250, 1);
    
    // Quality 2 (SM2 rating 4): ease factor stays exactly the same
    expect(result.interval).toBeGreaterThan(1);
    expect(result.easeFactor).toBe(250);
  });

  it("should reset interval to 1 and decrease ease factor heavily on a fail (0 or 1)", () => {
    const resultFail1 = calculateSM2(1, 250, 5);
    expect(resultFail1.interval).toBe(1);
    expect(resultFail1.easeFactor).toBeLessThan(250);

    const resultFail0 = calculateSM2(0, 250, 10);
    expect(resultFail0.interval).toBe(1);
    expect(resultFail0.easeFactor).toBeLessThan(250);
  });

  it("should not let ease factor drop below the absolute minimum of 130", () => {
    // Start with a low ease factor and fail
    const result = calculateSM2(0, 140, 1);
    expect(result.easeFactor).toBe(130);
  });
  
  it("should set interval to 1 on the very first review (if quality > 1, wait, actually first interval is 1)", () => {
    const result = calculateSM2(3, 250, 0);
    expect(result.interval).toBe(1);
  });
  
  it("should set interval to 6 on the second review (interval = 1)", () => {
    const result = calculateSM2(3, 250, 1);
    expect(result.interval).toBe(6);
  });
});
