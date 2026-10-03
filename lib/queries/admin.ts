import { db } from "@/lib/db";
import { users, courses, chapters, quizzes } from "@/lib/db/schema";
import { count, sum, sql, desc, eq } from "drizzle-orm";
import { estimateCostUsd } from "@/lib/ai/pricing";

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

export interface GenerationStepStats {
  step: string;
  /** Calls that reached the API (cache hits not included). */
  calls: number;
  failed: number;
  inputTokens: number;
  outputTokens: number;
  /** Null when at least one model used by this step has no price in lib/ai/pricing.ts. */
  estimatedCostUsd: number | null;
  p50Ms: number | null;
  p95Ms: number | null;
  /** Calls whose first reply was bad JSON or did not match the schema. */
  invalidBeforeRepair: number;
  /** Calls that were still invalid after the one repair retry. */
  invalidAfterRepair: number;
}

export interface GenerationLogStats {
  days: number;
  steps: GenerationStepStats[];
}

type StepRow = {
  step: string;
  calls: string | number;
  failed: string | number;
  p50_ms: string | number | null;
  p95_ms: string | number | null;
  invalid_before: string | number;
  invalid_after: string | number;
};

type TokenRow = {
  step: string;
  model: string;
  input_tokens: string | number;
  output_tokens: string | number;
};

/**
 * Per-step numbers from generation_logs for the admin stats page.
 * Throws if the table does not exist yet; the page catches that and shows an empty state.
 */
export async function getGenerationLogStats(days = 30): Promise<GenerationLogStats> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [stepResult, tokenResult] = await Promise.all([
    db.execute(sql`
      SELECT
        step,
        count(*) AS calls,
        count(*) FILTER (WHERE NOT success) AS failed,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY duration_ms) AS p50_ms,
        percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms) AS p95_ms,
        count(*) FILTER (
          WHERE repaired OR (NOT success AND error_type IN ('invalid_json', 'schema_mismatch'))
        ) AS invalid_before,
        count(*) FILTER (
          WHERE NOT success AND error_type IN ('invalid_json', 'schema_mismatch')
        ) AS invalid_after
      FROM generation_logs
      WHERE created_at >= ${since}::timestamp
      GROUP BY step
      ORDER BY count(*) DESC, step
    `),
    db.execute(sql`
      SELECT
        step,
        model,
        coalesce(sum(input_tokens), 0) AS input_tokens,
        coalesce(sum(output_tokens), 0) AS output_tokens
      FROM generation_logs
      WHERE created_at >= ${since}::timestamp
      GROUP BY step, model
    `),
  ]);

  const tokensByStep = new Map<string, { input: number; output: number; cost: number | null }>();
  for (const row of tokenResult.rows as TokenRow[]) {
    const input = Number(row.input_tokens);
    const output = Number(row.output_tokens);
    const cost = estimateCostUsd(row.model, input, output);
    const current = tokensByStep.get(row.step);
    if (!current) {
      tokensByStep.set(row.step, { input, output, cost });
    } else {
      current.input += input;
      current.output += output;
      current.cost = current.cost === null || cost === null ? null : current.cost + cost;
    }
  }

  const steps = (stepResult.rows as StepRow[]).map((row) => {
    const tokens = tokensByStep.get(row.step);
    return {
      step: row.step,
      calls: Number(row.calls),
      failed: Number(row.failed),
      inputTokens: tokens?.input ?? 0,
      outputTokens: tokens?.output ?? 0,
      estimatedCostUsd: tokens?.cost ?? null,
      p50Ms: row.p50_ms === null ? null : Math.round(Number(row.p50_ms)),
      p95Ms: row.p95_ms === null ? null : Math.round(Number(row.p95_ms)),
      invalidBeforeRepair: Number(row.invalid_before),
      invalidAfterRepair: Number(row.invalid_after),
    };
  });

  return {
    days,
    steps,
  };
}
