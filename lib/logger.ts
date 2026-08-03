import pino from "pino";

// Singleton Pino Logger instance configured for JSON stdout logging
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  base: {
    env: process.env.NODE_ENV || "development",
    service: "syllabai-api",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export function logInfo(message: string, context?: Record<string, any>) {
  logger.info(context || {}, message);
}

export function logWarn(message: string, context?: Record<string, any>) {
  logger.warn(context || {}, message);
}

export function logError(message: string, error?: any, context?: Record<string, any>) {
  const errPayload = error instanceof Error
    ? { errorMessage: error.message, stack: error.stack }
    : { errorMessage: String(error) };

  logger.error({ ...errPayload, ...(context || {}) }, message);
}
