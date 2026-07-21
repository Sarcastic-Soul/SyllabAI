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

            // Update Activity Map
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
        // Set placeholder state to prevent duplicate submissions on refresh
        await db
            .update(chapters)
            .set({ lessonText: "GENERATING" })
            .where(eq(chapters.id, chapterId));

        const prompt = `
            You are an expert tutor writing a comprehensive educational lesson.
            Course Subject: ${courseTopic}
            Current Chapter: ${chapterTitle}

            Write a highly detailed, engaging, and easy-to-understand lesson for this chapter.
            Use Markdown formatting (headings, bullet points, bold text).
            Include real-world examples, analogies, and a brief summary at the end.
            Do NOT include the chapter title as an H1, just start directly with the content.
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
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
        // Revert placeholder state if generation fails
        await db
            .update(chapters)
            .set({ lessonText: null })
            .where(eq(chapters.id, chapterId));

        console.error("Error generating lesson:", error);
        throw new Error("Failed to generate lesson content");
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

        const chapter = await db.query.chapters.findFirst({
            where: eq(chapters.id, chapterId),
        });

        if (!chapter || !chapter.lessonText) {
            throw new Error("Chapter lesson text not found");
        }

        const prompt = `
            You are an expert in visual education. Based on the following lesson text for the chapter "${chapterTitle}" in the course "${courseTopic}", generate a SINGLE Mermaid diagram (e.g. flowchart, sequence diagram, state diagram, etc.) that visually explains a key concept from the lesson.
            
            CRITICAL: Return ONLY the raw Mermaid code block. Do NOT include any explanations or markdown outside the code block. Start with \`\`\`mermaid and end with \`\`\`.
            CRITICAL: The Mermaid syntax MUST be perfectly valid. Do NOT use any HTML tags (like <br>) in node labels. If a node label contains special characters (like parentheses, commas, or brackets), you MUST enclose the label in double quotes (e.g. \`A["Node (Info)"]\` instead of \`A[Node (Info)]\`). Keep node labels concise.
            CRITICAL: Do NOT include ANY comments (such as // or %%) anywhere in the Mermaid code. Ensure all node relationships are perfectly formatted.

            Lesson Text:
            ${chapter.lessonText}
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
        const result = await model.generateContent(prompt);
        let mermaidContent = result.response.text();
        
        // Clean up markdown block if present
        mermaidContent = mermaidContent.replace(/```mermaid\n?/i, "").replace(/```/g, "").trim();

        await db
            .update(chapters)
            .set({ mermaidDiagram: mermaidContent })
            .where(eq(chapters.id, chapterId));

        revalidatePath(`/courses/[courseId]/chapters/${chapterId}`, "page");

        return { success: true, mermaidDiagram: mermaidContent };
    } catch (error) {
        console.error("Error generating mermaid diagram:", error);
        throw new Error("Failed to generate mermaid diagram");
    }
}

export async function generateChapterFlashcards(chapterId: string) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const chapter = await db.query.chapters.findFirst({
            where: eq(chapters.id, chapterId),
        });

        if (!chapter || !chapter.lessonText) {
            throw new Error("Chapter lesson text not found");
        }

        const prompt = `
            Based on the following lesson text, generate 5-10 flashcards that cover the most important concepts.
            
            CRITICAL: You must ALWAYS respond with a valid JSON array of objects. Each object must have a "front" (the question or term) and a "back" (the answer or definition).
            
            Lesson Text:
            ${chapter.lessonText}
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" },
        });

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

        // Insert into database
        const { flashcards } = await import("@/lib/db/schema");
        const flashcardsToInsert = flashcardsData.map((fc: any) => ({
            chapterId: chapterId,
            front: fc.front,
            back: fc.back,
        }));

        await db.insert(flashcards).values(flashcardsToInsert);

        revalidatePath(`/courses/[courseId]/chapters/${chapterId}`, "page");

        return { success: true, flashcards: flashcardsToInsert };
    } catch (error) {
        console.error("Error generating flashcards:", error);
        throw new Error("Failed to generate flashcards");
    }
}
