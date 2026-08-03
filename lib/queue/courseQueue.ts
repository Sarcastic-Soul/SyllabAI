import { Queue } from "bullmq";
import crypto from "crypto";
import { getRedisClient } from "@/lib/redis";
import { GenerationJobData, JobProgressState } from "./types";
import { setJobProgressState, getJobProgressState } from "./progress";
import { initCourseWorker, processTopicJob, processPdfJob } from "./worker";

let queueInstance: Queue<GenerationJobData> | null = null;

export function getCourseQueue(): Queue<GenerationJobData> | null {
  const redis = getRedisClient();
  if (!redis) return null;

  if (!queueInstance) {
    try {
      queueInstance = new Queue<GenerationJobData>("course-generation", {
        connection: redis,
        defaultJobOptions: {
          attempts: 2,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      });

      // Ensure worker is listening in the same runtime if Node.js server
      initCourseWorker();
    } catch (e) {
      console.warn("Failed to initialize BullMQ queue:", e);
      queueInstance = null;
    }
  }

  return queueInstance;
}

/**
 * Enqueue Topic Generation Job
 */
export async function enqueueTopicGeneration(data: Omit<Extract<GenerationJobData, { type: "topic" }>, "type">): Promise<string> {
  const jobId = `job_topic_${crypto.randomUUID()}`;
  const jobPayload: GenerationJobData = { type: "topic", ...data };

  // Set initial queued state
  const initialState: JobProgressState = {
    jobId,
    state: "queued",
    percent: 5,
    step: "Job queued for processing...",
    updatedAt: Date.now(),
  };
  await setJobProgressState(initialState);

  const queue = getCourseQueue();
  if (queue) {
    await queue.add("topic-generation", jobPayload, { jobId });
  } else {
    // Fallback: Run asynchronously in Node process background without blocking response
    setTimeout(() => {
      processTopicJob(jobId, jobPayload).catch(async (err) => {
        await setJobProgressState({
          jobId,
          state: "failed",
          percent: 0,
          step: err.message || "Failed to generate course",
          error: err.message || "Failed to generate course",
          updatedAt: Date.now(),
        });
      });
    }, 10);
  }

  return jobId;
}

/**
 * Enqueue PDF Generation Job
 */
export async function enqueuePdfGeneration(data: Omit<Extract<GenerationJobData, { type: "pdf" }>, "type">): Promise<string> {
  const jobId = `job_pdf_${crypto.randomUUID()}`;
  const jobPayload: GenerationJobData = { type: "pdf", ...data };

  const initialState: JobProgressState = {
    jobId,
    state: "queued",
    percent: 5,
    step: "PDF upload received, job queued...",
    updatedAt: Date.now(),
  };
  await setJobProgressState(initialState);

  const queue = getCourseQueue();
  if (queue) {
    await queue.add("pdf-generation", jobPayload, { jobId });
  } else {
    // Fallback: Run asynchronously in Node process background without blocking response
    setTimeout(() => {
      processPdfJob(jobId, jobPayload).catch(async (err) => {
        await setJobProgressState({
          jobId,
          state: "failed",
          percent: 0,
          step: err.message || "Failed to process PDF",
          error: err.message || "Failed to process PDF",
          updatedAt: Date.now(),
        });
      });
    }, 10);
  }

  return jobId;
}

export { getJobProgressState };
