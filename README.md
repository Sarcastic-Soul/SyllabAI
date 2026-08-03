# SyllabAI

**SyllabAI** is an AI-powered educational platform that automatically generates structured courses, quizzes, and flashcards from any topic or an uploaded PDF document.

Built with Next.js (App Router), Upstash Redis, BullMQ, Neon PostgreSQL (`pgvector`), and Google Gemini AI, SyllabAI converts raw text and documents into interactive learning journeys with real-time SSE progress streaming, SM-2 adaptive mastery insights, and structured telemetry logging.

---

## 🏗️ System Architecture

```
                                  ┌────────────────────────┐
                                  │   Browser Client (UI)  │
                                  └───────────┬────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │ (POST /api/generate)    │ (GET EventSource SSE)   │
                    ▼                         ▼                         │
         ┌───────────────────┐     ┌─────────────────────┐              │
         │ Next.js Route     │     │ SSE Progress Route  │              │
         │ (App Router)      │     │ (/api/generate/...) │              │
         └──────────┬────────┘     └──────────▲──────────┘              │
                    │                         │                         │
                    ▼                         │                         │
         ┌───────────────────┐                │                         │
         │ BullMQ Queue      ├────────────────┘                         │
         │ (Upstash Redis)   │ (Job Progress Snapshots)                 │
         └──────────┬────────┘                                          │
                    │                                                   │
                    ▼                                                   │
         ┌───────────────────┐                                          │
         │ Background Worker │                                          │
         └──────┬─────┬──────┘                                          │
                │     │                                                 │
    (Syllabus)  │     │ (Embeddings & RAG Vector)                       │
                ▼     ▼                                                 │
   ┌──────────────────────┐      ┌─────────────────────────────┐        │
   │ Google Gemini API    │      │ Neon PostgreSQL (pgvector)  │        │
   │ (3.6-Flash / 3.5)    │      │ (Courses, Chapters, Events) │        │
   └──────────────────────┘      └─────────────────────────────┘        │
                                                │                       │
                                                ▼                       ▼
                                   ┌──────────────────────────────────────┐
                                   │ Pino Structured JSON Logs (stdout)  │
                                   │ -> Ingested by Vercel Dashboard      │
                                   └──────────────────────────────────────┘
```

---

## 🚀 Key Features

- **Background Job Queue & Real-Time SSE Progress**: Async generation powered by Upstash Redis + BullMQ. No 10-second serverless timeouts on large PDF uploads. Live percentage and step updates streamed via browser-native `EventSource`.
- **Intelligent Response & Embedding Cache**: Upstash Redis caching layer stores repeated Gemini course syllabi and vector chunk embeddings, providing sub-second demo loads.
- **SM-2 Adaptive Difficulty Engine**: Analyzes spaced repetition recall metrics (`easeFactor`, `interval`, `nextReviewAt`) to compute retention mastery scores, detect weak concepts, and automatically adjust AI quiz generation difficulty.
- **Teacher & Admin Analytics Dashboard**: Platform analytics viewable at `/admin` (Course directory) and `/admin/stats` (Recharts interactive charts for DAU, daily course volume, quiz score distributions, and system event telemetry).
- **Structured JSON Logging**: Zero-overhead Pino logger writing structured JSON to `stdout` for automatic ingestion into the Vercel Dashboard.

---

## 🧠 Engineering Decisions & Tradeoffs

### 1. Server-Sent Events (SSE) over WebSockets / External Realtime SaaS
- **Decision**: Used Next.js `ReadableStream` route handlers and browser-native `EventSource` rather than Pusher, Ably, or WebSockets.
- **Tradeoff**: SSE is unidirectional (Server -> Client), which fits job progress tracking perfectly without maintaining persistent bidirectional WebSocket connections or paying for third-party realtime SaaS subscriptions.

### 2. Self-Built Telemetry Pipeline over Heavy Analytics SDKs
- **Decision**: Created an `events` table in PostgreSQL with a lightweight `trackEvent()` helper writing JSON logs to `stdout`.
- **Tradeoff**: Avoided introducing client-side telemetry SDK bloat or external tracking SaaS vendors. Keeps data inside the primary database while making logs immediately searchable in Vercel Dashboard.

### 3. Upstash Redis Protocol with Resilient Memory Fallback
- **Decision**: Configured `ioredis` to connect to Upstash Redis TCP protocol (`rediss://...`) with an automatic in-memory TTL Map fallback.
- **Tradeoff**: Ensures 100% application uptime during local development, testing, or temporary Redis network hiccups without crashing server actions or queue dispatchers.

### 4. Hybrid Map-Reduce & Concurrency Limited Embedding Pipeline
- **Decision**: Large PDFs are chunked into 25,000-character segments for map-reduce syllabus generation, and RAG chunks are embedded with a 5-worker concurrency limiter (`pLimit(5)`).
- **Tradeoff**: Balances Gemini API rate limits (15 RPM) against generation speed, resulting in a ~5x speedup during document vector ingestion.

---

## 🚧 Known Scaling Boundaries & Free-Tier Limits

1. **Upstash Redis Free Tier**: Limited to **10,000 commands/day** and 256MB memory. The built-in in-memory fallback handles excess traffic smoothly if daily command limits are reached.
2. **Neon PostgreSQL Free Tier**: Storage capped at **0.5 GiB** with compute autosuspension after inactivity.
3. **Google Gemini Free Tier**: `gemini-3.6-flash` rate limit of **15 Requests Per Minute (RPM)** and 1 million Tokens Per Minute (TPM).

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TailwindCSS v4, Radix UI
- **Queue & Cache**: Upstash Redis (`ioredis`), BullMQ, Server-Sent Events (`EventSource`)
- **AI & RAG**: Google Gemini AI (`gemini-3.6-flash`, `gemini-3.5-flash-lite`), `text-embedding-004`, `pdf-parse`
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
