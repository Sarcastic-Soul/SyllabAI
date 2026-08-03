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

### 4. Hybrid Map-Reduce & Model Distribution Strategy
- **Decision**: High-frequency interactive features (quizzes, Study Buddy chat) are routed to `gemini-3.5-flash-lite` (15 RPM / 500 RPD), while core syllabus generation uses `gemini-3.6-flash` (5 RPM / 20 RPD). Document embeddings use concurrency limiting (`pLimit(5)`).
- **Tradeoff**: Optimizes feature availability across tight free-tier daily request quotas while utilizing Redis response caching to avoid redundant LLM calls.

---

## 🚧 Known Scaling Boundaries & Free-Tier Limits

1. **Upstash Redis Free Tier**: Capped at **10,000 commands/day** and 256MB memory. An in-memory TTL fallback automatically handles requests if the Redis command ceiling is reached.
2. **Neon PostgreSQL Free Tier**: Capped at **0.5 GiB** storage with compute autosuspension.
3. **Google Gemini Free Tier Limits**:
   - **Gemini 3.6 Flash**: **5 Req/Min (RPM)** | **250K Tokens/Min** | **20 Req/Day (RPD)** *(Used for primary course generation)*.
   - **Gemini 3.5 Flash Lite**: **15 Req/Min (RPM)** | **250K Tokens/Min** | **500 Req/Day (RPD)** *(Used for quizzes, flashcards, & Study Buddy chat)*.
   - **System Protections**: Integrated Upstash Redis response caching, user hourly rate limits (`checkRateLimit`), and exponential backoff retries (`withRetry`) prevent quota exhaustion.

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
