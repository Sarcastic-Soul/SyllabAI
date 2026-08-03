import { cache } from "react";
import { db } from "@/lib/db";
import { courses, chapters, users } from "@/lib/db/schema";
import { eq, desc, and, or } from "drizzle-orm";

/**
 * Fetch a course with chapters, strictly scoped to the requesting user OR public courses.
 */
export const getCourseWithChapters = cache(
    async (courseId: string, userId?: string) => {
        const whereClause = userId
            ? and(eq(courses.id, courseId), or(eq(courses.author, userId), eq(courses.isPublic, true)))
            : eq(courses.id, courseId);

        return db.query.courses.findFirst({
            where: whereClause,
            with: {
                chapters: {
                    orderBy: (chapters, { asc }) => [asc(chapters.order)],
                    with: {
                        quizzes: true,
                    },
                },
            },
        });
    }
);

/**
 * Fetch a chapter with full details (quizzes, questions, flashcards), ensuring row-level access control.
 */
export const getChapterWithDetails = cache(
    async (chapterId: string, userId?: string) => {
        const chapter = await db.query.chapters.findFirst({
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

        if (!chapter) return null;

        // Row-level check: ensure requester is author OR course is public
        if (userId && chapter.course.author !== userId && !chapter.course.isPublic) {
            return null;
        }

        return chapter;
    }
);

/**
 * Fetch all courses belonging to a specific user.
 */
export const getUserCourses = cache(async (userId: string) => {
    if (!userId) return [];
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

/**
 * Fetch user record by Clerk ID.
 */
export const getUserDb = cache(async (userId: string) => {
    if (!userId) return null;
    return db.query.users.findFirst({
        where: eq(users.id, userId),
    });
});

/**
 * Fetch a public course by share slug.
 */
export const getCourseBySlug = cache(async (slug: string) => {
    return db.query.courses.findFirst({
        where: and(eq(courses.shareSlug, slug), eq(courses.isPublic, true)),
        with: {
            chapters: {
                orderBy: (chapters, { asc }) => [asc(chapters.order)],
            },
        },
    });
});

/**
 * Fetch a public chapter by ID.
 */
export const getPublicChapter = cache(async (chapterId: string) => {
    const chapter = await db.query.chapters.findFirst({
        where: eq(chapters.id, chapterId),
        with: {
            course: true,
        },
    });

    if (!chapter || !chapter.course.isPublic) {
        return null;
    }

    return chapter;
});
