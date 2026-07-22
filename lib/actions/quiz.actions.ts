"use server";

import { db } from "@/lib/db";
import { quizzes, questions } from "@/lib/db/schema";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Add courseId as the 3rd parameter
export async function generateChapterQuiz(
  chapterId: string,
  lessonText: string,
  courseId: string,
) {
  try {
    const prompt = `
            You are a strict teacher creating a multiple-choice quiz based ONLY on the provided lesson text.
            Do not include questions about topics not covered in the text.
            Generate 3 questions.

            Return the response strictly as a JSON array of objects. Do not include markdown formatting like \`\`\`json.
            Each object must have these exactly keys:
            - "questionText": The actual question.
            - "options": An array of exactly 4 string options.
            - "correctAnswer": The integer index (0, 1, 2, or 3) of the correct option.

            Lesson Text:
            ${lessonText}
        `;

    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const result = await model.generateContent(prompt);

    const cleanedText = result.response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const generatedQuestions = JSON.parse(cleanedText);

    const [newQuiz] = await db
      .insert(quizzes)
      .values({
        chapterId: chapterId,
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

    // NEW: Instantly refresh the specific chapter page
    revalidatePath(`/courses/${courseId}/chapters/${chapterId}`);

    return newQuiz.id;
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error("Failed to generate quiz");
  }
}

export async function submitQuizScore(
  quizId: string,
  score: number,
  chapterId: string,
  courseId: string,
) {
  await db
    .update(quizzes)
    .set({ score, isCompleted: true })
    .where(eq(quizzes.id, quizId));
  revalidatePath(`/courses/${courseId}/chapters/${chapterId}`);
}
