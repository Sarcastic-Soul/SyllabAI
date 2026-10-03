import { db } from "@/lib/db";
import { generationLogs } from "@/lib/db/schema";
import { logWarn } from "@/lib/logger";

export type GenerationStep =
  | "syllabus_topic"
  | "syllabus_pdf"
  | "pdf_summary"
  | "lesson"
  | "mermaid"
  | "quiz"
  | "flashcards"
  | "study_buddy"
  | "cheat_sheet"
  | "embedding";

export type GenerationErrorType =
  | "invalid_json"
  | "schema_mismatch"
  | "empty_response"
  | "quota_exhausted"
  | "api_error";

export interface GenerationLogEntry {
  step: GenerationStep;
  model: string;
  userId?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  durationMs: number;
  success: boolean;
  errorType?: GenerationErrorType | null;
  repaired?: boolean;
}

/**
 * Writes one row to generation_logs. Never throws: a failed log write
 * (for example the table does not exist yet) must not break the AI call.
 */
export async function logGeneration(entry: GenerationLogEntry): Promise<void> {
  try {
    await db.insert(generationLogs).values({
      userId: entry.userId ?? null,
      step: entry.step,
      model: entry.model,
      inputTokens: entry.inputTokens ?? null,
      outputTokens: entry.outputTokens ?? null,
      durationMs: Math.max(0, Math.round(entry.durationMs)),
      success: entry.success,
      errorType: entry.errorType ?? null,
      repaired: entry.repaired ?? false,
    });
  } catch (err) {
    try {
      logWarn(`Failed to write generation log for step ${entry.step}`, {
        errorMessage: err instanceof Error ? err.message : String(err),
      });
    } catch {
      // nothing else to do
    }
  }
}
