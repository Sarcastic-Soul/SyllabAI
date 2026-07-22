"use server";

import { db } from "@/lib/db";
import { courses, chapters, users, quizzes, documents, documentChunks } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { PDFParse } from "pdf-parse";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

import { z } from "zod";

const createCourseSchema = z.object({
    topic: z.string().min(2, "Topic must be at least 2 characters").max(100),
    duration: z.number().min(1).max(20),
    difficulty: z.enum(["Beginner", "Intermediate", "Advanced", "beginner", "intermediate", "advanced"]),
});

type CreateCourseParams = z.infer<typeof createCourseSchema>;

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

    if (chaptersToInsert.length > 0) {
        await db.insert(chapters).values(chaptersToInsert);
    }

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

        // Limit Check
        const userDb = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!userDb) throw new Error("User not found");

        if (userDb.subscriptionPlan === "basic") {
            const activeCourses = await db.query.courses.findMany({
                where: eq(courses.author, userId),
            });
            if (activeCourses.length >= 2) {
                throw new Error("BASIC_PLAN_LIMIT_REACHED");
            }
        }

        const validatedParams = createCourseSchema.parse(params);
        const { topic, duration, difficulty } = validatedParams;

        const prompt = `
      Create a comprehensive lesson on the topic: "${topic}".
      Difficulty: ${difficulty}.
      Duration/Modules: ${duration}.

      CRITICAL: You must ALWAYS respond with a valid JSON array of objects. Each object must have a "title" and "content". Even if the topic seems unconventional (like "Video Games"), treat it seriously and generate an engaging, educational syllabus for it in the requested JSON format. Do NOT include conversational text like "Please provide a valid topic".

      CRITICAL FORMATTING INSTRUCTIONS:
      Your primary goal is to write rich, engaging, text-based educational content. Do NOT rely solely on diagrams or code.

      OPTIONAL ENHANCEMENTS (Use Sparingly):
      1. Mermaid Diagrams (\\\`\\\`\\\`mermaid): ONLY use a Mermaid diagram if the specific topic requires visualizing a process flow, hierarchy, or architecture. Do not use diagrams for simple lists or abstract concepts.

      If the topic does not strictly require a visual diagram, DO NOT generate them. Rely entirely on your excellent Markdown text explanations.
    `;

        const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
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
            throw new Error(
                "The AI returned an empty or invalid course structure.",
            );
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
            error instanceof Error
                ? error.message
                : "Failed to generate course",
        );
    }
}

export async function generateCourseFromPDF(formData: FormData) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        // Limit Check
        const userDb = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!userDb) throw new Error("User not found");

        if (userDb.subscriptionPlan === "basic") {
            const activeCourses = await db.query.courses.findMany({
                where: eq(courses.author, userId),
            });
            if (activeCourses.length >= 2) {
                throw new Error("BASIC_PLAN_LIMIT_REACHED");
            }
        }

        const file = formData.get("file") as File;
        const duration = parseInt(formData.get("duration") as string) || 5;
        const difficulty =
            (formData.get("difficulty") as string) || "Intermediate";

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

        const { chunkText } = await import("@/lib/utils/chunker");
        
        // 1. Chunking
        const ragChunks = chunkText(documentText, 4000, 200);
        const summaryChunks = chunkText(documentText, 25000, 500);

        // 2. Map Phase: Generate an outline from large chunks
        const summarizerModel = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
        const mapPrompt = "Extract the main topics, sub-topics, and key structural elements from this text segment to help build a course syllabus. Be concise, use bullet points.";
        
        const chunksToSummarize = summaryChunks.slice(0, 5); // Up to ~125,000 characters to avoid huge payloads
        const chunkSummaries = await Promise.all(
            chunksToSummarize.map(async (c) => {
                 try {
                     const res = await summarizerModel.generateContent(mapPrompt + "\n\n" + c);
                     return res.response.text();
                 } catch (e) {
                     return ""; // Fallback gracefully if one chunk fails
                 }
            })
        );
        const outlineContext = chunkSummaries.join("\n\n");

        // 3. Reduce Phase: Generate syllabus
        const prompt = `
      You are an expert curriculum designer. Create a highly structured course syllabus STRICTLY based on the provided document outline.
      Difficulty Level: ${difficulty}
      Number of Chapters/Modules: ${duration}

      Source Document Outline:
      ${outlineContext}

      CRITICAL: You must ALWAYS respond with a valid JSON array of objects. Each object must have a "title" and "content".
      Your primary goal is to write rich, engaging, text-based educational content derived ONLY from the source text outline above.
    `;

        const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

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
            throw new Error(
                `The AI declined or failed to format this PDF properly.`,
            );
        }

        if (!Array.isArray(syllabus) || syllabus.length === 0) {
            throw new Error(
                "The AI returned an empty or invalid course structure.",
            );
        }

        // Use the shared database helper
        const newCourse = await saveCourseToDatabase({
            userId,
            topic: `Document: ${file.name.replace(".pdf", "")}`,
            duration,
            difficulty,
            syllabus,
        });

        // 4. Save document and generate/save embeddings for RAG
        const [newDoc] = await db.insert(documents).values({
            courseId: newCourse.id,
            filename: file.name,
        }).returning();

        // Batch embed chunks with concurrency limiter for ~5x speedup
        const { pLimit } = await import("@/lib/utils/concurrency");
        const limit = pLimit(5);
        const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
        
        const embeddingResults = await Promise.all(
            ragChunks.map((content) =>
                limit(async () => {
                    try {
                        const res = await embedModel.embedContent(content);
                        return {
                            documentId: newDoc.id,
                            content: content,
                            embedding: res.embedding.values,
                        };
                    } catch (err) {
                        console.error("Failed to embed chunk:", err);
                        return null;
                    }
                })
            )
        );

        const chunksToInsert = embeddingResults.filter(
            (r): r is NonNullable<typeof r> => r !== null
        );

        if (chunksToInsert.length > 0) {
            await db.insert(documentChunks).values(chunksToInsert);
        }

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

export async function generateCourseCheatSheet(courseId: string) {
    try {
        const { userId } = await auth();
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
            
            Based on the following chapter contents, generate a comprehensive cheat sheet summarizing the key concepts, formulas, definitions, and takeaways. Use markdown formatting (headers, bullet points, bold text).
            
            Chapter Contents:
            ${chapterTexts.substring(0, 50000)}
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
        const result = await model.generateContent(prompt);
        const cheatSheetContent = result.response.text();

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
        const { userId } = await auth();
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
