import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractText } from "unpdf";
import crypto from "crypto";
import { db } from "@/lib/db";
import { courses, chapters, users, documents, documentChunks } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { withRetry } from "@/lib/utils/retry";
import { chunkText } from "@/lib/utils/chunker";
import { pLimit } from "@/lib/utils/concurrency";
import { getCachedValue, setCachedValue, getCachedEmbedding, setCachedEmbedding } from "@/lib/redis";
import { GenerationJobData, JobProgressState } from "@/lib/queue/types";
import { setJobProgressState } from "@/lib/queue/progress";
import { trackEvent } from "@/lib/analytics";
import { getSmartGenerativeModel, getEmbeddingVector, getGenAI } from "@/lib/quota";

/**
 * Max characters allowed from uploaded document to fit serverless execution budget (~100k chars)
 */
const MAX_DOCUMENT_CHARS = 100000;
const MAX_RAG_CHUNKS = 25;

/**
 * Generate MD5 hash helper for caching keys
 */
function hashString(str: string): string {
  return crypto.createHash("md5").update(str).digest("hex");
}

async function reportProgress(
  jobId: string,
  percent: number,
  step: string,
  state: "queued" | "active" | "completed" | "failed" = "active",
  extra?: { courseId?: string; error?: string; isCached?: boolean }
) {
  const progressState: JobProgressState = {
    jobId,
    state,
    percent,
    step,
    courseId: extra?.courseId,
    error: extra?.error,
    isCached: extra?.isCached ?? false,
    updatedAt: Date.now(),
  };
  await setJobProgressState(progressState);
}

/**
 * Shared database save function
 */
async function saveCourseToDatabase(params: {
  userId: string;
  topic: string;
  duration: number;
  difficulty: string;
  syllabus: { title: string; content: string }[];
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
export async function generateTopicCourse(jobId: string, data: Omit<Extract<GenerationJobData, { type: "topic" }>, "type">) {
  const { userId, topic, description, duration, difficulty } = data;
  let createdCourseId: string | null = null;

  try {
    await reportProgress(jobId, 10, "Initializing course generation...");

    const cacheKey = `syllabus:topic:${hashString(`${topic.toLowerCase().trim()}:${description?.trim() || ""}:${duration}:${difficulty}`)}`;
    let syllabus: { title: string; content: string }[] | null = null;
    let isCached = false;

    // 1. Check Redis Cache for identical syllabus
    const cachedSyllabusRaw = await getCachedValue(cacheKey);
    if (cachedSyllabusRaw) {
      try {
        syllabus = JSON.parse(cachedSyllabusRaw);
        isCached = true;
        await reportProgress(jobId, 60, "Loaded syllabus from Upstash Redis cache!", "active", { isCached: true });
      } catch {
        syllabus = null;
      }
    }

    // 2. Generate with Gemini if not cached
    if (!syllabus) {
      const { model, modelName, isFallback } = await getSmartGenerativeModel("gemini-3.6-flash");
      const modelStepLabel = isFallback
        ? "Generating course syllabus via Smart Fallback (3.5 Flash Lite)..."
        : `Generating course syllabus with Gemini AI (${modelName})...`;

      await reportProgress(jobId, 30, modelStepLabel, "active");

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

      const result = await withRetry(() =>
        model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        })
      );

      const responseText = result.response.text();
      const cleanedText = responseText.replace(/```json\n?/g, "").replace(/```/g, "").trim();
      syllabus = JSON.parse(cleanedText);

      if (!Array.isArray(syllabus) || syllabus.length === 0) {
        throw new Error("The AI returned an empty or invalid course structure.");
      }

      // Cache the response for 24 hours
      await setCachedValue(cacheKey, JSON.stringify(syllabus), 86400);
    }

    // 3. Save to Database
    await reportProgress(jobId, 85, "Saving course & chapters to database...", "active", { isCached });
    const newCourse = await saveCourseToDatabase({
      userId,
      topic,
      duration,
      difficulty,
      syllabus,
    });
    createdCourseId = newCourse.id;

    await reportProgress(jobId, 100, "Course generated successfully!", "completed", {
      courseId: newCourse.id,
      isCached,
    });

    await trackEvent(userId, "course_generated", {
      topic,
      duration,
      difficulty,
      isCached,
      courseId: newCourse.id,
    });

    return newCourse.id;
  } catch (err: any) {
    console.error("Topic course generation failed:", err);
    if (createdCourseId) {
      try {
        await db.delete(courses).where(eq(courses.id, createdCourseId));
      } catch (cleanupErr) {
        console.error("Failed to clean up partially created course:", cleanupErr);
      }
    }
    await reportProgress(jobId, 0, err.message || "Course generation failed", "failed", {
      error: err.message || "Failed to generate course",
    });
    throw err;
  }
}

/**
 * Synchronous Document/PDF Course Generation
 */
export async function generatePdfCourse(jobId: string, data: Omit<Extract<GenerationJobData, { type: "pdf" }>, "type">) {
  const { userId, topic, description, filename, pdfBase64, duration, difficulty } = data;
  let createdCourseId: string | null = null;

  try {
    await reportProgress(jobId, 10, "Reading & parsing document...");

    const fileBuffer = Buffer.from(pdfBase64, "base64");
    let documentText = "";

    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext === "pdf") {
      const { text } = await extractText(new Uint8Array(fileBuffer));
      documentText = Array.isArray(text) ? text.join("\n") : (text || "");
    } else {
      documentText = fileBuffer.toString("utf-8");
    }

    if (!documentText || documentText.trim().length < 20) {
      throw new Error("Could not extract enough text from the document. Please ensure it contains readable text.");
    }

    // Safeguard against CPU/duration budget overflow
    if (documentText.length > MAX_DOCUMENT_CHARS) {
      documentText = documentText.substring(0, MAX_DOCUMENT_CHARS);
    }

    await reportProgress(jobId, 30, "Chunking document text...");

    let ragChunks = chunkText(documentText, 4000, 200);
    if (ragChunks.length > MAX_RAG_CHUNKS) {
      ragChunks = ragChunks.slice(0, MAX_RAG_CHUNKS);
    }
    const summaryChunks = chunkText(documentText, 25000, 500);

    const courseTopicName = topic?.trim() || `Document: ${filename.replace(/\.[^/.]+$/, "")}`;
    const pdfHash = hashString(`${filename}:${courseTopicName}:${description?.trim() || ""}:${documentText.length}:${duration}:${difficulty}`);
    const cacheKey = `syllabus:pdf:${pdfHash}`;
    let syllabus: { title: string; content: string }[] | null = null;
    let isCached = false;

    // 1. Check syllabus cache
    const cachedSyllabusRaw = await getCachedValue(cacheKey);
    if (cachedSyllabusRaw) {
      try {
        syllabus = JSON.parse(cachedSyllabusRaw);
        isCached = true;
        await reportProgress(jobId, 55, "Loaded PDF course syllabus from cache!", "active", { isCached });
      } catch {
        syllabus = null;
      }
    }

    if (!syllabus) {
      await reportProgress(jobId, 45, "Generating course outline with Gemini AI...", "active");

      const { model: summarizerModel } = await getSmartGenerativeModel("gemini-3.6-flash");

      const mapPrompt = "Extract the main topics, sub-topics, and key structural elements from this text segment to help build a course syllabus. Be concise, use bullet points.";

      const chunksToSummarize = summaryChunks.slice(0, 5);
      const chunkSummaries = await Promise.all(
        chunksToSummarize.map(async (c) => {
          try {
            const res = await withRetry(() => summarizerModel.generateContent(mapPrompt + "\n\n" + c));
            return res.response.text();
          } catch {
            return "";
          }
        })
      );
      const outlineContext = chunkSummaries.join("\n\n");

      const { model, modelName, isFallback } = await getSmartGenerativeModel("gemini-3.6-flash");
      const modelStepLabel = isFallback
        ? "Structuring chapters via Smart Fallback (3.5 Flash Lite)..."
        : `Structuring chapters & lesson content (${modelName})...`;

      await reportProgress(jobId, 60, modelStepLabel, "active");

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

      const aiResult = await withRetry(() =>
        model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        })
      );

      const responseText = aiResult.response.text();
      const cleanedText = responseText.replace(/```json\n?/g, "").replace(/```/g, "").trim();
      syllabus = JSON.parse(cleanedText);

      if (!Array.isArray(syllabus) || syllabus.length === 0) {
        throw new Error("The AI returned an empty or invalid course structure.");
      }

      await setCachedValue(cacheKey, JSON.stringify(syllabus), 86400);
    }

    // 2. Save Course to Database
    await reportProgress(jobId, 75, "Saving course & modules to database...", "active", { isCached });
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

    // 3. Generate Embeddings for RAG (with Redis Embedding Cache)
    await reportProgress(jobId, 85, "Creating search embeddings for RAG...", "active", { isCached });

    const limit = pLimit(5);

    const embeddingResults = await Promise.all(
      ragChunks.map((content) =>
        limit(async () => {
          const chunkHash = hashString(content);
          // Check embedding cache
          const cachedEmbedding = await getCachedEmbedding(chunkHash);
          if (cachedEmbedding) {
            return {
              documentId: newDoc.id,
              content,
              embedding: cachedEmbedding,
            };
          }

          const vectorValues = await getEmbeddingVector(content);
          if (vectorValues) {
            // Store in embedding cache
            await setCachedEmbedding(chunkHash, vectorValues);
            return {
              documentId: newDoc.id,
              content,
              embedding: vectorValues,
            };
          }
          return null;
        })
      )
    );

    const chunksToInsert = embeddingResults.filter(
      (r): r is NonNullable<typeof r> => r !== null
    );

    if (chunksToInsert.length > 0) {
      await db.insert(documentChunks).values(chunksToInsert);
    }

    await reportProgress(jobId, 100, "PDF Course processing complete!", "completed", {
      courseId: newCourse.id,
      isCached,
    });

    await trackEvent(userId, "pdf_uploaded", {
      filename,
      duration,
      difficulty,
      isCached,
      courseId: newCourse.id,
    });

    return newCourse.id;
  } catch (err: any) {
    console.error("Document course generation failed:", err);
    if (createdCourseId) {
      try {
        await db.delete(courses).where(eq(courses.id, createdCourseId));
      } catch (cleanupErr) {
        console.error("Failed to clean up partially created PDF course:", cleanupErr);
      }
    }
    await reportProgress(jobId, 0, err.message || "Document course generation failed", "failed", {
      error: err.message || "Failed to process document",
    });
    throw err;
  }
}
