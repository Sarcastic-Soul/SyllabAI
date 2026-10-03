import { getGenAI } from "@/lib/quota";
import { logWarn } from "@/lib/logger";
import { withRetry } from "@/lib/utils/retry";
import { pLimit } from "@/lib/utils/concurrency";
import { logGeneration } from "@/lib/ai/log";

export const EMBEDDING_MODEL = "gemini-embedding-001";
// Must match the vector(768) column on document_chunks.
export const EMBEDDING_DIMENSIONS = 768;

// Document chunks and search questions are embedded with different task types.
export type EmbeddingTaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

// Texts sent per embedContent request, and how many requests run at once.
const EMBED_BATCH_SIZE = 25;
const EMBED_CONCURRENCY = 5;

/**
 * Scales a vector to length 1. gemini-embedding-001 only returns unit-length
 * vectors at its full size; anything cut down with outputDimensionality has to
 * be normalized by the caller.
 */
export function l2Normalize(values: number[]): number[] {
  let sumOfSquares = 0;
  for (const v of values) sumOfSquares += v * v;
  const norm = Math.sqrt(sumOfSquares);
  if (norm === 0) return values;
  return values.map((v) => v / norm);
}

async function embedBatch(
  texts: string[],
  taskType: EmbeddingTaskType,
  userId?: string | null
): Promise<(number[] | null)[]> {
  const startedAt = Date.now();
  try {
    const ai = getGenAI();
    const response = await withRetry(() =>
      ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: texts,
        config: { taskType, outputDimensionality: EMBEDDING_DIMENSIONS },
      })
    );

    const embeddings = response.embeddings ?? [];
    if (embeddings.length !== texts.length) {
      throw new Error(
        `Expected ${texts.length} embeddings from ${EMBEDDING_MODEL}, got ${embeddings.length}`
      );
    }

    const vectors = embeddings.map((e) => {
      if (!e.values || e.values.length !== EMBEDDING_DIMENSIONS) {
        throw new Error(
          `Expected ${EMBEDDING_DIMENSIONS} dimensions from ${EMBEDDING_MODEL}, got ${e.values?.length ?? 0}`
        );
      }
      return l2Normalize(e.values);
    });

    await logGeneration({
      step: "embedding",
      model: EMBEDDING_MODEL,
      userId,
      durationMs: Date.now() - startedAt,
      success: true,
    });
    return vectors;
  } catch (err) {
    logWarn(`Embedding request failed (${EMBEDDING_MODEL}, ${texts.length} texts)`, {
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    await logGeneration({
      step: "embedding",
      model: EMBEDDING_MODEL,
      userId,
      durationMs: Date.now() - startedAt,
      success: false,
      errorType: "api_error",
    });
    return texts.map(() => null);
  }
}

/**
 * Embeds many texts. Returns one entry per input, in order; an entry is null
 * when the text is empty or its request failed (the failure is logged).
 * Texts go to Gemini in batches.
 */
export async function embedTexts(
  texts: string[],
  taskType: EmbeddingTaskType,
  options: { userId?: string | null } = {}
): Promise<(number[] | null)[]> {
  const results: (number[] | null)[] = texts.map(() => null);
  const wanted = texts.flatMap((text, i) => (text && text.trim().length > 0 ? [i] : []));
  if (wanted.length === 0) return results;

  const batches: number[][] = [];
  for (let i = 0; i < wanted.length; i += EMBED_BATCH_SIZE) {
    batches.push(wanted.slice(i, i + EMBED_BATCH_SIZE));
  }

  const limit = pLimit(EMBED_CONCURRENCY);
  await Promise.all(
    batches.map((batch) =>
      limit(async () => {
        const vectors = await embedBatch(
          batch.map((i) => texts[i]),
          taskType,
          options.userId
        );
        batch.forEach((textIndex, j) => {
          results[textIndex] = vectors[j];
        });
      })
    )
  );

  return results;
}

/**
 * Embeds one text. Returns null (after logging a warning) if it could not be embedded.
 */
export async function getEmbeddingVector(
  text: string,
  taskType: EmbeddingTaskType,
  options: { userId?: string | null } = {}
): Promise<number[] | null> {
  const [vector] = await embedTexts([text], taskType, options);
  return vector ?? null;
}
