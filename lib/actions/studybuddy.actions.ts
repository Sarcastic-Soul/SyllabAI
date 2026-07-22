"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { documentChunks, documents, studyBuddyMessages } from "@/lib/db/schema";
import { eq, sql, cosineDistance, desc, and, asc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Fetch full conversation history for a course (for UI scroll-back).
 */
export async function getConversationHistory(courseId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return db
    .select()
    .from(studyBuddyMessages)
    .where(
      and(
        eq(studyBuddyMessages.courseId, courseId),
        eq(studyBuddyMessages.userId, userId),
      )
    )
    .orderBy(asc(studyBuddyMessages.createdAt));
}

/**
 * Clear all conversation history for a course.
 */
export async function clearConversationHistory(courseId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db
    .delete(studyBuddyMessages)
    .where(
      and(
        eq(studyBuddyMessages.courseId, courseId),
        eq(studyBuddyMessages.userId, userId),
      )
    );

  return { success: true };
}

/**
 * Ask the Study Buddy a question with:
 * - Conversation memory (last 5 messages from DB)
 * - RAG context (top 3 chunks, reduced from 5 for Flash Lite)
 * - Course structure context
 *
 * Both user message and AI response are persisted to the database.
 */
export async function askStudyBuddy(
  question: string,
  courseTopic: string,
  courseStructure: string,
  courseId?: string,
) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // 1. Save the user's message to DB
    if (courseId) {
      await db.insert(studyBuddyMessages).values({
        courseId,
        userId,
        role: "user",
        content: question,
      });
    }

    // 2. Load recent conversation history (last 5 messages for context budget)
    let conversationContext = "";
    if (courseId) {
      const recentMessages = await db
        .select()
        .from(studyBuddyMessages)
        .where(
          and(
            eq(studyBuddyMessages.courseId, courseId),
            eq(studyBuddyMessages.userId, userId),
          )
        )
        .orderBy(desc(studyBuddyMessages.createdAt))
        .limit(5);

      // Reverse to chronological order
      const chronological = recentMessages.reverse();

      if (chronological.length > 1) {
        // Exclude the current question (already in prompt)
        const priorMessages = chronological.slice(0, -1);
        conversationContext = "Recent Conversation:\n" +
          priorMessages
            .map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.content}`)
            .join("\n");
      }
    }

    // 3. RAG Vector Search (reduced to 3 chunks for Flash Lite context budget)
    let contextText = "";
    if (courseId) {
      try {
        const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const embeddingResult = await embedModel.embedContent(question);
        const queryVector = embeddingResult.embedding.values;

        const similarChunks = await db
          .select({
            content: documentChunks.content,
            similarity: sql<number>`1 - (${cosineDistance(documentChunks.embedding, queryVector)})`
          })
          .from(documentChunks)
          .innerJoin(documents, eq(documents.id, documentChunks.documentId))
          .where(eq(documents.courseId, courseId))
          .orderBy(t => desc(t.similarity))
          .limit(3); // Reduced from 5 for Flash Lite

        if (similarChunks.length > 0) {
          contextText = "Relevant Source Document Context:\n" + similarChunks.map(c => c.content).join("\n\n");
        }
      } catch (e) {
        // Silently proceed without RAG if vector search fails
      }
    }

    // 4. Build prompt with context budget in mind (~3500 tokens)
    const prompt = `
            You are "Study Buddy", a friendly, encouraging AI voice tutor helping a student learn about ${courseTopic}.
            You act as their ultimate "Doubt Clearer".

            Here is the structure of the course they are taking:
            ${courseStructure}

            ${conversationContext ? conversationContext : ""}

            ${contextText ? contextText : ""}

            Student asks: "${question}"

            Reply directly to the student based on the context provided (if any). If there's conversation history, acknowledge prior topics naturally.
            Keep your answers brief, highly conversational, and easy to understand when spoken out loud.
            DO NOT use Markdown formatting (like **, *, #) because your text will be read directly by a Text-to-Speech engine.
        `;

    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    // 5. Save the AI response to DB
    if (courseId) {
      await db.insert(studyBuddyMessages).values({
        courseId,
        userId,
        role: "ai",
        content: answer,
      });
    }

    return answer;
  } catch (error) {
    console.error("Error asking study buddy:", error);
    throw new Error("Failed to get response");
  }
}
