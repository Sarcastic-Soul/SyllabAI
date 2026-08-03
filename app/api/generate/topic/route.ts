import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, courses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createCourseSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/ratelimit";
import { enqueueTopicGeneration } from "@/lib/queue/courseQueue";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await checkRateLimit(userId);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "RATE_LIMIT_EXCEEDED: You have reached your hourly AI course generation limit." },
        { status: 429 }
      );
    }

    const userDb = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    if (!userDb) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (userDb.subscriptionPlan === "basic") {
      const activeCourses = await db.query.courses.findMany({
        where: eq(courses.author, userId),
      });
      if (activeCourses.length >= 2) {
        return NextResponse.json(
          { error: "BASIC_PLAN_LIMIT_REACHED: Basic plan allows maximum 2 courses. Please upgrade or delete an existing course." },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const validated = createCourseSchema.parse(body);

    const jobId = await enqueueTopicGeneration({
      userId,
      topic: validated.topic,
      duration: validated.duration,
      difficulty: validated.difficulty as "Beginner" | "Intermediate" | "Advanced",
    });

    return NextResponse.json({ success: true, jobId });
  } catch (error: any) {
    console.error("Error in /api/generate/topic:", error);
    return NextResponse.json(
      { error: error.message || "Failed to enqueue course generation job" },
      { status: 400 }
    );
  }
}
