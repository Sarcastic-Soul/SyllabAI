import { describe, it, expect, vi } from "vitest";
import { pLimit } from "./concurrency";

describe("pLimit", () => {
  it("should limit the number of concurrent promises", async () => {
    const limit = pLimit(2);
    
    let activePromises = 0;
    let maxActivePromises = 0;
    
    const task = async (id: number) => {
      activePromises++;
      if (activePromises > maxActivePromises) {
        maxActivePromises = activePromises;
      }
      
      // Simulate some async work
      await new Promise((resolve) => setTimeout(resolve, 50));
      
      activePromises--;
      return id;
    };
    
    const tasks = [
      limit(() => task(1)),
      limit(() => task(2)),
      limit(() => task(3)),
      limit(() => task(4)),
      limit(() => task(5)),
    ];
    
    const results = await Promise.all(tasks);
    
    // Ensure all results are returned in order
    expect(results).toEqual([1, 2, 3, 4, 5]);
    
    // Ensure we never exceeded the concurrency limit of 2
    expect(maxActivePromises).toBeLessThanOrEqual(2);
    expect(maxActivePromises).toBeGreaterThan(0);
  });
  
  it("should handle failing promises without breaking the queue", async () => {
    const limit = pLimit(1);
    
    const failingTask = limit(() => Promise.reject(new Error("Task failed")));
    const succeedingTask = limit(() => Promise.resolve("Success"));
    
    await expect(failingTask).rejects.toThrow("Task failed");
    await expect(succeedingTask).resolves.toBe("Success");
  });
});
