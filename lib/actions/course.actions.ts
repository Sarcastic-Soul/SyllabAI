"use server";

import { db } from "@/lib/db";
import { courses, chapters, users, quizzes } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { PDFParse } from "pdf-parse";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

interface CreateCourseParams {
  topic: string;
  duration: number;
  difficulty: string;
}

async function saveCourseToDatabase(params: {
  userId: string;
  topic: string;
  duration: number;
  difficulty: string;
  syllabus: { title: string; content: string }[];
}) {
  const { userId, topic, duration, difficulty, syllabus } = params;

  // 1. Insert the Course
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

  // 2. Format and Insert Chapters
  const chaptersToInsert = syllabus.map((chapter, index) => ({
    courseId: newCourse.id,
    title: chapter.title,
    content: chapter.content,
    order: index + 1,
    isCompleted: false,
  }));

  await db.insert(chapters).values(chaptersToInsert);

  // 3. Increment the user's course generation count
  await db
    .update(users)
    .set({ coursesGenerated: sql`${users.coursesGenerated} + 1` })
    .where(eq(users.id, userId));

  // 4. Revalidate the UI
  revalidatePath("/dashboard");

  return newCourse;
}

export async function generateCourse(params: CreateCourseParams) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const { topic, duration, difficulty } = params;

    const prompt = `
      Create a comprehensive lesson on the topic: "${topic}".
      Difficulty: ${difficulty}.
      Duration/Modules: ${duration}.

      CRITICAL: You must ALWAYS respond with a valid JSON array of objects. Each object must have a "title" and "content". Even if the topic seems unconventional (like "Video Games"), treat it seriously and generate an engaging, educational syllabus for it in the requested JSON format. Do NOT include conversational text like "Please provide a valid topic".

      CRITICAL FORMATTING INSTRUCTIONS:
      Your primary goal is to write rich, engaging, text-based educational content. Do NOT rely solely on diagrams or code.

      OPTIONAL ENHANCEMENTS (Use Sparingly):
      1. Mermaid Diagrams (\`\`\`mermaid): ONLY use a Mermaid diagram if the specific topic requires visualizing a process flow, hierarchy, or architecture. Do not use diagrams for simple lists or abstract concepts.
      2. Interactive React Code (\`\`\`react-live): ONLY use this if you are explicitly teaching a Frontend/UI development concept. The code must be a self-contained functional component. Do not use this for Python, backend concepts, or non-coding topics.

      If the topic does not strictly require a visual diagram or a React component, DO NOT generate them. Rely entirely on your excellent Markdown text explanations.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });

    const responseText = result.response.text();

    let syllabus;
    try {
      const cleanedText = responseText
        .replace(/```json\n?/g, "")
        .replace(/```/g, "")
        .trim();
      syllabus = JSON.parse(cleanedText);
    } catch (e) {
      console.error("Failed to parse AI response:", responseText);
      throw new Error(
        `The AI declined or failed to format this topic properly. AI said: "${responseText.substring(0, 50)}..."`,
      );
    }

    if (!Array.isArray(syllabus) || syllabus.length === 0) {
      throw new Error("The AI returned an empty or invalid course structure.");
    }

    // Use the shared database helper
    const newCourse = await saveCourseToDatabase({
      userId,
      topic,
      duration,
      difficulty,
      syllabus,
    });

    return newCourse;
  } catch (error) {
    console.error("Error generating course:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to generate course",
    );
  }
}

export async function generateCourseFromPDF(formData: FormData) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const file = formData.get("file") as File;
    const duration = parseInt(formData.get("duration") as string) || 5;
    const difficulty = (formData.get("difficulty") as string) || "Intermediate";

    if (!file) throw new Error("No file uploaded");

    const arrayBuffer = await file.arrayBuffer();
    const parser = new PDFParse({ data: new Uint8Array(arrayBuffer) });
    const result = await parser.getText();
    const documentText = result.text;
    await parser.destroy();

    if (!documentText || documentText.trim().length < 50) {
      throw new Error(
        "Could not extract enough text from the PDF. Please ensure it is a text-based PDF.",
      );
    }

    const prompt = `
      You are an expert curriculum designer. Create a highly structured course syllabus STRICTLY based on the provided document text.
      Difficulty Level: ${difficulty}
      Number of Chapters/Modules: ${duration}

      Source Document Text:
      ${documentText.substring(0, 50000)}

      CRITICAL: You must ALWAYS respond with a valid JSON array of objects. Each object must have a "title" and "content".
      Your primary goal is to write rich, engaging, text-based educational content derived ONLY from the source text above.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Enforce JSON strictly for the PDF version too
    const aiResult = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });

    const responseText = aiResult.response.text();

    let syllabus;
    try {
      const cleanedText = responseText
        .replace(/```json\n?/g, "")
        .replace(/```/g, "")
        .trim();
      syllabus = JSON.parse(cleanedText);
    } catch (e) {
      console.error("Failed to parse AI PDF response:", responseText);
      throw new Error(`The AI declined or failed to format this PDF properly.`);
    }

    if (!Array.isArray(syllabus) || syllabus.length === 0) {
      throw new Error("The AI returned an empty or invalid course structure.");
    }

    // Use the shared database helper
    const newCourse = await saveCourseToDatabase({
      userId,
      topic: `Document: ${file.name.replace(".pdf", "")}`,
      duration,
      difficulty,
      syllabus,
    });

    return newCourse.id; // Kept returning ID here to match your original implementation
  } catch (error: any) {
    console.error("Error generating course from PDF:", error);
    throw new Error(error.message || "Failed to generate course from PDF");
  }
}

export async function deleteCourse(courseId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // 1. Verify ownership
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
