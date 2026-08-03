import { getCachedValue, setCachedValue } from "@/lib/redis";
import { JobProgressState } from "./types";

// In-memory fallback map for job progress state
const inMemoryProgress = new Map<string, JobProgressState>();

export async function setJobProgressState(state: JobProgressState): Promise<void> {
  const key = `job:progress:${state.jobId}`;
  inMemoryProgress.set(state.jobId, state);
  await setCachedValue(key, JSON.stringify(state), 3600); // 1 hour TTL
}

export async function getJobProgressState(jobId: string): Promise<JobProgressState | null> {
  const key = `job:progress:${jobId}`;
  const raw = await getCachedValue(key);
  if (raw) {
    try {
      return JSON.parse(raw) as JobProgressState;
    } catch {
      // Ignore parse error, fallback to in-memory
    }
  }

  return inMemoryProgress.get(jobId) || null;
}
