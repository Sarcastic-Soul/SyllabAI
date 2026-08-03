import { z } from "zod";

export const createCourseSchema = z.object({
    topic: z
        .string()
        .min(2, "Topic must be at least 2 characters")
        .max(100, "Topic must be under 100 characters")
        .trim(),
    duration: z
        .number()
        .min(1, "Duration must be at least 1 module/week")
        .max(20, "Duration cannot exceed 20 modules/weeks"),
    difficulty: z.enum([
        "Beginner",
        "Intermediate",
        "Advanced",
        "beginner",
        "intermediate",
        "advanced",
    ]),
});

export const chapterActionSchema = z.object({
    chapterId: z.string().uuid("Invalid chapter ID format"),
    courseId: z.string().uuid("Invalid course ID format"),
});

export const toggleBookmarkSchema = z.object({
    chapterId: z.string().uuid("Invalid chapter ID format"),
    courseId: z.string().uuid("Invalid course ID format"),
    currentStatus: z.boolean(),
});

export const generateLessonSchema = z.object({
    chapterId: z.string().uuid("Invalid chapter ID format"),
    courseTopic: z.string().min(1, "Course topic is required"),
    chapterTitle: z.string().min(1, "Chapter title is required"),
    courseId: z.string().uuid("Invalid course ID format"),
});

export const generateQuizSchema = z.object({
    chapterId: z.string().uuid("Invalid chapter ID format"),
    lessonText: z.string().min(10, "Lesson text must be at least 10 characters"),
    courseId: z.string().uuid("Invalid course ID format"),
});

export const submitQuizScoreSchema = z.object({
    quizId: z.string().uuid("Invalid quiz ID format"),
    score: z.number().min(0, "Score cannot be negative").max(100, "Score max is 100"),
    chapterId: z.string().uuid("Invalid chapter ID format"),
    courseId: z.string().uuid("Invalid course ID format"),
});

export const flashcardReviewSchema = z.object({
    flashcardId: z.string().uuid("Invalid flashcard ID format"),
    quality: z.union([
        z.literal(0),
        z.literal(1),
        z.literal(2),
        z.literal(3),
    ]),
});

export const flashcardQuerySchema = z.object({
    chapterId: z.string().uuid("Invalid chapter ID format"),
});

export const askStudyBuddySchema = z.object({
    question: z
        .string()
        .min(1, "Question cannot be empty")
        .max(1000, "Question is too long")
        .trim(),
    courseTopic: z.string().min(1, "Course topic is required"),
    courseStructure: z.string().min(1, "Course structure is required"),
    courseId: z.string().uuid("Invalid course ID format").optional(),
});

export const studyBuddyCourseQuerySchema = z.object({
    courseId: z.string().uuid("Invalid course ID format"),
});
