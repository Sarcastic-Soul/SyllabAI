import { NextRequest, NextResponse } from "next/server";
import { createCourseSchema } from "@/lib/validations";
import { checkGenerationAccess } from "@/lib/api/generationAccess";
import { generateTopicCourse, type CourseDifficulty } from "@/lib/generator/courseGenerator";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const access = await checkGenerationAccess();
    if (!access.ok) return access.response;

    const body = await req.json();
    const validated = createCourseSchema.parse(body);

    // Execute generation synchronously within Vercel serverless request duration
    const courseId = await generateTopicCourse({
      userId: access.userId,
      topic: validated.topic,
      description: validated.description,
      duration: validated.duration,
      difficulty: validated.difficulty as CourseDifficulty,
    });

    return NextResponse.json({ success: true, courseId });
  } catch (error) {
    console.error("Error in /api/generate/topic:", error);
    return NextResponse.json(
      { error: (error instanceof Error && error.message) || "Failed to generate course" },
      { status: 400 }
    );
  }
}
