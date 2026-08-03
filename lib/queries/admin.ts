import { db } from "@/lib/db";
import { users, courses, chapters, quizzes, flashcards } from "@/lib/db/schema";
import { count, avg, sum, sql, desc, eq } from "drizzle-orm";

export interface PlatformStats {
  totalUsers: number;
  totalCourses: number;
  totalChapters: number;
  totalQuizzesTaken: number;
  averageQuizScore: number;
  totalTimeSpent: number;
}

export interface AdminCourseItem {
  id: string;
  topic: string;
  author: string;
  difficulty: string;
  chapterCount: number;
  isPublic: boolean;
  createdAt: Date;
}

export interface PopularTopic {
  topic: string;
  count: number;
}

/**
 * Fetch platform-wide metrics for the Admin/Teacher Dashboard
 */
export async function getAdminPlatformStats(): Promise<PlatformStats> {
  const [userCount] = await db.select({ value: count() }).from(users);
  const [courseCount] = await db.select({ value: count() }).from(courses);
  const [chapterCount] = await db.select({ value: count() }).from(chapters);

  const completedQuizzes = await db
    .select({ score: quizzes.score })
    .from(quizzes)
    .where(eq(quizzes.isCompleted, true));

  const totalQuizzesTaken = completedQuizzes.length;
  let totalScoreSum = 0;
  completedQuizzes.forEach((q) => {
    if (q.score !== null) {
      totalScoreSum += q.score;
    }
  });

  const averageQuizScore =
    totalQuizzesTaken > 0
      ? Math.round((totalScoreSum / (totalQuizzesTaken * 3)) * 100)
      : 0;

  const [timeSum] = await db
    .select({ total: sum(users.totalTimeSpent) })
    .from(users);

  return {
    totalUsers: userCount.value,
    totalCourses: courseCount.value,
    totalChapters: chapterCount.value,
    totalQuizzesTaken,
    averageQuizScore,
    totalTimeSpent: Number(timeSum.total || 0),
  };
}

/**
 * Fetch course performance analytics for admin table view
 */
export async function getAdminCourseAnalytics(): Promise<AdminCourseItem[]> {
  const courseList = await db.query.courses.findMany({
    with: {
      chapters: true,
    },
    orderBy: [desc(courses.createdAt)],
    limit: 50,
  });

  return courseList.map((c) => ({
    id: c.id,
    topic: c.topic,
    author: c.author,
    difficulty: c.difficulty,
    chapterCount: c.chapters.length,
    isPublic: c.isPublic,
    createdAt: c.createdAt,
  }));
}

/**
 * Get popular learning topics aggregation
 */
export async function getPopularTopics(): Promise<PopularTopic[]> {
  const topicCounts = await db
    .select({
      topic: courses.topic,
      count: count(courses.id),
    })
    .from(courses)
    .groupBy(courses.topic)
    .orderBy(desc(count(courses.id)))
    .limit(6);

  return topicCounts;
}
