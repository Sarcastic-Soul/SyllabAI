import { z } from "zod";

// Zod schemas for the JSON that Gemini returns. The same schema is sent to
// Gemini as the response schema and used to check what comes back.

export const syllabusSchema = z
  .array(
    z.object({
      title: z.string().trim().min(1, "title must not be empty"),
      content: z.string().trim().min(1, "content must not be empty"),
    })
  )
  .min(1, "syllabus must have at least one chapter");

export type Syllabus = z.infer<typeof syllabusSchema>;

export const quizSchema = z
  .array(
    z.object({
      questionText: z.string().trim().min(1, "questionText must not be empty"),
      options: z
        .array(z.string().trim().min(1, "option must not be empty"))
        .length(4, "options must have exactly 4 items"),
      correctAnswer: z
        .number()
        .int("correctAnswer must be an integer")
        .min(0, "correctAnswer must be between 0 and 3")
        .max(3, "correctAnswer must be between 0 and 3"),
    })
  )
  .min(1, "quiz must have at least one question");

export type QuizQuestions = z.infer<typeof quizSchema>;

export const flashcardsSchema = z
  .array(
    z.object({
      front: z.string().trim().min(1, "front must not be empty"),
      back: z.string().trim().min(1, "back must not be empty"),
    })
  )
  .min(1, "flashcard list must not be empty");

export type GeneratedFlashcards = z.infer<typeof flashcardsSchema>;
