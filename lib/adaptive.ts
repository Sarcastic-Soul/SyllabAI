import { db } from "@/lib/db";
import { flashcards, chapters, courses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface AdaptiveMasteryMetrics {
  totalCards: number;
  reviewedCards: number;
  masteryScore: number; // 0 to 100
  retentionLevel: "Mastered" | "Review Recommended" | "Needs Attention";
  recommendedDifficulty: "Beginner" | "Intermediate" | "Advanced";
  weakConcepts: Array<{ front: string; back: string; easeFactor: number }>;
}

/**
 * Calculates adaptive mastery score and retention insights for a course based on SM-2 data.
 */
export async function calculateCourseMastery(
  courseId: string
): Promise<AdaptiveMasteryMetrics> {
  const allChapters = await db
    .select({ id: chapters.id })
    .from(chapters)
    .where(eq(chapters.courseId, courseId));

  if (allChapters.length === 0) {
    return {
      totalCards: 0,
      reviewedCards: 0,
      masteryScore: 0,
      retentionLevel: "Needs Attention",
      recommendedDifficulty: "Beginner",
      weakConcepts: [],
    };
  }

  const chapterIds = allChapters.map((c) => c.id);

  const cardList = await db.query.flashcards.findMany({
    where: (table, { inArray }) => inArray(table.chapterId, chapterIds),
  });

  if (cardList.length === 0) {
    return {
      totalCards: 0,
      reviewedCards: 0,
      masteryScore: 0,
      retentionLevel: "Needs Attention",
      recommendedDifficulty: "Beginner",
      weakConcepts: [],
    };
  }

  const totalCards = cardList.length;
  // A card is considered reviewed if its interval > 0 or easeFactor has changed from default (250)
  const reviewedCards = cardList.filter(
    (c) => c.interval > 0 || c.easeFactor !== 250
  ).length;

  if (reviewedCards === 0) {
    return {
      totalCards,
      reviewedCards: 0,
      masteryScore: 0,
      retentionLevel: "Review Recommended",
      recommendedDifficulty: "Beginner",
      weakConcepts: [],
    };
  }

  // Calculate weighted mastery score based on SM-2 ease factors and intervals
  // easeFactor is scaled by x100 in DB (default 250 = 2.5). Higher easeFactor & interval = higher retention.
  let weightedSum = 0;
  const weakConcepts: Array<{ front: string; back: string; easeFactor: number }> = [];

  for (const card of cardList) {
    const easeRatio = Math.min(1.5, Math.max(0.4, card.easeFactor / 250));
    const intervalBonus = Math.min(1.3, 1 + card.interval / 10);
    const cardScore = Math.min(100, Math.round(easeRatio * intervalBonus * 60));
    weightedSum += cardScore;

    if (card.easeFactor < 220 || card.interval === 0) {
      weakConcepts.push({
        front: card.front,
        back: card.back,
        easeFactor: card.easeFactor,
      });
    }
  }

  const masteryScore = Math.min(100, Math.round(weightedSum / totalCards));

  let retentionLevel: "Mastered" | "Review Recommended" | "Needs Attention" = "Needs Attention";
  let recommendedDifficulty: "Beginner" | "Intermediate" | "Advanced" = "Beginner";

  if (masteryScore >= 75) {
    retentionLevel = "Mastered";
    recommendedDifficulty = "Advanced";
  } else if (masteryScore >= 50) {
    retentionLevel = "Review Recommended";
    recommendedDifficulty = "Intermediate";
  } else {
    retentionLevel = "Needs Attention";
    recommendedDifficulty = "Beginner";
  }

  return {
    totalCards,
    reviewedCards,
    masteryScore,
    retentionLevel,
    recommendedDifficulty,
    weakConcepts: weakConcepts.slice(0, 5), // Return top 5 weak concepts
  };
}
