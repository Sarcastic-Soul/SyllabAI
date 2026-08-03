import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { calculateCourseMastery } from "@/lib/adaptive";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await params;
    const metrics = await calculateCourseMastery(courseId);

    return NextResponse.json(metrics);
  } catch (error: any) {
    console.error("Error in /api/courses/[courseId]/adaptive:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate adaptive metrics" },
      { status: 500 }
    );
  }
}
