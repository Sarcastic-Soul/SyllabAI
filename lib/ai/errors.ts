/** Turns raw Gemini API failures into messages that are safe to show to a user. */

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** The model is overloaded or down (HTTP 503 / 500). Another model may still answer. */
export function isModelBusyError(err: unknown): boolean {
  const message = messageOf(err);
  return (
    message.includes('"code":503') ||
    message.includes('"code":500') ||
    message.includes("UNAVAILABLE") ||
    message.includes("overloaded") ||
    message.includes("high demand")
  );
}

export const MODEL_BUSY_MESSAGE =
  "The AI model is busy right now. Nothing was lost. Please try again in a minute.";
export const RATE_LIMIT_MESSAGE =
  "Too many AI requests in a short time. Please wait a minute and try again.";
export const NETWORK_MESSAGE =
  "Could not reach the AI service. Check your connection and try again.";
export const GENERIC_AI_MESSAGE = "The AI service returned an error. Please try again.";

/**
 * Maps a Gemini API error to a plain message. Errors that already carry a
 * readable message (validation, quota, file checks) are returned unchanged.
 */
export function toUserFacingError(err: unknown): Error {
  const message = messageOf(err);

  let friendly: string | null = null;
  if (isModelBusyError(err)) {
    friendly = MODEL_BUSY_MESSAGE;
  } else if (message.includes('"code":429') || message.includes("RESOURCE_EXHAUSTED")) {
    friendly = RATE_LIMIT_MESSAGE;
  } else if (message.includes("fetch failed")) {
    friendly = NETWORK_MESSAGE;
  } else if (message.trimStart().startsWith('{"error"')) {
    // Any other raw API error body.
    friendly = GENERIC_AI_MESSAGE;
  }

  if (friendly === null) return err instanceof Error ? err : new Error(message);
  return new Error(friendly, { cause: err });
}
