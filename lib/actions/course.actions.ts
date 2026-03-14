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
      // ... (Your existing instructions to write a comprehensive lesson) ...

      CRITICAL FORMATTING INSTRUCTIONS:
      Your primary goal is to write rich, engaging, text-based educational content. Do NOT rely solely on diagrams or code.

      OPTIONAL ENHANCEMENTS (Use Sparingly):
      1. Mermaid Diagrams (\`\`\`mermaid): ONLY use a Mermaid diagram if the specific topic requires visualizing a process flow, hierarchy, or architecture. Do not use diagrams for simple lists or abstract concepts.
      2. Interactive React Code (\`\`\`react-live): ONLY use this if you are explicitly teaching a Frontend/UI development concept. The code must be a self-contained functional component. Do not use this for Python, backend concepts, or non-coding topics.

      If the topic does not strictly require a visual diagram or a React component, DO NOT generate them. Rely entirely on your excellent Markdown text explanations.
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
