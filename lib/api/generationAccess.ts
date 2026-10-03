import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, courses } from "@/lib/db/schema";

const BASIC_PLAN_MAX_COURSES = 2;

export type GenerationAccess =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse };

/**
 * Shared gate for the course generation routes: signed in, known user,
 * and under the course cap on the basic plan.
 */
export async function checkGenerationAccess(): Promise<GenerationAccess> {
  const { userId, has } = await auth();
  if (!userId) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const userDb = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { subscriptionPlan: true },
  });
  if (!userDb) {
    return { ok: false, response: NextResponse.json({ error: "User not found" }, { status: 404 }) };
  }

  const isPro = has({ plan: "pro" }) || userDb.subscriptionPlan === "pro";

  if (!isPro) {
    const [row] = await db
      .select({ value: count() })
      .from(courses)
      .where(eq(courses.author, userId));
    if ((row?.value ?? 0) >= BASIC_PLAN_MAX_COURSES) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "BASIC_PLAN_LIMIT_REACHED: Basic plan allows maximum 2 courses. Please upgrade or delete an existing course." },
          { status: 403 }
        ),
      };
    }
  }

  return { ok: true, userId };
}
