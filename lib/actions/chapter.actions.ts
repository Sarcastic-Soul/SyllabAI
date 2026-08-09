"use server";

import { db } from "@/lib/db";
import { chapters, users, documents, documentChunks, flashcards } from "@/lib/db/schema";
import { eq, sql, cosineDistance, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";
import {
    chapterActionSchema,
    toggleBookmarkSchema,
    flashcardQuerySchema,
} from "@/lib/validations";
import { withRetry } from "@/lib/utils/retry";
import { getEmbeddingVector, getGenAI } from "@/lib/quota";

/**
 * Helper to verify user ownership of a chapter via its parent course.
 */
async function verifyChapterOwnership(chapterId: string, userId: string) {
    const chapter = await db.query.chapters.findFirst({
        where: eq(chapters.id, chapterId),
        with: { course: true },
    });

    if (!chapter || chapter.course.author !== userId) {
        throw new Error("Unauthorized: You do not own this course chapter");
    }

    return chapter;
}

export async function markChapterComplete(chapterId: string, courseId: string) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const validated = chapterActionSchema.parse({ chapterId, courseId });
        await verifyChapterOwnership(validated.chapterId, userId);

        await db
            .update(chapters)
            .set({ isCompleted: true })
            .where(eq(chapters.id, validated.chapterId));

        const userDb = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (userDb) {
            const now = new Date();
            const today = now.toDateString();
            const lastActiveDate = userDb.lastActive
                ? new Date(userDb.lastActive).toDateString()
                : null;

            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayString = yesterday.toDateString();

            let newStreak = userDb.currentStreak || 0;

            if (lastActiveDate === yesterdayString) {
                newStreak += 1;
            } else if (lastActiveDate !== today) {
                newStreak = 1;
            }

            const isoDate = now.toISOString().split("T")[0];
            const currentActivityMap =
                (userDb.activityMap as Record<string, number>) || {};
            const newActivityMap = {
                ...currentActivityMap,
                [isoDate]: (currentActivityMap[isoDate] || 0) + 1,
            };

            await db
                .update(users)
                .set({
                    currentStreak: newStreak,
                    lastActive: now,
                    activityMap: newActivityMap,
                })
                .where(eq(users.id, userId));
        }

        revalidatePath(`/courses/${validated.courseId}/chapters/${validated.chapterId}`);
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
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const validated = toggleBookmarkSchema.parse({
            chapterId,
            courseId,
            currentStatus,
        });
        await verifyChapterOwnership(validated.chapterId, userId);

        await db
            .update(chapters)
            .set({ isBookmarked: !validated.currentStatus })
            .where(eq(chapters.id, validated.chapterId));

        revalidatePath(`/courses/${validated.courseId}`);
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
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const rateLimit = await checkRateLimit(userId);
        if (!rateLimit.success) {
            throw new Error("RATE_LIMIT_EXCEEDED: You have reached your hourly AI generation limit.");
        }

        const chapter = await verifyChapterOwnership(chapterId, userId);

        await db
            .update(chapters)
            .set({ lessonText: "GENERATING" })
            .where(eq(chapters.id, chapterId));

        let contextText = "";
        try {
            const queryVector = await getEmbeddingVector(`Course: ${courseTopic}. Chapter: ${chapterTitle}`);

            if (queryVector) {
                const similarChunks = await db
                    .select({
                        content: documentChunks.content,
                        similarity: sql<number>`1 - (${cosineDistance(documentChunks.embedding, queryVector)})`
                    })
                    .from(documentChunks)
                    .innerJoin(documents, eq(documents.id, documentChunks.documentId))
                    .where(eq(documents.courseId, chapter.courseId))
                    .orderBy(t => desc(t.similarity))
                    .limit(5);

                if (similarChunks.length > 0) {
                    contextText = "Relevant Source Document Context:\n" + similarChunks.map(c => c.content).join("\n\n");
                }
            }
        } catch (e) {
            console.error("Vector search failed, proceeding without RAG context", e);
        }

        const prompt = `
            You are an expert tutor writing a comprehensive educational lesson.
            Course Subject: ${courseTopic}
            Current Chapter: ${chapterTitle}

            ${contextText ? contextText : ""}

            Write a highly detailed, engaging, and easy-to-understand lesson for this chapter.
            Use Markdown formatting (headings, bullet points, bold text).
            Include real-world examples, analogies, and a brief summary at the end.
            If context is provided above, use it as the primary source of truth.
            Do NOT include the chapter title as an H1, just start directly with the content.
        `;

        // High reasoning model for full lesson creation
        const model = getGenAI().getGenerativeModel({ model: "gemini-3.6-flash" });
        const result = await withRetry(() => model.generateContent(prompt));
        const lessonContent = result.response.text();

        await db
            .update(chapters)
            .set({ lessonText: lessonContent })
            .where(eq(chapters.id, chapterId));

        revalidatePath(`/courses/[courseId]/chapters/${chapterId}`, "page");

        return { success: true, lessonText: lessonContent };
    } catch (error: any) {
        await db
            .update(chapters)
            .set({ lessonText: null })
            .where(eq(chapters.id, chapterId));

        console.error("Error generating lesson:", error);
        throw new Error(error?.message || "Failed to generate lesson content");
    }
}

export async function generateChapterMermaid(
    chapterId: string,
    courseTopic: string,
    chapterTitle: string,
) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const rateLimit = await checkRateLimit(userId);
        if (!rateLimit.success) {
            throw new Error("RATE_LIMIT_EXCEEDED: You have reached your hourly AI generation limit.");
        }

        const chapter = await verifyChapterOwnership(chapterId, userId);

        if (!chapter.lessonText) {
            throw new Error("Chapter lesson text not found");
        }

        const prompt = `
            You are an expert in visual education. Based on the following lesson text for the chapter "${chapterTitle}" in the course "${courseTopic}", generate a SINGLE Mermaid diagram (e.g. flowchart, sequence diagram, state diagram, etc.) that visually explains a key concept from the lesson.
            
            CRITICAL: Return ONLY the raw Mermaid code block. Do NOT include any explanations or markdown outside the code block. Start with \`\`\`mermaid and end with \`\`\`.
            CRITICAL SYNTAX RULES:
            1. All node labels MUST be enclosed in double quotes (e.g., A["Cluster Management Manager"] instead of A[Cluster Management Manager]).
            2. Do NOT use hyphen dashes (-), square brackets ([]), parentheses (()), or special characters inside unquoted node IDs or node labels.
            3. Do NOT use HTML tags (like <br>) anywhere.
            4. Do NOT include any code comments (such as // or %%).
            5. Ensure all arrows (--> or ---) and node definitions are clean and valid.

            Lesson Text:
            ${chapter.lessonText}
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
        const result = await withRetry(() => model.generateContent(prompt));
        let mermaidContent = result.response.text();
        
        mermaidContent = mermaidContent.replace(/```mermaid\n?/i, "").replace(/```/g, "").trim();

        await db
            .update(chapters)
            .set({ mermaidDiagram: mermaidContent })
            .where(eq(chapters.id, chapterId));

        revalidatePath(`/courses/[courseId]/chapters/${chapterId}`, "page");

        return { success: true, mermaidDiagram: mermaidContent };
    } catch (error: any) {
        console.error("Error generating mermaid diagram:", error);
        throw new Error(error?.message || "Failed to generate mermaid diagram");
    }
}

export async function generateChapterFlashcards(chapterId: string) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const rateLimit = await checkRateLimit(userId);
        if (!rateLimit.success) {
            throw new Error("RATE_LIMIT_EXCEEDED: You have reached your hourly AI generation limit.");
        }

        const validated = flashcardQuerySchema.parse({ chapterId });
        const chapter = await verifyChapterOwnership(validated.chapterId, userId);

        if (!chapter.lessonText) {
            throw new Error("Chapter lesson text not found");
        }

        const prompt = `
            Based on the following lesson text, generate 5-10 flashcards that cover the most important concepts.
            
            CRITICAL: You must ALWAYS respond with a valid JSON array of objects. Each object must have a "front" (the question or term) and a "back" (the answer or definition).
            
            Lesson Text:
            ${chapter.lessonText}
        `;

        // Model optimization: Use gemini-3.5-flash-lite for flashcards
        const model = getGenAI().getGenerativeModel({ model: "gemini-3.5-flash-lite" });
        const result = await withRetry(() =>
            model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" },
            })
        );

        const responseText = result.response.text();
        let flashcardsData;
        try {
            const cleanedText = responseText
                .replace(/```json\n?/gi, "")
                .replace(/```/g, "")
                .trim();
            flashcardsData = JSON.parse(cleanedText);
        } catch (e) {
            console.error("Failed to parse AI response:", responseText);
            throw new Error("Failed to format flashcards properly.");
        }

        if (!Array.isArray(flashcardsData) || flashcardsData.length === 0) {
            throw new Error("The AI returned an empty flashcard list.");
        }

        const flashcardsToInsert = flashcardsData.map((fc: any) => ({
            chapterId: validated.chapterId,
            front: fc.front,
            back: fc.back,
        }));

        await db.insert(flashcards).values(flashcardsToInsert);

        revalidatePath(`/courses/[courseId]/chapters/${validated.chapterId}`, "page");

        return { success: true, flashcards: flashcardsToInsert };
    } catch (error: any) {
        console.error("Error generating flashcards:", error);
        throw new Error(error?.message || "Failed to generate flashcards");
    }
}
