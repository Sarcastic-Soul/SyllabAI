import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";
import { calculateCourseMastery } from "@/lib/adaptive";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ courseId: string }> | { courseId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await props.params;
    const courseId = params?.courseId;

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 });
    }

    const course = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
    });
    if (!course || course.author !== userId) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const metrics = await calculateCourseMastery(courseId);
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error in /api/courses/[courseId]/adaptive:", error);
    return NextResponse.json(
      { error: (error instanceof Error && error.message) || "Failed to calculate adaptive metrics" },
      { status: 500 }
    );
  }
}
