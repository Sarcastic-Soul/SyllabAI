import { Worker, Job } from "bullmq";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PDFParse } from "pdf-parse";
import crypto from "crypto";
import { db } from "@/lib/db";
import { courses, chapters, users, documents, documentChunks } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { withRetry } from "@/lib/utils/retry";
import { chunkText } from "@/lib/utils/chunker";
import { pLimit } from "@/lib/utils/concurrency";
import { getRedisClient, getCachedValue, setCachedValue, getCachedEmbedding, setCachedEmbedding } from "@/lib/redis";
import { GenerationJobData, JobProgressState } from "./types";
import { setJobProgressState } from "./progress";
import { trackEvent } from "@/lib/analytics";
import { getSmartGenerativeModel } from "@/lib/quota";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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
 * Process Topic Generation Job
 */
export async function processTopicJob(jobId: string, data: Extract<GenerationJobData, { type: "topic" }>) {
  const { userId, topic, duration, difficulty } = data;
  await reportProgress(jobId, 10, "Initializing course generation...");

  const cacheKey = `syllabus:topic:${hashString(`${topic.toLowerCase().trim()}:${duration}:${difficulty}`)}`;
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
      Difficulty: ${difficulty}.
      Duration/Modules: ${duration}.

      CRITICAL: You must ALWAYS respond with a valid JSON array of objects. Each object must have a "title" and "content". Even if the topic seems unconventional, treat it seriously and generate an engaging, educational syllabus for it in the requested JSON format.

      CRITICAL FORMATTING INSTRUCTIONS:
      Your primary goal is to write rich, engaging, text-based educational content. Do NOT rely solely on diagrams or code.
      1. Mermaid Diagrams (\`\`\`mermaid): ONLY use a Mermaid diagram if the specific topic requires visualizing a process flow, hierarchy, or architecture.
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
}

/**
 * Process PDF Generation Job
 */
export async function processPdfJob(jobId: string, data: Extract<GenerationJobData, { type: "pdf" }>) {
  const { userId, filename, pdfBase64, duration, difficulty } = data;
  await reportProgress(jobId, 10, "Reading & parsing PDF document...");

  const pdfBuffer = Buffer.from(pdfBase64, "base64");
  const parser = new PDFParse({ data: new Uint8Array(pdfBuffer) });
  const result = await parser.getText();
  const documentText = result.text;
  await parser.destroy();

  if (!documentText || documentText.trim().length < 50) {
    throw new Error("Could not extract enough text from the PDF. Please ensure it is a text-based PDF.");
  }

  await reportProgress(jobId, 30, "Chunking document text...");

  const ragChunks = chunkText(documentText, 4000, 200);
  const summaryChunks = chunkText(documentText, 25000, 500);

  const pdfHash = hashString(`${filename}:${documentText.length}:${duration}:${difficulty}`);
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

    const summarizerModel = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
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
    topic: `Document: ${filename.replace(".pdf", "")}`,
    duration,
    difficulty,
    syllabus,
  });

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
  const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

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

        try {
          const res = await embedModel.embedContent(content);
          const vectorValues = res.embedding.values;
          // Store in embedding cache
          await setCachedEmbedding(chunkHash, vectorValues);
          return {
            documentId: newDoc.id,
            content,
            embedding: vectorValues,
          };
        } catch (err) {
          console.error("Failed to embed chunk:", err);
          return null;
        }
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
}

/**
 * Singleton BullMQ Worker Initialization
 */
let workerInstance: Worker | null = null;

export function initCourseWorker() {
  const redis = getRedisClient();
  if (!redis) {
    return null;
  }

  if (!workerInstance) {
    try {
      workerInstance = new Worker<GenerationJobData>(
        "course-generation",
        async (job: Job<GenerationJobData>) => {
          const { id } = job;
          const jobId = id || crypto.randomUUID();

          try {
            if (job.data.type === "topic") {
              return await processTopicJob(jobId, job.data);
            } else if (job.data.type === "pdf") {
              return await processPdfJob(jobId, job.data);
            }
          } catch (err: any) {
            await reportProgress(jobId, 0, err.message || "Job processing failed", "failed", {
              error: err.message || "Failed to generate course",
            });
            throw err;
          }
        },
        {
          connection: redis,
          concurrency: 3,
        }
      );

      workerInstance.on("failed", (job, err) => {
        console.error(`BullMQ Job ${job?.id} failed:`, err);
      });
    } catch (e) {
      console.warn("Failed to initialize BullMQ worker:", e);
      workerInstance = null;
    }
  }

  return workerInstance;
}
