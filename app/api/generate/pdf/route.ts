import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { users, courses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkRateLimit } from "@/lib/ratelimit";
import { generatePdfCourse } from "@/lib/generator/courseGenerator";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

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

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const topic = (formData.get("topic") as string) || undefined;
    const description = (formData.get("description") as string) || undefined;
    const duration = parseInt(formData.get("duration") as string) || 5;
    const difficulty = (formData.get("difficulty") as string) || "Intermediate";

    if (!file) {
      return NextResponse.json({ error: "No document file uploaded" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "FILE_TOO_LARGE: Uploaded document exceeds the maximum 5MB size limit for serverless execution." },
        { status: 400 }
      );
    }

    const allowedExtensions = ["pdf", "txt", "md", "markdown", "csv", "json"];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { error: "Unsupported file format. Please upload a PDF, TXT, MD, CSV, or JSON document." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdfBase64 = Buffer.from(arrayBuffer).toString("base64");

    const jobId = `job_pdf_${crypto.randomUUID()}`;

    // Execute generation synchronously within Vercel serverless request duration
    const courseId = await generatePdfCourse(jobId, {
      userId,
      topic,
      description,
      filename: file.name,
      pdfBase64,
      duration,
      difficulty: difficulty as "Beginner" | "Intermediate" | "Advanced",
    });

    return NextResponse.json({ success: true, jobId, courseId });
  } catch (error: any) {
    console.error("Error in /api/generate/pdf:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process document upload" },
      { status: 400 }
    );
  }
}
