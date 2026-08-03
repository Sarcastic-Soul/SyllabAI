import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { logInfo, logError } from "@/lib/logger";

export type EventType =
  | "course_generated"
  | "quiz_completed"
  | "flashcard_reviewed"
  | "pdf_uploaded"
  | "study_buddy_chat";

/**
 * Lightweight telemetry event tracking helper.
 * Inserts event into Database and outputs structured JSON log to stdout.
 */
export async function trackEvent(
  userId: string,
  eventType: EventType | string,
  metadata: Record<string, any> = {}
): Promise<void> {
  const payload = {
    userId,
    eventType,
    metadata,
    timestamp: new Date().toISOString(),
  };

  // Structured JSON log output to stdout
  logInfo(`[TELEMETRY_EVENT] ${eventType}`, payload);

  try {
    await db.insert(events).values({
      userId,
      eventType,
      metadata,
    });
  } catch (err) {
    // Non-blocking telemetry tracking error log
    logError(`Failed to save telemetry event: ${eventType}`, err, payload);
  }
}
