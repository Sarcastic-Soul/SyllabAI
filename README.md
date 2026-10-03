# SyllabAI

**SyllabAI** is an AI-powered educational platform that automatically generates structured courses, quizzes, cheat sheets, and flashcards from any topic string or uploaded document (`.pdf`, `.txt`, `.md`, `.csv`, `.json`).

Built with Next.js 16 (App Router, Node.js Serverless runtime), Neon PostgreSQL (`pgvector`), and Google Gemini AI, SyllabAI turns a topic or an uploaded document into a course with lessons, quizzes, flashcards and a Study Buddy chat that can search the uploaded document. It also has SM-2 spaced repetition, public course sharing, and a per-call log of every AI request.

---

## 🏗️ System Architecture

```
Browser
  │  POST /api/generate/topic | /api/generate/pdf   (one request, waits for the result)
  ▼
Next.js route handler (Node.js runtime, maxDuration 300)
  │
  ├─ Google Gemini ........ gemini-3.8-flash / gemini-3.5-flash-lite (text and JSON)
  │                         gemini-embedding-001 (768-dim vectors)
  └─ Neon PostgreSQL ...... courses, chapters, quizzes, flashcards, events,
                            document_chunks (pgvector + full-text), generation_logs
```

All Gemini text and JSON calls go through one helper, `lib/ai/generate.ts`. Document search goes through `lib/retrieval.ts`.

---

## 🚀 Key Features

- **Serverless**: runs on the Vercel Node.js runtime (`export const runtime = "nodejs"`, `maxDuration = 300`) with no background workers. Course generation is one request; the client shows a simulated progress animation while it waits.
- **Unified Multi-Format Course Creation**: Generate full courses from a topic title or upload documents (`.pdf`, `.txt`, `.md`, `.csv`, `.json`) with a 4 MB upload limit (Vercel rejects request bodies over 4.5 MB) and a 100,000 character cap.
- **Document search (RAG)**: uploaded documents are split into chunks of about 1,000 characters (150 overlap) and embedded with `gemini-embedding-001` at 768 dimensions (`outputDimensionality: 768`, L2-normalized, task types `RETRIEVAL_DOCUMENT` for chunks and `RETRIEVAL_QUERY` for questions). Lessons and Study Buddy answers use hybrid search: pgvector cosine similarity plus Postgres full-text search, merged with reciprocal rank fusion in one SQL statement (full-text matches count half as much as vector matches). On the small eval set in `eval/` hybrid and vector-only score about the same on recall@1 and MRR; hybrid found the answer in the top 5 for every question.
- **Schema-checked AI output**: syllabus, quiz and flashcard generations ask Gemini for structured JSON, check the reply with Zod, and retry once with the error message if the reply is invalid.
- **Per-call log**: every AI call writes a row to `generation_logs` (step, model, tokens, duration, success, error type, repaired). `/admin/stats` shows calls, tokens, p50/p95 duration and invalid-output rates per step. The daily quota counter per model is a count over the same table.
- **Model fallback**: automatic fallback from `gemini-3.8-flash` to `gemini-3.5-flash-lite` when the daily quota counter gets close to its limit.
- **Public Course Sharing**: Courses can be made public and shared via unique public links (`/shared/[id]`), accessible to guests without forcing authentication.
- **Interactive Mermaid Diagrams & Export**: Chapter concepts feature automatically rendered Mermaid architecture/flowchart diagrams with top-right PNG download export controls.
- **SM-2 Adaptive Difficulty Engine**: Analyzes spaced repetition recall metrics (`easeFactor`, `interval`, `nextReviewAt`) to compute retention mastery scores and automatically adjust quiz difficulty.
- **Admin Analytics Dashboard**: Platform analytics viewable at `/admin` (Course directory) and `/admin/stats` (Recharts interactive charts for DAU, daily course volume, quiz score distributions, and system event telemetry).
- **Structured JSON Logging**: Zero-overhead Pino logger writing structured JSON to `stdout` for automatic ingestion into the Vercel Dashboard.

---

## 🧠 Engineering Decisions & Tradeoffs

### 1. Pure Serverless Execution over Persistent Worker Queues
- **Decision**: Replaced BullMQ workers with synchronous serverless handlers running within Vercel's 300-second Node.js execution limit.
- **Tradeoff**: Eliminates the need to host and maintain long-lived background server processes, enabling 100% free-tier deployment on Vercel.

### 2. Transactional Rollback Safeguards on Partial Failures
- **Decision**: Implemented automatic database deletion cleanup (`db.delete(courses)`) in generation handlers if errors occur mid-generation.
- **Tradeoff**: Guarantees atomic database state and prevents half-created orphan courses from remaining in limbo if external API failures occur.

### 3. One Request per Course, No Progress Stream
- **Decision**: The generation routes do all the work in one request and return the new course id. An earlier SSE progress route was removed because nothing on the client read it.
- **Tradeoff**: Less code and no progress state to store, but the progress bar on the client is an animation, not a report of real progress.

### 4. No Redis
- **Decision**: Upstash Redis was removed. It held a per-user rate limit, a syllabus cache, an embedding cache and the daily quota counters. The quota counters now come from a count over `generation_logs` in Postgres; the caches and the per-user rate limit are gone.
- **Tradeoff**: One less service to run. Repeating the same topic calls Gemini again, and the only request limits left are the daily quota check and Gemini's own limits on the API key.

---

## 🚧 Known Scaling Boundaries & Free-Tier Limits

1. **Vercel Serverless Duration**: Handlers configured with `maxDuration = 300` (5 minutes max per invocation). Uploaded documents are capped at **4 MB** and **100,000 characters**.
2. **Neon PostgreSQL Free Tier**: Capped at **0.5 GiB** storage with compute autosuspension.
3. **Google Gemini Free Tier Limits**:
   - **Gemini 3.8 Flash**: 5 RPM / 20 RPD *(Primary course generation)*.
   - **Gemini 3.5 Flash Lite**: 15 RPM / 500 RPD *(Smart fallback, quizzes, flashcards, & Study Buddy chat)*.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, Node.js Serverless runtime), React 19, TailwindCSS v4, Radix UI
- **AI & RAG**: Google Gemini via `@google/genai` (`gemini-3.8-flash`, `gemini-3.5-flash-lite`, `gemini-embedding-001`), Zod for output checks, `unpdf` for PDF text
- **Database**: PostgreSQL (Neon), `pgvector` (HNSW index), full-text search (`tsvector` + GIN index), Drizzle ORM
- **Analytics & Logging**: Pino (Structured JSON logging), Recharts (Interactive charts)
- **Authentication**: Clerk Auth

---

## 🚦 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/Sarcastic-Soul/SyllabAI.git
cd SyllabAI
```

### 2. Install dependencies
```bash
pnpm install
```

### 3. Set up environment variables
Copy `.env.example` to `.env.local` and fill in your credentials:
```bash
cp .env.example .env.local
```
Ensure your `.env.local` contains:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` & `CLERK_SECRET_KEY`
- `DATABASE_URL` (Neon PostgreSQL connection string)
- `GEMINI_API_KEY` (Google Gemini API key)

### 4. Set Up the Database
```bash
node enable-vector.ts    # new database only: turns on the pgvector extension
pnpm run db:migrate      # applies the SQL files in lib/db/migrations
```
If your database was first set up with `pnpm run db:push`, keep using `db:push`, or run the newest file in `lib/db/migrations` by hand (it only uses `IF NOT EXISTS` statements).

Documents uploaded before the move to `gemini-embedding-001` have no usable vectors (the old embedding models were shut down). Upload them again to make them searchable.

### 5. Start Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Project Scripts

- `pnpm dev` – Starts development server with Turbopack.
- `pnpm build` – Builds production bundle.
- `pnpm start` – Starts production server.
- `pnpm test` – Runs unit tests using Vitest.
- `pnpm typecheck` / `pnpm lint` – TypeScript and ESLint checks.
- `pnpm run db:generate` / `pnpm run db:migrate` – Writes and applies SQL migrations.
- `pnpm eval` – Runs the retrieval eval (see below).
- `pnpm run db:push` – Pushes schema changes directly to PostgreSQL.

---

## Retrieval Eval

`eval/` holds a small test of document search: four sample documents (`eval/docs`), 72 questions with the text that a correct chunk must contain (`eval/questions.json`), and a runner (`eval/run.ts`).

```bash
EVAL_DATABASE_URL=postgres://... pnpm eval
```

- `EVAL_DATABASE_URL` is required. Best is a separate database or Neon branch with pgvector and the migrations applied. With only one database, pass `--allow-app-db` and point it at the same URL: `EVAL_DATABASE_URL="$DATABASE_URL" pnpm eval --allow-app-db`. The script writes temporary rows and deletes them at the end.
- It creates temporary courses, chunks the documents at 4,000 and 1,000 characters, embeds them with the app's embedding function, runs every question through `lib/retrieval.ts` in `vector` and `hybrid` mode, and deletes its rows when done.
- It writes recall@1, recall@5 and MRR to `eval/RESULTS.md`. The checked-in file is from a real run on 2026-10-03.
- It needs `GEMINI_API_KEY` and makes a handful of batched embedding requests. `pnpm eval --help` lists the options.
