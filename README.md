# SyllabAI

**SyllabAI** is an AI-powered educational platform that automatically generates structured courses, quizzes, and flashcards from a simple topic or an uploaded PDF document.

Built with Next.js (App Router) and powered by Google Gemini, SyllabAI transforms raw text and documents into interactive, engaging learning journeys with vector-based RAG and AI-driven study tools.

## 🚀 Key Features

- **AI Course Generation**: Enter a topic or upload a PDF to instantly generate structured chapters, summaries, and lessons.
- **Interactive Quizzes & Flashcards**: Automatically generated assessments with Spaced Repetition (SM-2) for flashcard review.
- **Study Buddy**: A voice-enabled AI tutor powered by Gemini with full conversational memory and RAG over your course materials.
- **Rich Media & Math Support**: Native rendering for LaTeX formulas (KaTeX) and dynamic diagrams (Mermaid.js).
- **Course Sharing**: Generate secure public links to share your AI-authored courses with others.
- **Advanced Analytics**: Track your progress with daily streaks, activity heatmaps, and accuracy metrics.

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TailwindCSS v4, Radix UI
- **AI & Processing**: Google Gemini AI (`gemini-3.6-flash`, `gemini-3.5-flash`, `gemini-3.5-flash-lite`), `text-embedding-004`, `pdf-parse`
- **Database & RAG**: PostgreSQL (Neon), `pgvector` (Vector Embeddings), Drizzle ORM
- **Authentication**: Clerk Auth
- **Formatting & Rendering**: KaTeX (Math & LaTeX), Mermaid.js (Diagrams & Charts)

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

### 4. Enable Vector Extension & Push Database Schema
Before running database push or migrations, enable the `pgvector` extension on your Neon database:
```bash
node enable-vector.js
pnpm run db:push
```

### 5. Start the Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📜 Project Scripts

- `pnpm dev` – Starts the development server with Turbopack.
- `pnpm build` – Builds the production bundle.
- `pnpm start` – Starts the production server.
- `pnpm lint` – Runs Next.js linting checks.
- `pnpm run db:push` – Pushes schema changes directly to the database using Drizzle Kit.
- `pnpm run db:generate` – Generates SQL migrations from schema.
- `pnpm run db:migrate` – Executes pending database migrations.
- `pnpm test` – Executes unit tests using Vitest.
