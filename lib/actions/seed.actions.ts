"use server";

import { db } from "@/lib/db";
import { users, courses, chapters, quizzes } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function seedMockData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // 1. Generate Realistic Mock Activity Map & update User Stats
  const today = new Date();
  const activityMap: Record<string, number> = {};
  
  // Fill the last 30 days with some random activity
  for (let i = 0; i < 30; i++) {
    if (Math.random() > 0.3) { // 70% chance of activity on any given day
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split("T")[0];
      activityMap[dateString] = Math.floor(Math.random() * 5) + 1; // 1 to 5 activities
    }
  }

  // Ensure today has activity to maintain a streak
  activityMap[today.toISOString().split("T")[0]] = 3;

  await db
    .update(users)
    .set({
      currentStreak: 12,
      totalTimeSpent: 14500, // About 4 hours total
      activityMap: activityMap,
      coursesGenerated: 3,
    })
    .where(eq(users.id, userId));

  // ==========================================
  // COURSE 1: Completed & High Accuracy
  // ==========================================
  const [course1] = await db
    .insert(courses)
    .values({
      author: userId,
      topic: "Advanced System Design",
      duration: 3,
      difficulty: "advanced",
      timeSpent: 5400, // 90 mins
      isCompleted: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 1 week ago
    })
    .returning();

  const [c1ch1] = await db
    .insert(chapters)
    .values({
      courseId: course1.id,
      title: "Microservices Architecture",
      content: "Learn how to break down monoliths.",
      lessonText: "## Introduction to Microservices\n\nMicroservices divide monolithic apps into smaller, independent services.\n\n```mermaid\ngraph LR;\n    Client-->API_Gateway;\n    API_Gateway-->ServiceA;\n    API_Gateway-->ServiceB;\n    ServiceA-->DB1;\n    ServiceB-->DB2;\n```\n\n### Benefits\n- Independent scaling\n- Fault isolation",
      order: 1,
      isCompleted: true,
    })
    .returning();

  await db.insert(quizzes).values({
    chapterId: c1ch1.id,
    score: 3, // 100% accuracy (3/3)
    isCompleted: true,
  });

  const [c1ch2] = await db
    .insert(chapters)
    .values({
      courseId: course1.id,
      title: "Caching Strategies",
      content: "Implement Redis and Memcached patterns.",
      lessonText: "## Caching 101\n\nCaching prevents redundant database queries.\n\n### Common Patterns\n1. Cache-aside\n2. Read-through\n3. Write-through\n\n```mermaid\nsequenceDiagram\n    participant App\n    participant Cache\n    participant DB\n    App->>Cache: Request Data\n    alt Cache Hit\n        Cache-->>App: Return Data\n    else Cache Miss\n        Cache-->>App: Null\n        App->>DB: Query Data\n        DB-->>App: Return Data\n        App->>Cache: Store Data\n    end\n```",
      order: 2,
      isCompleted: true,
    })
    .returning();

  await db.insert(quizzes).values({
    chapterId: c1ch2.id,
    score: 2, // 66% accuracy (2/3)
    isCompleted: true,
  });

  // ==========================================
  // COURSE 2: In Progress (Mixed Completion)
  // ==========================================
  const [course2] = await db
    .insert(courses)
    .values({
      author: userId,
      topic: "Introduction to Generative AI",
      duration: 2,
      difficulty: "beginner",
      timeSpent: 1200, // 20 mins
      isCompleted: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    })
    .returning();

  const [c2ch1] = await db
    .insert(chapters)
    .values({
      courseId: course2.id,
      title: "What are LLMs?",
      content: "Understand Large Language Models.",
      lessonText: "## Large Language Models\n\nLLMs predict the next token in a sequence.\n\n```mermaid\nflowchart TD\n    A[Input Prompt] --> B[Tokenizer]\n    B --> C[Transformer Layers]\n    C --> D[Softmax]\n    D --> E[Predicted Token]\n```",
      order: 1,
      isCompleted: true,
    })
    .returning();

  await db.insert(quizzes).values({
    chapterId: c2ch1.id,
    score: 1, // 33% accuracy (1/3)
    isCompleted: true,
  });

  await db.insert(chapters).values({
    courseId: course2.id,
    title: "Prompt Engineering",
    content: "Learn how to write better prompts.",
    lessonText: null, // User hasn't generated this lesson yet!
    order: 2,
    isCompleted: false,
  });

  // ==========================================
  // COURSE 3: Just Created (0% Progress)
  // ==========================================
  const [course3] = await db
    .insert(courses)
    .values({
      author: userId,
      topic: "Full-Stack Next.js 15",
      duration: 4,
      difficulty: "intermediate",
      timeSpent: 0,
      isCompleted: false,
      createdAt: new Date(), // Today
    })
    .returning();

  await db.insert(chapters).values([
    {
      courseId: course3.id,
      title: "App Router Fundamentals",
      content: "Understand layouts and pages.",
      lessonText: null,
      order: 1,
      isCompleted: false,
    },
    {
      courseId: course3.id,
      title: "Server Actions",
      content: "Mutate data directly from the server.",
      lessonText: null,
      order: 2,
      isCompleted: false,
    },
  ]);

  redirect("/dashboard");
}
