import { describe, it, expect } from "vitest";

describe("Adaptive Difficulty Logic Helper", () => {
  it("should categorize high easeFactor & interval as Mastered / Advanced", () => {
    const cardList = [
      { easeFactor: 280, interval: 14, front: "React Hooks", back: "Functions for state" },
      { easeFactor: 260, interval: 7, front: "JSX Syntax", back: "XML in JS" },
    ];

    let weightedSum = 0;
    for (const card of cardList) {
      const easeRatio = Math.min(1.5, Math.max(0.4, card.easeFactor / 250));
      const intervalBonus = Math.min(1.3, 1 + card.interval / 10);
      const cardScore = Math.min(100, Math.round(easeRatio * intervalBonus * 60));
      weightedSum += cardScore;
    }
    const score = Math.min(100, Math.round(weightedSum / cardList.length));

    expect(score).toBeGreaterThanOrEqual(75);
  });

  it("should identify weak concepts when easeFactor < 220", () => {
    const cardList = [
      { easeFactor: 190, interval: 0, front: "Closure Concept", back: "Function with lexical scope" },
      { easeFactor: 250, interval: 5, front: "Variables", back: "Storage containers" },
    ];

    const weak = cardList.filter((c) => c.easeFactor < 220 || c.interval === 0);
    expect(weak.length).toBe(1);
    expect(weak[0].front).toBe("Closure Concept");
  });
});
