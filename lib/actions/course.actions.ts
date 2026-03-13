"use server";

import { db } from "@/lib/db";
import { courses, chapters } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

interface CreateCourseParams {
  topic: string;
  duration: number;
  difficulty: string;
}

export async function generateCourse(params: CreateCourseParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const { topic, duration, difficulty } = params;

    // 1. Set up the prompt to force JSON output
    const prompt = `
            You are an expert curriculum designer. Create a highly structured course syllabus.

            Topic: ${topic}
            Difficulty Level: ${difficulty}
            Number of Chapters/Modules: ${duration}

            Return the response strictly as a JSON array of objects. Do not include markdown formatting like \`\`\`json.
            Each object must represent a chapter and have exactly these two keys:
            - "title": A concise, engaging title for the chapter.
            - "content": A 2-3 sentence overview of what the student will learn in this chapter.
        `;

    // 2. Call Gemini (Using Gemini 1.5 Flash for speed)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Clean up the response in case Gemini includes markdown blocks
    const cleanedText = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const syllabus = JSON.parse(cleanedText);

    // 3. Insert the Course into the database
    const [newCourse] = await db
      .insert(courses)
      .values({
        author: userId,
        topic,
        duration,
        difficulty,
        isCompleted: false,
      })
      .returning();

    // 4. Format and Insert the Chapters
    const chaptersToInsert = syllabus.map((chapter: any, index: number) => ({
      courseId: newCourse.id,
      title: chapter.title,
      content: chapter.content,
      order: index + 1,
      isCompleted: false,
    }));

    await db.insert(chapters).values(chaptersToInsert);

    revalidatePath("/dashboard"); // Or wherever your courses list lives

    return newCourse;
  } catch (error) {
    console.error("Error generating course:", error);
    throw new Error("Failed to generate course");
  }
}

export async function deleteCourse(courseId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Verify ownership
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
    });

    if (!course || course.author !== userId) {
      throw new Error("Unauthorized");
    }

    // Delete the course (Drizzle will cascade delete chapters and quizzes)
    await db.delete(courses).where(eq(courses.id, courseId));

    revalidatePath("/dashboard");
    revalidatePath("/profile");

    return { success: true };
  } catch (error) {
    console.error("Error deleting course:", error);
    throw new Error("Failed to delete course");
  }
}
