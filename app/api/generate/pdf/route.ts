import { NextRequest, NextResponse } from "next/server";
import { checkGenerationAccess } from "@/lib/api/generationAccess";
import { generatePdfCourse, type CourseDifficulty } from "@/lib/generator/courseGenerator";

export const runtime = "nodejs";
export const maxDuration = 300;

// Vercel rejects request bodies over 4.5 MB before they reach this handler,
// so the file limit sits below that to leave room for the other form fields.
const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB

export async function POST(req: NextRequest) {
  try {
    const access = await checkGenerationAccess();
    if (!access.ok) return access.response;

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
        { error: "FILE_TOO_LARGE: The uploaded document is over the 4 MB size limit." },
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

    // Execute generation synchronously within Vercel serverless request duration
    const courseId = await generatePdfCourse({
      userId: access.userId,
      topic,
      description,
      filename: file.name,
      fileBytes: new Uint8Array(await file.arrayBuffer()),
      duration,
      difficulty: difficulty as CourseDifficulty,
    });

    return NextResponse.json({ success: true, courseId });
  } catch (error) {
    console.error("Error in /api/generate/pdf:", error);
    return NextResponse.json(
      { error: (error instanceof Error && error.message) || "Failed to process document upload" },
      { status: 400 }
    );
  }
}
