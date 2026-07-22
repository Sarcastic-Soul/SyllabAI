import type { getUserCourses, getUserDb } from "@/lib/queries";

/**
 * Inferred types from Drizzle query results.
 * These replace manual `any` types across the codebase.
 */

// The shape returned by getUserCourses — a course with nested chapters (each with quizzes)
export type UserCourseWithChapters = Awaited<ReturnType<typeof getUserCourses>>[number];

// The shape returned by getUserDb
export type UserDb = NonNullable<Awaited<ReturnType<typeof getUserDb>>>;

// Convenience: a chapter within UserCourseWithChapters
export type ChapterWithQuizzes = UserCourseWithChapters["chapters"][number];

// Convenience: a quiz within a chapter
export type QuizSelect = ChapterWithQuizzes["quizzes"][number];
