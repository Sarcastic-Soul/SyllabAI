import { extractText } from "unpdf";
import { db } from "@/lib/db";
import { courses, chapters, users, documents, documentChunks } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { chunkText, RAG_CHUNK_SIZE, RAG_CHUNK_OVERLAP } from "@/lib/utils/chunker";
import { trackEvent } from "@/lib/analytics";
import { generate, pickModel } from "@/lib/ai/generate";
import { embedTexts } from "@/lib/ai/embeddings";
import { syllabusSchema, type Syllabus } from "@/lib/ai/schemas";

export type CourseDifficulty = "Beginner" | "Intermediate" | "Advanced";

export interface TopicCourseInput {
  userId: string;
  topic: string;
  description?: string;
  duration: number;
  difficulty: CourseDifficulty;
}

export interface PdfCourseInput {
  userId: string;
  topic?: string;
  description?: string;
  filename: string;
  fileBytes: Uint8Array;
  duration: number;
  difficulty: CourseDifficulty;
}

/**
 * Max characters allowed from uploaded document to fit serverless execution budget (~100k chars)
 */
const MAX_DOCUMENT_CHARS = 100000;
// 100k chars at ~850 new chars per chunk is about 118 chunks. They are embedded
// 25 per request, 5 requests at a time, so the whole document takes one round of requests.
const MAX_RAG_CHUNKS = 130;
const CHUNK_INSERT_BATCH_SIZE = 50;

/**
 * Shared database save function
 */
async function saveCourseToDatabase(params: {
  userId: string;
  topic: string;
  duration: number;
  difficulty: string;
  syllabus: Syllabus;
}) {
  const { userId, topic, duration, difficulty, syllabus } = params;

  const [newCourse] = await db
    .insert(courses)
    .values({
      author: userId,
      topic,
      duration,
      difficulty,
      isCompleted: false,
    })
    .returning();

  const chaptersToInsert = syllabus.map((chapter, index) => ({
    courseId: newCourse.id,
    title: chapter.title,
    content: chapter.content,
    order: index + 1,
    isCompleted: false,
  }));

  if (chaptersToInsert.length > 0) {
    await db.insert(chapters).values(chaptersToInsert);
  }

  await db
    .update(users)
    .set({ coursesGenerated: sql`${users.coursesGenerated} + 1` })
    .where(eq(users.id, userId));

  try {
    revalidatePath("/dashboard");
  } catch {
    // revalidatePath may throw in non-request contexts, safely ignore
  }

  return newCourse;
}

/**
 * Synchronous Topic Course Generation
 */
export async function generateTopicCourse(data: TopicCourseInput) {
  const { userId, topic, description, duration, difficulty } = data;
  let createdCourseId: string | null = null;

  try {
    const prompt = `
      Create a comprehensive lesson on the topic: "${topic}".
      ${description ? `User Description / Specific Instructions: "${description}"` : ""}
      Difficulty: ${difficulty}.
      Duration/Modules: ${duration}.

      CRITICAL: You must ALWAYS respond with a valid JSON array of objects. Each object must have a "title" and "content". Even if the topic seems unconventional, treat it seriously and generate an engaging, educational syllabus for it in the requested JSON format.

      CRITICAL FORMATTING INSTRUCTIONS:
      Your primary goal is to write rich, engaging, text-based educational content. Do NOT rely solely on diagrams or code.
      1. Mermaid Diagrams (\`\`\`mermaid): ONLY use a Mermaid diagram if the specific topic requires visualizing a process flow, hierarchy, or architecture. If used, ALL node labels MUST be enclosed in double quotes (e.g. A["Node Label"]). Do NOT include code comments or unquoted special characters.
    `;

    const result = await generate({
      step: "syllabus_topic",
      prompt,
      schema: syllabusSchema,
      preferredModel: "gemini-3.8-flash",
      userId,
    });
    const syllabus = result.data;

    // Save to Database
    const newCourse = await saveCourseToDatabase({
      userId,
      topic,
      duration,
      difficulty,
      syllabus,
    });
    createdCourseId = newCourse.id;

    await trackEvent(userId, "course_generated", {
      topic,
      duration,
      difficulty,
      courseId: newCourse.id,
    });

    return newCourse.id;
  } catch (err) {
    console.error("Topic course generation failed:", err);
    if (createdCourseId) {
      try {
        await db.delete(courses).where(eq(courses.id, createdCourseId));
      } catch (cleanupErr) {
        console.error("Failed to clean up partially created course:", cleanupErr);
      }
    }
    throw err;
  }
}

/**
 * Synchronous Document/PDF Course Generation
 */
export async function generatePdfCourse(data: PdfCourseInput) {
  const { userId, topic, description, filename, fileBytes, duration, difficulty } = data;
  let createdCourseId: string | null = null;

  try {
    let documentText = "";

    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext === "pdf") {
      const { text } = await extractText(fileBytes);
      documentText = Array.isArray(text) ? text.join("\n") : (text || "");
    } else {
      documentText = Buffer.from(fileBytes).toString("utf-8");
    }

    if (!documentText || documentText.trim().length < 20) {
      throw new Error("Could not extract enough text from the document. Please ensure it contains readable text.");
    }

    // Safeguard against CPU/duration budget overflow
    if (documentText.length > MAX_DOCUMENT_CHARS) {
      documentText = documentText.substring(0, MAX_DOCUMENT_CHARS);
    }

    let ragChunks = chunkText(documentText, RAG_CHUNK_SIZE, RAG_CHUNK_OVERLAP);
    if (ragChunks.length > MAX_RAG_CHUNKS) {
      ragChunks = ragChunks.slice(0, MAX_RAG_CHUNKS);
    }
    const summaryChunks = chunkText(documentText, 25000, 500);

    const courseTopicName = topic?.trim() || `Document: ${filename.replace(/\.[^/.]+$/, "")}`;
    // One model pick, so all the summary calls use the same model.
    const { modelName: summarizerModel } = await pickModel("gemini-3.8-flash");

    const mapPrompt = "Extract the main topics, sub-topics, and key structural elements from this text segment to help build a course syllabus. Be concise, use bullet points.";

    const chunksToSummarize = summaryChunks.slice(0, 5);
    const chunkSummaries = await Promise.all(
      chunksToSummarize.map(async (c) => {
        try {
          const res = await generate({
            step: "pdf_summary",
            prompt: mapPrompt + "\n\n" + c,
            model: summarizerModel,
            userId,
          });
          return res.data;
        } catch {
          // Already logged by generate(); the outline is built from the summaries that worked.
          return "";
        }
      })
    );
    const outlineContext = chunkSummaries.join("\n\n");

    const prompt = `
      You are an expert curriculum designer. Create a highly structured course syllabus STRICTLY based on the provided document outline.
      ${topic ? `Course Title / Topic: "${topic}"` : ""}
      ${description ? `Additional User Instructions / Focus Areas: "${description}"` : ""}
      Difficulty Level: ${difficulty}
      Number of Chapters/Modules: ${duration}

      Source Document Outline:
      ${outlineContext}

      CRITICAL: You must ALWAYS respond with a valid JSON array of objects. Each object must have a "title" and "content".
      Your primary goal is to write rich, engaging, text-based educational content derived ONLY from the source text outline above.
    `;

    const result = await generate({
      step: "syllabus_pdf",
      prompt,
      schema: syllabusSchema,
      preferredModel: "gemini-3.8-flash",
      userId,
    });
    const syllabus = result.data;


    // 2. Save Course to Database
    const newCourse = await saveCourseToDatabase({
      userId,
      topic: courseTopicName,
      duration,
      difficulty,
      syllabus,
    });
    createdCourseId = newCourse.id;

    const [newDoc] = await db
      .insert(documents)
      .values({
        courseId: newCourse.id,
        filename,
      })
      .returning();

    // 3. Generate embeddings for document search (sent to Gemini in batches)
    const vectors = await embedTexts(ragChunks, "RETRIEVAL_DOCUMENT", { userId });

    const chunksToInsert = ragChunks.flatMap((content, i) => {
      const embedding = vectors[i];
      return embedding ? [{ documentId: newDoc.id, content, embedding }] : [];
    });

    if (chunksToInsert.length < ragChunks.length) {
      console.warn(
        `Document search: only ${chunksToInsert.length} of ${ragChunks.length} chunks were embedded for course ${newCourse.id}`
      );
    }

    for (let i = 0; i < chunksToInsert.length; i += CHUNK_INSERT_BATCH_SIZE) {
      await db.insert(documentChunks).values(chunksToInsert.slice(i, i + CHUNK_INSERT_BATCH_SIZE));
    }

    await trackEvent(userId, "pdf_uploaded", {
      filename,
      duration,
      difficulty,
      courseId: newCourse.id,
    });

    return newCourse.id;
  } catch (err) {
    console.error("Document course generation failed:", err);
    if (createdCourseId) {
      try {
        await db.delete(courses).where(eq(courses.id, createdCourseId));
      } catch (cleanupErr) {
        console.error("Failed to clean up partially created PDF course:", cleanupErr);
      }
    }
    throw err;
  }
}
