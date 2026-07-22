# SyllabAI

**SyllabAI** is an AI-powered educational platform that automatically generates structured courses, quizzes, and flashcards from a simple topic or an uploaded PDF document. 

Built with the Next.js App Router and powered by Google Gemini, SyllabAI transforms raw text into interactive, engaging learning journeys.

## 🎬 Demo Video
*(Add a link or embed your demo video here!)*

## 📸 Screenshots
*(Add a grid of awesome app screenshots here!)*

## 🏗️ Architecture

![Architecture Diagram](./public/architecture.png)
*(Drop your Excalidraw-rendered architecture diagram here!)*

## 🚀 Key Features

- **AI Course Generation**: Enter a topic or upload a PDF to instantly generate structured chapters and lessons.
- **Interactive Quizzes & Flashcards**: Automatically generated assessments with Spaced Repetition (SM-2) for flashcard review.
- **Study Buddy**: A Voice-enabled AI Tutor (powered by Gemini Flash Lite) with full conversational memory and RAG over your course materials.
- **Course Sharing**: Generate secure public links to share your AI-authored courses with others.
- **Advanced Analytics**: Track your progress with daily streaks, activity heatmaps, and accuracy metrics.

## 🛠️ Tech Stack

- **Framework**: Next.js (App Router), React, TailwindCSS, Shadcn
- **AI & Processing**: Google Gemini AI (`gemini-2.5-pro` & `gemini-3.5-flash-lite`), `pdf-parse`
- **Database & Auth**: PostgreSQL (Neon), Drizzle ORM, Clerk

## 🚦 Quick Start

1. **Clone the repo**
   ```bash
   git clone https://github.com/Sarcastic-Soul/SyllabAI.git
   cd syllabai
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   Copy the `.env.example` file and fill in your credentials:
   ```bash
   cp .env.example .env.local
   ```
   *(Ensure you have your Clerk keys, Neon DB URL, and Gemini API key.)*

4. **Run Database Migrations & Start**
   ```bash
   pnpm run db:push
   pnpm dev
   ```
