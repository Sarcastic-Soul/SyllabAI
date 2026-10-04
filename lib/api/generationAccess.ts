import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth/session";
import { resolvePlan } from "@/lib/billing/plan";
import { FREE_COURSE_LIMIT } from "@/lib/billing/config";
import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, courses } from "@/lib/db/schema";

export type GenerationAccess =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse };

/**
 * Shared gate for the course generation routes: signed in, known user,
 * and under the course cap on the basic plan.
 */
export async function checkGenerationAccess(): Promise<GenerationAccess> {
  const userId = await getUserId();
  if (!userId) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const userDb = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { subscriptionPlan: true, proUntil: true },
  });
  if (!userDb) {
    return { ok: false, response: NextResponse.json({ error: "User not found" }, { status: 404 }) };
  }

  const { isPro } = resolvePlan(userDb);

  if (!isPro) {
    const [row] = await db
      .select({ value: count() })
      .from(courses)
      .where(eq(courses.author, userId));
    if ((row?.value ?? 0) >= FREE_COURSE_LIMIT) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: `BASIC_PLAN_LIMIT_REACHED: Basic plan allows maximum ${FREE_COURSE_LIMIT} courses. Please upgrade or delete an existing course.` },
          { status: 403 }
        ),
      };
    }
  }

  return { ok: true, userId };
}
