# SyllabAI

**SyllabAI** is an AI-powered educational platform that automatically generates structured courses, quizzes, cheat sheets, and flashcards from any topic string or uploaded document (`.pdf`, `.txt`, `.md`, `.csv`, `.json`).

Built with Next.js 16 (App Router, Node.js Serverless runtime), Upstash Redis, Neon PostgreSQL (`pgvector`), and Google Gemini AI, SyllabAI converts raw text and documents into interactive learning journeys with real-time SSE progress streaming, SM-2 adaptive mastery insights, public course sharing, and structured telemetry logging.

---

## 🏗️ System Architecture

```
                                  ┌────────────────────────┐
                                  │   Browser Client (UI)  │
                                  └───────────┬────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │ (POST /api/generate/..) │ (GET EventSource SSE)   │
                    ▼                         ▼                         │
          ┌───────────────────┐     ┌─────────────────────┐              │
          │ Next.js Serverless│     │ SSE Progress Route  │              │
          │ Node.js Runtime   │     │ (/api/generate/...) │              │
          │ (maxDuration: 300)│     └──────────▲──────────┘              │
          └─────────┬─────────┘                │                         │
                    │                          │                         │
                    │ (Sync Execution &        │                         │
                    │  Progress Snapshots)     │                         │
                    ▼                          │                         │
          ┌───────────────────┐                │                         │
          │ Upstash Redis     ├────────────────┘                         │
          │ (Cache & Progress)│                                          │
          └─────────┬─────────┘                                          │
                    │                                                    │
       (Syllabus)   │     (Embeddings & RAG Vector)                      │
                    ▼     ▼                                              │
    ┌──────────────────────┐      ┌─────────────────────────────┐        │
    │ Google Gemini AI     │      │ Neon PostgreSQL (pgvector)  │        │
    │ (3.6-Flash / 3.5)     │      │ (Courses, Chapters, Events) │        │
    └──────────────────────┘      └─────────────────────────────┘        │
                                                │                        │
                                                ▼                        ▼
                                   ┌──────────────────────────────────────┐
                                   │ Pino Structured JSON Logs (stdout)  │
                                   │ -> Ingested by Vercel Dashboard      │
                                   └──────────────────────────────────────┘
```

---

## 🚀 Key Features

- **Serverless Architecture & Real-Time Progress**: 100% serverless execution on Vercel Node.js runtime (`export const runtime = "nodejs"`, `maxDuration = 300`) with zero persistent processes or workers. Live percentage and step updates streamed via browser-native `EventSource`.
- **Unified Multi-Format Course Creation**: Generate full courses from a topic title or upload documents (`.pdf`, `.txt`, `.md`, `.csv`, `.json`) with 5MB upload safeguards and character length caps to preserve CPU/memory budgets.
- **RAG & Smart Model Fallbacks**: Document embeddings generated with automatic model fallback (`text-embedding-004` -> `embedding-001`). Automatic Gemini model fallback (`gemini-3.6-flash` -> `gemini-3.5-flash-lite`) when approaching daily quota limits.
- **Public Course Sharing**: Courses can be made public and shared via unique public links (`/shared/[id]`), accessible to guests without forcing authentication.
- **Interactive Mermaid Diagrams & Export**: Chapter concepts feature automatically rendered Mermaid architecture/flowchart diagrams with top-right PNG download export controls.
- **Intelligent Response & Embedding Cache**: Upstash Redis caching layer stores repeated Gemini course syllabi and vector chunk embeddings for sub-second demo loads.
- **SM-2 Adaptive Difficulty Engine**: Analyzes spaced repetition recall metrics (`easeFactor`, `interval`, `nextReviewAt`) to compute retention mastery scores and automatically adjust quiz difficulty.
- **Admin Analytics Dashboard**: Platform analytics viewable at `/admin` (Course directory) and `/admin/stats` (Recharts interactive charts for DAU, daily course volume, quiz score distributions, and system event telemetry).
- **Structured JSON Logging**: Zero-overhead Pino logger writing structured JSON to `stdout` for automatic ingestion into the Vercel Dashboard.

---

## 🧠 Engineering Decisions & Tradeoffs

### 1. Pure Serverless Execution over Persistent Worker Queues
- **Decision**: Replaced BullMQ workers with synchronous serverless handlers running within Vercel's 300-second Node.js execution limit, writing live progress updates to Upstash Redis.
- **Tradeoff**: Eliminates the need to host and maintain long-lived background server processes, enabling 100% free-tier deployment on Vercel.

### 2. Transactional Rollback Safeguards on Partial Failures
- **Decision**: Implemented automatic database deletion cleanup (`db.delete(courses)`) in generation handlers if errors occur mid-generation.
- **Tradeoff**: Guarantees atomic database state and prevents half-created orphan courses from remaining in limbo if external API failures occur.

### 3. Server-Sent Events (SSE) over WebSockets
- **Decision**: Used Next.js `ReadableStream` route handlers and browser-native `EventSource` rather than WebSockets or third-party realtime SaaS.
- **Tradeoff**: SSE is unidirectional (Server -> Client), which fits job progress tracking perfectly without maintaining persistent bidirectional WebSocket connections.

### 4. Upstash Redis Protocol with Resilient Memory Fallback
- **Decision**: Configured Upstash Redis with an automatic in-memory TTL Map fallback.
- **Tradeoff**: Ensures 100% application uptime during local development, testing, or temporary Redis network hiccups without crashing server actions.

---

## 🚧 Known Scaling Boundaries & Free-Tier Limits

1. **Vercel Serverless Duration**: Handlers configured with `maxDuration = 300` (5 minutes max per invocation). Uploaded documents are capped at **5MB** and **100,000 characters**.
2. **Upstash Redis Free Tier**: Capped at **10,000 commands/day** and 256MB memory with in-memory TTL fallback.
3. **Neon PostgreSQL Free Tier**: Capped at **0.5 GiB** storage with compute autosuspension.
4. **Google Gemini Free Tier Limits**:
   - **Gemini 3.6 Flash**: 5 RPM / 20 RPD *(Primary course generation)*.
   - **Gemini 3.5 Flash Lite**: 15 RPM / 500 RPD *(Smart fallback, quizzes, flashcards, & Study Buddy chat)*.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, Node.js Serverless runtime), React 19, TailwindCSS v4, Radix UI
- **Cache & Real-Time**: Upstash Redis (`@upstash/redis`, `ioredis`), Server-Sent Events (`EventSource`)
- **AI & RAG**: Google Gemini AI (`gemini-3.6-flash`, `gemini-3.5-flash-lite`), `text-embedding-004` / `embedding-001`, `pdf-parse`
- **Database**: PostgreSQL (Neon), `pgvector` (HNSW Index), Drizzle ORM
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
- `REDIS_URL` or `UPSTASH_REDIS_URL` (Upstash Redis connection string `rediss://...`)

### 4. Push Database Schema & Enable Vector Support
```bash
node enable-vector.js
pnpm run db:push
```

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
- `pnpm test` – Runs unit tests using Vitest (`lib/redis.test.ts`, `lib/adaptive.test.ts`, etc.).
- `pnpm run db:push` – Pushes schema changes directly to PostgreSQL.
