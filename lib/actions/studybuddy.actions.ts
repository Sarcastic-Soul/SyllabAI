"use server";

import { db } from "@/lib/db";
import { studyBuddyMessages, courses } from "@/lib/db/schema";
import { eq, desc, and, asc } from "drizzle-orm";
import { getUserId } from "@/lib/auth/session";
import {
  askStudyBuddySchema,
  studyBuddyCourseQuerySchema,
} from "@/lib/validations";
import { generate } from "@/lib/ai/generate";
import { retrieveChunks } from "@/lib/retrieval";

/**
 * Fetch full conversation history for a course with row-level ownership/access checks.
 */
export async function getConversationHistory(courseId: string) {
  const userId = await getUserId();
  if (!userId) throw new Error("Unauthorized");

  const validated = studyBuddyCourseQuerySchema.parse({ courseId });

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, validated.courseId),
  });

  if (!course || (course.author !== userId && !course.isPublic)) {
    throw new Error("Unauthorized access to conversation history");
  }

  return db
    .select()
    .from(studyBuddyMessages)
    .where(
      and(
        eq(studyBuddyMessages.courseId, validated.courseId),
        eq(studyBuddyMessages.userId, userId),
      )
    )
    .orderBy(asc(studyBuddyMessages.createdAt));
}

/**
 * Clear all conversation history for a course.
 */
export async function clearConversationHistory(courseId: string) {
  const userId = await getUserId();
  if (!userId) throw new Error("Unauthorized");

  const validated = studyBuddyCourseQuerySchema.parse({ courseId });

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, validated.courseId),
  });

  if (!course || course.author !== userId) {
    throw new Error("Unauthorized: You do not own this course");
  }

  await db
    .delete(studyBuddyMessages)
    .where(
      and(
        eq(studyBuddyMessages.courseId, validated.courseId),
        eq(studyBuddyMessages.userId, userId),
      )
    );

  return { success: true };
}

/**
 * Ask the Study Buddy a question with withRetry, and Gemini Flash Lite optimization.
 */
export async function askStudyBuddy(
  question: string,
  courseTopic: string,
  courseStructure: string,
  courseId?: string,
) {
  try {
    const userId = await getUserId();
    if (!userId) throw new Error("Unauthorized");


    const validated = askStudyBuddySchema.parse({
      question,
      courseTopic,
      courseStructure,
      courseId,
    });

    if (validated.courseId) {
      const course = await db.query.courses.findFirst({
        where: eq(courses.id, validated.courseId),
      });

      if (!course || (course.author !== userId && !course.isPublic)) {
        throw new Error("Unauthorized access to course Study Buddy");
      }

      await db.insert(studyBuddyMessages).values({
        courseId: validated.courseId,
        userId,
        role: "user",
        content: validated.question,
      });
    }

    let conversationContext = "";
    if (validated.courseId) {
      const recentMessages = await db
        .select()
        .from(studyBuddyMessages)
        .where(
          and(
            eq(studyBuddyMessages.courseId, validated.courseId),
            eq(studyBuddyMessages.userId, userId),
          )
        )
        .orderBy(desc(studyBuddyMessages.createdAt))
        .limit(5);

      const chronological = recentMessages.reverse();

      if (chronological.length > 1) {
        const priorMessages = chronological.slice(0, -1);
        conversationContext = "Recent Conversation:\n" +
          priorMessages
            .map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.content}`)
            .join("\n") + "\n\n";
      }
    }

    let ragContext = "";
    if (validated.courseId) {
      try {
        const similarChunks = await retrieveChunks({
          courseId: validated.courseId,
          query: validated.question,
          limit: 3,
          userId,
        });

        if (similarChunks.length > 0) {
          ragContext =
            "Relevant Course Document Context:\n" +
            similarChunks.map((c) => c.content).join("\n---\n") +
            "\n\n";
        }
      } catch (ragError) {
        console.warn("Study Buddy RAG search failed (proceeding without RAG context):", ragError);
      }
    }

    const systemPrompt = `You are "SyllabAI Study Buddy", an encouraging, knowledgeable AI tutor.
You help students master their course material through clear explanations, analogies, and practice hints.
Be concise, clear, and supportive. Use markdown formatting for readability.

Course Topic: ${validated.courseTopic}
Course Structure Overview:
${validated.courseStructure}

${ragContext}${conversationContext}`;

    const { data: reply } = await generate({
      step: "study_buddy",
      prompt: systemPrompt + "\nStudent Question: " + validated.question,
      preferredModel: "gemini-3.5-flash-lite",
      userId,
    });

    if (validated.courseId) {
      await db.insert(studyBuddyMessages).values({
        courseId: validated.courseId,
        userId,
        role: "ai",
        content: reply,
      });
    }

    return { answer: reply };
  } catch (error) {
    console.error("Error in askStudyBuddy:", error);
    throw new Error((error instanceof Error && error.message) || "Failed to get response from Study Buddy.");
  }
}
