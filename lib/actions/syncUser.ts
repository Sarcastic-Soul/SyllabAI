"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, courses, chapters, quizzes, flashcards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const syncUserToDatabase = async () => {
  const user = await currentUser();

  if (!user) return;

  const email = user.emailAddresses?.[0]?.emailAddress;
  const id = user.id;

  try {
    await db
      .insert(users)
      .values({
        id,
        email,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: { email },
      });

    // Check if the user has any courses
    const userCourses = await db.query.courses.findMany({
      where: eq(courses.author, id),
    });

    // If no courses exist, seed the global sample course
    if (userCourses.length === 0) {
      const [sampleCourse] = await db
        .insert(courses)
        .values({
          author: id,
          topic: "Intro to SyllabAI & Machine Learning",
          duration: 1,
          difficulty: "beginner",
          timeSpent: 0,
          isCompleted: false,
          cheatSheet: "## Quick Reference\n- **Machine Learning**: Systems that learn from data.\n- **SyllabAI**: Your AI-powered learning companion.",
        })
        .returning();

      const [sampleChapter] = await db
        .insert(chapters)
        .values({
          courseId: sampleCourse.id,
          title: "What is Machine Learning?",
          content: "A brief introduction to the concepts of ML and how AI generates courses.",
          lessonText: "## Introduction\nMachine Learning is a subset of AI that focuses on building systems that learn from data. Instead of being explicitly programmed, these systems improve their performance on a specific task over time.\n\n### Types of Machine Learning\n1. **Supervised Learning**: Learning with labeled data.\n2. **Unsupervised Learning**: Finding patterns in unlabeled data.\n3. **Reinforcement Learning**: Learning by trial and error through rewards and punishments.",
          mermaidDiagram: "graph TD;\n    A[Data] --> B[Machine Learning Algorithm];\n    B --> C[Model];\n    C --> D[Predictions];",
          order: 1,
          isCompleted: false,
        })
        .returning();

      // Seed a Quiz
      const [sampleQuiz] = await db
        .insert(quizzes)
        .values({
          chapterId: sampleChapter.id,
          isCompleted: false,
        })
        .returning();

      const { questions } = await import("@/lib/db/schema");
      await db.insert(questions).values([
        {
          quizId: sampleQuiz.id,
          questionText: "What is supervised learning?",
          options: ["Learning with labeled data", "Learning with unlabeled data", "Learning through trial and error", "None of the above"],
          correctAnswer: 0,
        }
      ]);

      // Seed Flashcards
      await db.insert(flashcards).values([
        {
          chapterId: sampleChapter.id,
          front: "Supervised Learning",
          back: "Learning with labeled data.",
        },
        {
          chapterId: sampleChapter.id,
          front: "Unsupervised Learning",
          back: "Finding patterns in unlabeled data.",
        }
      ]);

      // Increment coursesGenerated to 1
      const { sql } = await import("drizzle-orm");
      await db
        .update(users)
        .set({ coursesGenerated: sql`${users.coursesGenerated} + 1` })
        .where(eq(users.id, id));
    }

    // Set a cookie so we don't sync again in this session (if invoked in Action/Route handler context)
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      cookieStore.set("user_synced", "true", { maxAge: 60 * 60 * 24 * 7 }); // 1 week
    } catch {
      // Cookies cannot be modified during SSR page renders in Next.js App Router
    }
  } catch (error: any) {
    console.error("Error syncing user to database:", error.message);
  }
};
