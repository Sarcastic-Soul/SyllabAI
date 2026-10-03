import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { getEmbeddingVector } from "@/lib/ai/embeddings";

export type RetrievalMode = "vector" | "hybrid";

export interface RetrievedChunk {
  id: string;
  documentId: string;
  content: string;
  /** Vector mode: cosine similarity. Hybrid mode: reciprocal rank fusion score. */
  score: number;
  /** 1-based rank in the vector list, or null if the chunk was not in it. */
  vectorRank: number | null;
  /** 1-based rank in the full-text list, or null if the chunk was not in it. */
  textRank: number | null;
}

export interface RetrieveOptions {
  courseId: string;
  query: string;
  /** How many chunks to return. */
  limit?: number;
  mode?: RetrievalMode;
  userId?: string | null;
}

// Standard constant for reciprocal rank fusion: score = sum of 1 / (k + rank).
const RRF_K = 60;
// Full-text matches count for less than vector matches. With equal weights the
// eval (eval/RESULTS.md) showed full-text pushing the right chunk off the top spot.
const TEXT_WEIGHT = 0.5;
// How many chunks each of the two searches hands to the fusion step.
const CANDIDATES_PER_SEARCH = 20;

type ChunkRow = {
  id: string;
  document_id: string;
  content: string;
  score: number | string;
  vector_rank: number | string | null;
  text_rank: number | string | null;
};

function toNumberOrNull(value: number | string | null): number | null {
  return value === null ? null : Number(value);
}

/**
 * Finds the chunks of a course's uploaded documents that best match the query.
 * - "vector": pgvector cosine distance only.
 * - "hybrid" (default): cosine top-N plus Postgres full-text top-N, merged with
 *   reciprocal rank fusion in one SQL statement.
 * If the query cannot be embedded, hybrid mode still returns full-text matches
 * and vector mode returns nothing.
 */
export async function retrieveChunks(options: RetrieveOptions): Promise<RetrievedChunk[]> {
  const { courseId, userId } = options;
  const mode = options.mode ?? "hybrid";
  const limit = options.limit ?? 5;
  const query = options.query.trim();
  if (query.length === 0) return [];

  const queryVector = await getEmbeddingVector(query, "RETRIEVAL_QUERY", { userId });
  if (!queryVector && mode === "vector") return [];

  const vectorParam = queryVector ? JSON.stringify(queryVector) : null;
  const candidates = Math.max(CANDIDATES_PER_SEARCH, limit);
  const rrfK = sql.raw(String(RRF_K));
  const textWeight = sql.raw(String(TEXT_WEIGHT));

  // websearch_to_tsquery joins the words of the question with AND, so a chunk
  // would have to contain every word to match. Questions are full sentences,
  // so the ANDs are turned into ORs and ts_rank_cd sorts out which chunk has
  // the most (and closest) matching words.
  const result =
    mode === "vector"
      ? await db.execute(sql`
          SELECT
            dc.id,
            dc.document_id,
            dc.content,
            1 - (dc.embedding <=> ${vectorParam}::vector) AS score,
            row_number() OVER (ORDER BY dc.embedding <=> ${vectorParam}::vector) AS vector_rank,
            NULL::bigint AS text_rank
          FROM document_chunks dc
          JOIN documents d ON d.id = dc.document_id
          WHERE d.course_id = ${courseId} AND dc.embedding IS NOT NULL
          ORDER BY dc.embedding <=> ${vectorParam}::vector
          LIMIT ${limit}
        `)
      : await db.execute(sql`
          WITH scoped AS (
            SELECT dc.id, dc.document_id, dc.content, dc.embedding, dc.content_tsv
            FROM document_chunks dc
            JOIN documents d ON d.id = dc.document_id
            WHERE d.course_id = ${courseId}
          ),
          q AS (
            SELECT replace(websearch_to_tsquery('english', ${query})::text, '&', '|')::tsquery AS tsq
          ),
          vec AS (
            SELECT id, row_number() OVER (ORDER BY embedding <=> ${vectorParam}::vector) AS rank
            FROM scoped
            WHERE ${vectorParam}::vector IS NOT NULL AND embedding IS NOT NULL
            ORDER BY embedding <=> ${vectorParam}::vector
            LIMIT ${candidates}
          ),
          fts AS (
            SELECT scoped.id, row_number() OVER (ORDER BY ts_rank_cd(scoped.content_tsv, q.tsq) DESC, scoped.id) AS rank
            FROM scoped, q
            WHERE scoped.content_tsv @@ q.tsq
            ORDER BY ts_rank_cd(scoped.content_tsv, q.tsq) DESC, scoped.id
            LIMIT ${candidates}
          )
          SELECT
            scoped.id,
            scoped.document_id,
            scoped.content,
            COALESCE(1.0 / (${rrfK} + vec.rank), 0) + ${textWeight} * COALESCE(1.0 / (${rrfK} + fts.rank), 0) AS score,
            vec.rank AS vector_rank,
            fts.rank AS text_rank
          FROM vec
          FULL OUTER JOIN fts ON fts.id = vec.id
          JOIN scoped ON scoped.id = COALESCE(vec.id, fts.id)
          ORDER BY score DESC, vec.rank NULLS LAST, scoped.id
          LIMIT ${limit}
        `);

  return (result.rows as ChunkRow[]).map((row) => ({
    id: row.id,
    documentId: row.document_id,
    content: row.content,
    score: Number(row.score),
    vectorRank: toNumberOrNull(row.vector_rank),
    textRank: toNumberOrNull(row.text_rank),
  }));
}
