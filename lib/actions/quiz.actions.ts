"use server";

import { db } from "@/lib/db";
import { quizzes, questions, courses } from "@/lib/db/schema";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { generateQuizSchema, submitQuizScoreSchema } from "@/lib/validations";
import { withRetry } from "@/lib/utils/retry";
import { checkRateLimit } from "@/lib/ratelimit";
import { calculateCourseMastery } from "@/lib/adaptive";
import { getGenAI } from "@/lib/quota";

export async function generateChapterQuiz(
  chapterId: string,
  lessonText: string,
  courseId: string,
) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const rateLimit = await checkRateLimit(userId);
    if (!rateLimit.success) {
      throw new Error("RATE_LIMIT_EXCEEDED: You have reached your hourly AI generation limit.");
    }

    const validated = generateQuizSchema.parse({ chapterId, lessonText, courseId });

    // Verify row-level ownership of the target course
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, validated.courseId),
    });

    if (!course || course.author !== userId) {
      throw new Error("Unauthorized: You do not own this course");
    }

    // Fetch adaptive mastery metrics to customize AI quiz generation prompt
    const masteryMetrics = await calculateCourseMastery(validated.courseId);
    let adaptiveGuidance = "";

    if (masteryMetrics.weakConcepts.length > 0) {
      const weakTitles = masteryMetrics.weakConcepts.map((w) => `"${w.front}"`).join(", ");
      adaptiveGuidance = `
      ADAPTIVE INSTRUCTION (SM-2 Spaced Repetition Tuning):
      The student has shown lower retention in these specific concepts: ${weakTitles}.
      Ensure at least 1-2 questions directly assess understanding of these weak concepts with diagnostic option choices.
      `;
    } else if (masteryMetrics.recommendedDifficulty === "Advanced") {
      adaptiveGuidance = `
      ADAPTIVE INSTRUCTION (High Mastery Level - Advanced Mode):
      The student has mastered previous material (>75% retention). Generate challenging, analytical application questions requiring critical thinking.
      `;
    }

    const prompt = `
            You are a strict teacher creating a multiple-choice quiz based ONLY on the provided lesson text.
            Do not include questions about topics not covered in the text.
            Generate 3 questions.
            ${adaptiveGuidance}

            Return the response strictly as a JSON array of objects. Do not include markdown formatting like \`\`\`json.
            Each object must have these exact keys:
            - "questionText": The actual question.
            - "options": An array of exactly 4 string options.
            - "correctAnswer": The integer index (0, 1, 2, or 3) of the correct option.

            Lesson Text:
            ${validated.lessonText}
        `;

    // Model optimization: Use gemini-3.5-flash-lite for quizzes
    const model = getGenAI().getGenerativeModel({ model: "gemini-3.5-flash-lite" });
    const result = await withRetry(() => model.generateContent(prompt));

    const cleanedText = result.response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const generatedQuestions = JSON.parse(cleanedText);

    const [newQuiz] = await db
      .insert(quizzes)
      .values({
        chapterId: validated.chapterId,
        isCompleted: false,
      })
      .returning();

    const questionsToInsert = generatedQuestions.map((q: any) => ({
      quizId: newQuiz.id,
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
    }));

    await db.insert(questions).values(questionsToInsert);

    revalidatePath(`/courses/${validated.courseId}/chapters/${validated.chapterId}`);

    return newQuiz.id;
  } catch (error: any) {
    console.error("Error generating quiz:", error);
    throw new Error(error?.message || "Failed to generate quiz");
  }
}

export async function submitQuizScore(
  quizId: string,
  score: number,
  chapterId: string,
  courseId: string,
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const validated = submitQuizScoreSchema.parse({ quizId, score, chapterId, courseId });

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, validated.courseId),
  });

  if (!course || course.author !== userId) {
    throw new Error("Unauthorized: You do not own this course");
  }

  await db
    .update(quizzes)
    .set({ score: validated.score, isCompleted: true })
    .where(eq(quizzes.id, validated.quizId));

  await trackEvent(userId, "quiz_completed", {
    quizId: validated.quizId,
    score: validated.score,
    chapterId: validated.chapterId,
    courseId: validated.courseId,
  });

  revalidatePath(`/courses/${validated.courseId}/chapters/${validated.chapterId}`);
}
