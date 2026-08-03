import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, courses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkRateLimit } from "@/lib/ratelimit";
import { enqueuePdfGeneration } from "@/lib/queue/courseQueue";

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

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const duration = parseInt(formData.get("duration") as string) || 5;
    const difficulty = (formData.get("difficulty") as string) || "Intermediate";

    if (!file) {
      return NextResponse.json({ error: "No PDF file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdfBase64 = Buffer.from(arrayBuffer).toString("base64");

    const jobId = await enqueuePdfGeneration({
      userId,
      filename: file.name,
      pdfBase64,
      duration,
      difficulty: difficulty as "Beginner" | "Intermediate" | "Advanced",
    });

    return NextResponse.json({ success: true, jobId });
  } catch (error: any) {
    console.error("Error in /api/generate/pdf:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process PDF upload" },
      { status: 400 }
    );
  }
}
