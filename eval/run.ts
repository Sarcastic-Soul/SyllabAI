// Retrieval eval: measures how often lib/retrieval.ts finds the passage that
// answers a question, for vector vs hybrid search and for two chunk sizes.
//
// Run with `pnpm eval`. See `pnpm eval --help`.
//
// Kept to TypeScript that Node can run by stripping types (no enums etc.),
// and app modules are loaded with dynamic imports AFTER the environment has
// been pointed at the eval database.

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const HELP = `Retrieval eval for SyllabAI

Usage:
  EVAL_DATABASE_URL=postgres://... pnpm eval [-- --top-k 5]

What it does:
  1. Creates one temporary course per chunk size (4000 and 1000 characters),
     holding the sample documents in eval/docs, chunked with the app's chunker
     and embedded with the app's embedding function.
  2. Runs every question in eval/questions.json through lib/retrieval.ts in
     "vector" and "hybrid" mode.
  3. Counts a hit when a returned chunk comes from the right document and
     contains the question's "answer" text.
  4. Writes recall@1, recall@k and MRR to eval/RESULTS.md.
  5. Deletes its temporary rows, even if a step fails.

Environment:
  EVAL_DATABASE_URL  Required. A Postgres database with pgvector and the
                     Drizzle migrations applied. Use a separate database or a
                     Neon branch. The script never uses DATABASE_URL and stops
                     if both point at the same database.
  GEMINI_API_KEY     Required. Read from the environment, .env.local or .env.

Options:
  --top-k <n>   How many chunks to retrieve per question (default 5).
  --allow-app-db  Allow EVAL_DATABASE_URL to be the same database as DATABASE_URL.
  --help        Show this text.

Cost: about 70 document chunks and 72 questions are embedded once, in a
handful of batched Gemini embedding requests. No text generation calls are made.
`;

type QuestionType = "keyword" | "paraphrase";

interface EvalQuestion {
  id: string;
  doc: string;
  type: QuestionType;
  question: string;
  answer: string;
}

type Mode = "vector" | "hybrid";

interface RunResult {
  chunkSize: number;
  overlap: number;
  mode: Mode;
  chunkCount: number;
  /** 1-based rank of the first hit per question id, or null for a miss. */
  ranks: Map<string, number | null>;
}

const CHUNK_SETTINGS = [
  { chunkSize: 4000, overlap: 200 },
  { chunkSize: 1000, overlap: 150 },
];
const MODES: Mode[] = ["vector", "hybrid"];
const EVAL_USER_ID = "retrieval-eval";
const INSERT_BATCH_SIZE = 50;

const evalDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(evalDir, "..");

function parseArgs(argv: string[]): { help: boolean; topK: number } {
  let help = false;
  let topK = 5;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      help = true;
    } else if (arg === "--top-k") {
      topK = Number(argv[++i]);
      if (!Number.isInteger(topK) || topK < 1 || topK > 20) {
        throw new Error("--top-k must be a whole number from 1 to 20");
      }
    } else if (arg !== "--" && arg !== "--allow-app-db") {
      throw new Error(`Unknown option: ${arg}\n\n${HELP}`);
    }
  }
  return { help, topK };
}

/** Same database if host and database name match, whatever the user or query string. */
function sameDatabase(a: string, b: string): boolean {
  try {
    const ua = new URL(a);
    const ub = new URL(b);
    // Neon pooled and direct hosts differ only by a "-pooler" suffix.
    const host = (u: URL) => u.hostname.replace("-pooler", "");
    return host(ua) === host(ub) && ua.pathname === ub.pathname;
  } catch {
    return a === b;
  }
}

function setUpEnvironment(): void {
  loadEnv({ path: path.join(repoRoot, ".env.local"), quiet: true });
  loadEnv({ path: path.join(repoRoot, ".env"), quiet: true });

  const evalUrl = process.env.EVAL_DATABASE_URL?.trim();
  if (!evalUrl) {
    throw new Error(
      "EVAL_DATABASE_URL is not set. The eval writes temporary rows, so it only runs against a database you name for it. It never falls back to DATABASE_URL."
    );
  }

  const appUrl = process.env.DATABASE_URL?.trim();
  if (appUrl && sameDatabase(appUrl, evalUrl) && !process.argv.includes("--allow-app-db")) {
    throw new Error(
      "EVAL_DATABASE_URL points at the same database as DATABASE_URL. Use a separate database or a Neon branch, or pass --allow-app-db to run against the app database (the eval only touches its own temporary rows)."
    );
  }

  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set (needed to embed the chunks and questions).");
  }

  // Every app module reads DATABASE_URL, so from here on this process can only
  // reach the eval database.
  process.env.DATABASE_URL = evalUrl;

  process.env.LOG_LEVEL ??= "warn";
}

function loadQuestions(): EvalQuestion[] {
  const raw = JSON.parse(readFileSync(path.join(evalDir, "questions.json"), "utf-8")) as EvalQuestion[];
  for (const q of raw) {
    const text = readFileSync(path.join(evalDir, "docs", `${q.doc}.md`), "utf-8");
    if (!text.toLowerCase().includes(q.answer.toLowerCase())) {
      throw new Error(`questions.json: answer for ${q.id} does not appear in docs/${q.doc}.md`);
    }
  }
  return raw;
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function metrics(questions: EvalQuestion[], ranks: Map<string, number | null>, topK: number) {
  let hitsAt1 = 0;
  let hitsAtK = 0;
  let reciprocalSum = 0;
  for (const q of questions) {
    const rank = ranks.get(q.id) ?? null;
    if (rank !== null && rank <= topK) {
      hitsAtK++;
      reciprocalSum += 1 / rank;
      if (rank === 1) hitsAt1++;
    }
  }
  const n = questions.length || 1;
  return { recallAt1: hitsAt1 / n, recallAtK: hitsAtK / n, mrr: reciprocalSum / n };
}

function buildReport(
  results: RunResult[],
  questions: EvalQuestion[],
  topK: number,
  embeddingModel: string
): string {
  const lines: string[] = [];
  const subsets: { label: string; items: EvalQuestion[] }[] = [
    { label: "All questions", items: questions },
    { label: "Keyword questions", items: questions.filter((q) => q.type === "keyword") },
    { label: "Paraphrased questions", items: questions.filter((q) => q.type === "paraphrase") },
  ];

  lines.push("# Retrieval eval results", "");
  lines.push(`- Run at: ${new Date().toISOString()}`);
  lines.push(`- Embedding model: ${embeddingModel}`);
  lines.push(`- Documents: ${new Set(questions.map((q) => q.doc)).size}, all in one course per chunk size`);
  lines.push(`- Questions: ${questions.length}`);
  lines.push(`- Chunks retrieved per question (k): ${topK}`);
  lines.push("");

  for (const subset of subsets) {
    lines.push(`## ${subset.label} (${subset.items.length})`, "");
    lines.push(`| Chunk size | Overlap | Chunks | Mode | recall@1 | recall@${topK} | MRR |`);
    lines.push("| ---: | ---: | ---: | --- | ---: | ---: | ---: |");
    for (const r of results) {
      const m = metrics(subset.items, r.ranks, topK);
      lines.push(
        `| ${r.chunkSize} | ${r.overlap} | ${r.chunkCount} | ${r.mode} | ${percent(m.recallAt1)} | ${percent(m.recallAtK)} | ${m.mrr.toFixed(3)} |`
      );
    }
    lines.push("");
  }

  lines.push("## How to read this", "");
  lines.push(
    "- A hit means a returned chunk is from the right document and contains the answer text from `eval/questions.json`."
  );
  lines.push(
    "- Bigger chunks hold more text, so they contain the answer more easily; with few chunks in total, recall@k is close to its ceiling. Compare recall@1 and MRR across modes at the same chunk size first."
  );
  lines.push(
    "- The corpus is small (four documents). The numbers show direction, not what to expect on large uploads."
  );
  lines.push("");

  const misses = results
    .map((r) => ({
      r,
      missed: questions.filter((q) => (r.ranks.get(q.id) ?? null) === null).map((q) => q.id),
    }))
    .filter((x) => x.missed.length > 0);
  if (misses.length > 0) {
    lines.push("## Misses", "");
    for (const { r, missed } of misses) {
      lines.push(`- chunk size ${r.chunkSize}, ${r.mode}: ${missed.join(", ")}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(HELP);
    return;
  }

  setUpEnvironment();
  const questions = loadQuestions();
  const docNames = [...new Set(questions.map((q) => q.doc))];

  const { db } = await import("@/lib/db");
  const schema = await import("@/lib/db/schema");
  const { eq, inArray, sql } = await import("drizzle-orm");
  const { chunkText } = await import("@/lib/utils/chunker");
  const { embedTexts, EMBEDDING_MODEL } = await import("@/lib/ai/embeddings");
  const { retrieveChunks } = await import("@/lib/retrieval");

  const columnCheck = await db.execute(sql`
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'document_chunks' AND column_name = 'content_tsv'
  `);
  if (columnCheck.rows.length === 0) {
    throw new Error(
      "The eval database has no document_chunks.content_tsv column. Apply the migrations in lib/db/migrations to it first."
    );
  }

  const createdCourseIds: string[] = [];
  const results: RunResult[] = [];

  try {
    // Embed all questions up front in a few batched requests. The vectors land
    // in the in-memory cache, so the retrieval calls below make no API calls.
    console.log(`Embedding ${questions.length} questions...`);
    const questionVectors = await embedTexts(
      questions.map((q) => q.question),
      "RETRIEVAL_QUERY",
      { userId: EVAL_USER_ID }
    );
    if (questionVectors.some((v) => v === null)) {
      throw new Error("Some questions could not be embedded; see the warnings above.");
    }

    for (const { chunkSize, overlap } of CHUNK_SETTINGS) {
      const [course] = await db
        .insert(schema.courses)
        .values({
          author: EVAL_USER_ID,
          topic: `[retrieval eval] chunk size ${chunkSize}`,
          duration: 1,
          difficulty: "Intermediate",
        })
        .returning();
      createdCourseIds.push(course.id);

      const documentIdByName = new Map<string, string>();
      let chunkCount = 0;

      for (const name of docNames) {
        const text = readFileSync(path.join(evalDir, "docs", `${name}.md`), "utf-8");
        const [doc] = await db
          .insert(schema.documents)
          .values({ courseId: course.id, filename: `${name}.md` })
          .returning();
        documentIdByName.set(name, doc.id);

        const chunks = chunkText(text, chunkSize, overlap);
        const vectors = await embedTexts(chunks, "RETRIEVAL_DOCUMENT", { userId: EVAL_USER_ID });
        const rows = chunks.map((content, i) => {
          const embedding = vectors[i];
          if (!embedding) throw new Error(`A chunk of ${name}.md could not be embedded.`);
          return { documentId: doc.id, content, embedding };
        });
        for (let i = 0; i < rows.length; i += INSERT_BATCH_SIZE) {
          await db.insert(schema.documentChunks).values(rows.slice(i, i + INSERT_BATCH_SIZE));
        }
        chunkCount += rows.length;
      }
      console.log(`Chunk size ${chunkSize}: stored ${chunkCount} chunks.`);

      for (const mode of MODES) {
        const ranks = new Map<string, number | null>();
        for (const q of questions) {
          const retrieved = await retrieveChunks({
            courseId: course.id,
            query: q.question,
            limit: args.topK,
            mode,
            userId: EVAL_USER_ID,
          });
          const wantedDocumentId = documentIdByName.get(q.doc);
          const index = retrieved.findIndex(
            (c) =>
              c.documentId === wantedDocumentId &&
              c.content.toLowerCase().includes(q.answer.toLowerCase())
          );
          ranks.set(q.id, index === -1 ? null : index + 1);
        }
        const m = metrics(questions, ranks, args.topK);
        console.log(
          `  ${mode.padEnd(6)} recall@1 ${percent(m.recallAt1)}  recall@${args.topK} ${percent(m.recallAtK)}  MRR ${m.mrr.toFixed(3)}`
        );
        results.push({ chunkSize, overlap, mode, chunkCount, ranks });
      }
    }

    const reportPath = path.join(evalDir, "RESULTS.md");
    writeFileSync(reportPath, buildReport(results, questions, args.topK, EMBEDDING_MODEL));
    console.log(`Wrote ${path.relative(repoRoot, reportPath)}`);
  } finally {
    // Deleting the courses also removes their documents and chunks (ON DELETE CASCADE).
    try {
      if (createdCourseIds.length > 0) {
        await db.delete(schema.courses).where(inArray(schema.courses.id, createdCourseIds));
      }
      await db.delete(schema.generationLogs).where(eq(schema.generationLogs.userId, EVAL_USER_ID));
      console.log("Removed temporary eval rows.");
    } catch (cleanupErr) {
      console.error(
        `Cleanup failed. Delete courses with author '${EVAL_USER_ID}' and generation_logs rows with user_id '${EVAL_USER_ID}' by hand.`,
        cleanupErr
      );
    }
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
