"use server";

import { db } from "@/lib/db";
import { flashcards } from "@/lib/db/schema";
import { eq, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { calculateSM2 } from "@/lib/utils/sm2";
/**
 * Fetch flashcards that are due for review (nextReviewAt <= now).
 * If none are due, returns an empty array.
 */
export async function getFlashcardsDueForReview(chapterId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const now = new Date();
    const dueCards = await db
        .select()
        .from(flashcards)
        .where(eq(flashcards.chapterId, chapterId))
        .orderBy(flashcards.nextReviewAt);

    // Filter due cards (nextReviewAt <= now) and not-yet-reviewed cards
    return dueCards.filter((card) => new Date(card.nextReviewAt) <= now);
}

/**
 * Get all flashcards for a chapter (regardless of review status).
 */
export async function getAllFlashcards(chapterId: string) {
    return db
        .select()
        .from(flashcards)
        .where(eq(flashcards.chapterId, chapterId))
        .orderBy(flashcards.nextReviewAt);
}

/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Quality ratings:
 *   0 = "Again" (complete blackout)
 *   1 = "Hard" (incorrect, but remembered after seeing answer)
 *   2 = "Good" (correct with some hesitation)
 *   3 = "Easy" (correct with perfect recall)
 *
 */
export async function reviewFlashcard(
    flashcardId: string,
    quality: 0 | 1 | 2 | 3,
) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const card = await db.query.flashcards.findFirst({
        where: eq(flashcards.id, flashcardId),
    });

    if (!card) throw new Error("Flashcard not found");

    const { easeFactor: newEaseFactor, interval: newInterval } = calculateSM2(quality, card.easeFactor, card.interval);

    // Calculate next review date
    const nextReview = new Date();
    if (newInterval === 1 && quality < 2) {
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
        .where(eq(flashcards.id, flashcardId));

    return {
        success: true,
        nextReviewAt: nextReview.toISOString(),
        interval: newInterval,
    };
}
