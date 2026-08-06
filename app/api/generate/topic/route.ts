import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { users, courses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createCourseSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/ratelimit";
import { generateTopicCourse } from "@/lib/generator/courseGenerator";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { userId, has } = await auth();
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

    const isPro = has({ plan: "pro" }) || userDb.subscriptionPlan === "pro";

    if (!isPro) {
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

    const jobId = `job_topic_${crypto.randomUUID()}`;

    // Execute generation synchronously within Vercel serverless request duration
    const courseId = await generateTopicCourse(jobId, {
      userId,
      topic: validated.topic,
      description: validated.description,
      duration: validated.duration,
      difficulty: validated.difficulty as "Beginner" | "Intermediate" | "Advanced",
    });

    return NextResponse.json({ success: true, jobId, courseId });
  } catch (error: any) {
    console.error("Error in /api/generate/topic:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate course" },
      { status: 400 }
    );
  }
}
