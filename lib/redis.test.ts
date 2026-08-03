import { describe, it, expect, beforeEach } from "vitest";
import { getCachedValue, setCachedValue, getCachedEmbedding, setCachedEmbedding } from "@/lib/redis";

describe("Redis & In-Memory Cache Utility", () => {
  it("should store and retrieve string values from cache fallback", async () => {
    const testKey = "test:syllabus:key1";
    const testValue = JSON.stringify([{ title: "Chapter 1", content: "Introduction" }]);

    await setCachedValue(testKey, testValue, 60);
    const retrieved = await getCachedValue(testKey);

    expect(retrieved).toBe(testValue);
    expect(JSON.parse(retrieved!)).toEqual([{ title: "Chapter 1", content: "Introduction" }]);
  });

  it("should return null for non-existent cache keys", async () => {
    const val = await getCachedValue("non_existent_key_12345");
    expect(val).toBeNull();
  });

  it("should store and retrieve embedding arrays", async () => {
    const textHash = "sample_chunk_hash_999";
    const embeddingVector = [0.123, 0.456, -0.789, 0.999];

    await setCachedEmbedding(textHash, embeddingVector, 60);
    const retrieved = await getCachedEmbedding(textHash);

    expect(retrieved).toEqual(embeddingVector);
  });
});
