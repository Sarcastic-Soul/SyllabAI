"use server";

import { db } from "@/lib/db";
import { courses, users } from "@/lib/db/schema";
import { getUserId } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { generate } from "@/lib/ai/generate";

export async function deleteCourse(courseId: string) {
  try {
    const userId = await getUserId();
    if (!userId) throw new Error("Unauthorized");

    const course = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
    });

    if (!course || course.author !== userId) {
      throw new Error("Unauthorized");
    }

    await db.delete(courses).where(eq(courses.id, courseId));

    await db
      .update(users)
      .set({
        coursesGenerated: sql`GREATEST(${users.coursesGenerated} - 1, 0)`,
      })
      .where(eq(users.id, userId));

    revalidatePath("/dashboard");
    revalidatePath("/profile");

    return { success: true };
  } catch (error) {
    console.error("Error deleting course:", error);
    throw new Error("Failed to delete course");
  }
}

export async function generateCourseCheatSheet(courseId: string) {
  try {
    const userId = await getUserId();
    if (!userId) throw new Error("Unauthorized");


    const course = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
      with: {
        chapters: true,
      },
    });

    if (!course || course.author !== userId) {
      throw new Error("Unauthorized or course not found");
    }

    const chapterTexts = course.chapters
      .filter((c) => c.lessonText)
      .map((c) => `Chapter: ${c.title}\n${c.lessonText}`)
      .join("\n\n");

    if (!chapterTexts) {
      throw new Error("No chapter content available to generate a cheat sheet.");
    }

    const prompt = `
      You are an expert tutor creating a concise, high-yield cheat sheet for a course.
      Course Topic: ${course.topic}
      
      Based on the following chapter contents, generate a comprehensive cheat sheet summarizing key concepts, formulas, definitions, key takeaways, and code/diagram examples if relevant. 
      Format your response with clean markdown formatting:
      - Use headers (##, ###) to separate sections clearly.
      - Use markdown bullet points and bold text for key terms.
      - Use markdown tables for comparisons and cheat sheet reference lists.
      - Do not include raw string escape sequences like \\n.
      
      Chapter Contents:
      ${chapterTexts.substring(0, 50000)}
    `;

    const result = await generate({
      step: "cheat_sheet",
      prompt,
      preferredModel: "gemini-3.8-flash",
      userId,
    });
    const cheatSheetContent = result.data.replace(/\\n/g, "\n");

    await db
      .update(courses)
      .set({ cheatSheet: cheatSheetContent })
      .where(eq(courses.id, courseId));

    revalidatePath(`/dashboard`);
    revalidatePath(`/courses/${courseId}`);

    return { success: true, cheatSheet: cheatSheetContent };
  } catch (error) {
    console.error("Error generating cheat sheet:", error);
    throw new Error("Failed to generate cheat sheet");
  }
}

export async function toggleCoursePublic(courseId: string) {
  try {
    const userId = await getUserId();
    if (!userId) throw new Error("Unauthorized");

    const course = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
    });

    if (!course || course.author !== userId) {
      throw new Error("Unauthorized or course not found");
    }

    const newIsPublic = !course.isPublic;
    const newSlug = newIsPublic
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 8)
      : null;

    await db
      .update(courses)
      .set({
        isPublic: newIsPublic,
        shareSlug: newSlug,
      })
      .where(eq(courses.id, courseId));

    revalidatePath(`/courses/${courseId}`);

    return {
      success: true,
      isPublic: newIsPublic,
      shareSlug: newSlug,
    };
  } catch (error) {
    console.error("Error toggling course visibility:", error);
    throw new Error("Failed to update sharing settings");
  }
}
