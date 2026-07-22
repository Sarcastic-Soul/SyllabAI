import { cache } from "react";
import { db } from "@/lib/db";
import { courses, chapters, users } from "@/lib/db/schema";
import { eq, desc, asc } from "drizzle-orm";

export const getCourseWithChapters = cache(async (courseId: string) => {
    return db.query.courses.findFirst({
        where: eq(courses.id, courseId),
        with: {
            chapters: {
                orderBy: (chapters, { asc }) => [asc(chapters.order)],
                with: {
                    quizzes: true,
                },
            },
        },
    });
});

export const getChapterWithDetails = cache(async (chapterId: string) => {
    return db.query.chapters.findFirst({
        where: eq(chapters.id, chapterId),
        with: {
            course: true,
            quizzes: {
                with: {
                    questions: true,
                },
            },
            flashcards: true,
        },
    });
});

export const getUserCourses = cache(async (userId: string) => {
    return db.query.courses.findMany({
        where: eq(courses.author, userId),
        orderBy: [desc(courses.createdAt)],
        with: {
            chapters: {
                with: {
                    quizzes: true,
                },
            },
        },
    });
});

export const getUserDb = cache(async (userId: string) => {
    return db.query.users.findFirst({
        where: eq(users.id, userId),
    });
});

export const getCourseBySlug = cache(async (slug: string) => {
    return db.query.courses.findFirst({
        where: eq(courses.shareSlug, slug),
        with: {
            chapters: {
                orderBy: (chapters, { asc }) => [asc(chapters.order)],
            },
        },
    });
});

export const getPublicChapter = cache(async (chapterId: string) => {
    return db.query.chapters.findFirst({
        where: eq(chapters.id, chapterId),
        with: {
            course: true,
        },
    });
});
