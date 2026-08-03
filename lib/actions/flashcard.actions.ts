"use server";

import { db } from "@/lib/db";
import { flashcards, chapters, courses } from "@/lib/db/schema";
import { eq, and, or } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { calculateSM2 } from "@/lib/utils/sm2";
import { flashcardReviewSchema, flashcardQuerySchema } from "@/lib/validations";
import { trackEvent } from "@/lib/analytics";

/**
 * Fetch flashcards that are due for review (nextReviewAt <= now), with ownership verification.
 */
export async function getFlashcardsDueForReview(chapterId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const validated = flashcardQuerySchema.parse({ chapterId });

    // Verify row-level access (chapter belongs to a course authored by user or is public)
    const chapter = await db.query.chapters.findFirst({
        where: eq(chapters.id, validated.chapterId),
        with: { course: true },
    });

    if (!chapter || (chapter.course.author !== userId && !chapter.course.isPublic)) {
        throw new Error("Unauthorized access to flashcards");
    }

    const now = new Date();
    const dueCards = await db
        .select()
        .from(flashcards)
        .where(eq(flashcards.chapterId, validated.chapterId))
        .orderBy(flashcards.nextReviewAt);

    return dueCards.filter((card) => new Date(card.nextReviewAt) <= now);
}

/**
 * Get all flashcards for a chapter, with user ownership verification.
 */
export async function getAllFlashcards(chapterId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const validated = flashcardQuerySchema.parse({ chapterId });

    // Verify row-level access
    const chapter = await db.query.chapters.findFirst({
        where: eq(chapters.id, validated.chapterId),
        with: { course: true },
    });

    if (!chapter || (chapter.course.author !== userId && !chapter.course.isPublic)) {
        throw new Error("Unauthorized access to flashcards");
    }

    return db
        .select()
        .from(flashcards)
        .where(eq(flashcards.chapterId, validated.chapterId))
        .orderBy(flashcards.nextReviewAt);
}

/**
 * SM-2 Spaced Repetition Review with full input validation and authorization.
 */
export async function reviewFlashcard(
    flashcardId: string,
    quality: 0 | 1 | 2 | 3,
) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const validated = flashcardReviewSchema.parse({ flashcardId, quality });

    const card = await db.query.flashcards.findFirst({
        where: eq(flashcards.id, validated.flashcardId),
        with: {
            chapter: {
                with: {
                    course: true,
                },
            },
        },
    });

    if (!card) throw new Error("Flashcard not found");

    // Row-level ownership check
    if (card.chapter.course.author !== userId) {
        throw new Error("Unauthorized: You do not own this flashcard");
    }

    const { easeFactor: newEaseFactor, interval: newInterval } = calculateSM2(
        validated.quality,
        card.easeFactor,
        card.interval
    );

    const nextReview = new Date();
    if (newInterval === 1 && validated.quality < 2) {
        nextReview.setMinutes(nextReview.getMinutes() + 10);
    } else {
        nextReview.setDate(nextReview.getDate() + newInterval);
    }

    await db
        .update(flashcards)
        .set({
            easeFactor: newEaseFactor,
            interval: newInterval,
            nextReviewAt: nextReview,
        })
        .where(eq(flashcards.id, validated.flashcardId));

    await trackEvent(userId, "flashcard_reviewed", {
        flashcardId: validated.flashcardId,
        quality: validated.quality,
        newInterval,
        newEaseFactor,
    });

    return {
        success: true,
        nextReviewAt: nextReview.toISOString(),
        interval: newInterval,
    };
}
