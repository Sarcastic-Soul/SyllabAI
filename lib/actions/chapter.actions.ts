"use server";

import { db } from "@/lib/db";
import { chapters, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export async function markChapterComplete(chapterId: string, courseId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // 1. Mark the chapter as completed
    await db
      .update(chapters)
      .set({ isCompleted: true })
      .where(eq(chapters.id, chapterId));

    // 2. STREAK LOGIC
    const userDb = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (userDb) {
      const now = new Date();
      const today = now.toDateString();
      const lastActiveDate = userDb.lastActive
        ? new Date(userDb.lastActive).toDateString()
        : null;

      // Calculate what "yesterday" was
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toDateString();

      let newStreak = userDb.currentStreak || 0;

      if (lastActiveDate === yesterdayString) {
        // They were active yesterday, streak goes up!
        newStreak += 1;
      } else if (lastActiveDate !== today) {
        // They missed a day, streak resets to 1
        newStreak = 1;
      }
      // If lastActiveDate === today, the streak stays the same (they already earned it today)

      await db
        .update(users)
        .set({
          currentStreak: newStreak,
          lastActive: now,
        })
        .where(eq(users.id, userId));
    }

    revalidatePath(`/courses/${courseId}/chapters/${chapterId}`);
    revalidatePath(`/profile`);
    return { success: true };
  } catch (error) {
    console.error("Error marking complete:", error);
    throw new Error("Failed to mark chapter as complete");
  }
}

export async function toggleChapterBookmark(
  chapterId: string,
  courseId: string,
  currentStatus: boolean,
) {
  try {
    await db
      .update(chapters)
      .set({ isBookmarked: !currentStatus })
      .where(eq(chapters.id, chapterId));

    revalidatePath(`/courses/${courseId}`);
    return { success: true };
  } catch (error) {
    console.error("Error toggling bookmark:", error);
    throw new Error("Failed to update bookmark status");
  }
}

export async function generateChapterLesson(
  chapterId: string,
  courseTopic: string,
  chapterTitle: string,
) {
  try {
    const prompt = `
            You are an expert tutor writing a comprehensive educational lesson.
            Course Subject: ${courseTopic}
            Current Chapter: ${chapterTitle}

            Write a highly detailed, engaging, and easy-to-understand lesson for this chapter.
            Use Markdown formatting (headings, bullet points, bold text).
            Include real-world examples, analogies, and a brief summary at the end.
            Do NOT include the chapter title as an H1, just start directly with the content.
        `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const lessonContent = result.response.text();

    // Save the generated lesson to the database
    await db
      .update(chapters)
      .set({ lessonText: lessonContent })
      .where(eq(chapters.id, chapterId));

    revalidatePath(`/courses/[courseId]/chapters/${chapterId}`, "page");

    return { success: true, lessonText: lessonContent };
  } catch (error) {
    console.error("Error generating lesson:", error);
    throw new Error("Failed to generate lesson content");
  }
}
