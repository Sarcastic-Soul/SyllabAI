/**
 * Exponential backoff retry utility for API calls (e.g. Google Gemini API).
 * Catches transient network errors, 429 rate limits, and 500/503 server errors.
 */

export interface RetryOptions {
    maxRetries?: number;
    initialDelayMs?: number;
    backoffFactor?: number;
}

export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const maxRetries = options.maxRetries ?? 3;
    const initialDelayMs = options.initialDelayMs ?? 1000;
    const backoffFactor = options.backoffFactor ?? 2;

    let attempt = 0;

    while (attempt <= maxRetries) {
        try {
            return await fn();
        } catch (error: any) {
            attempt++;
            if (attempt > maxRetries) {
                console.error(`Execution failed after ${maxRetries} retries:`, error);
                throw error;
            }

            const errorMessage = String(error?.message || error);
            const isTransient =
                errorMessage.includes("429") ||
                errorMessage.includes("503") ||
                errorMessage.includes("500") ||
                errorMessage.includes("RESOURCE_EXHAUSTED") ||
                errorMessage.includes("fetch failed") ||
                errorMessage.includes("overloaded");

            if (!isTransient) {
                // Non-transient error (e.g. bad prompt/invalid auth), fail fast
                throw error;
            }

            // Calculate delay with exponential backoff and slight jitter
            const delay =
                initialDelayMs * Math.pow(backoffFactor, attempt - 1) +
                Math.random() * 200;

            console.warn(
                `API call attempt ${attempt} failed with transient error (${errorMessage}). Retrying in ${Math.round(delay)}ms...`
            );

            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    throw new Error("Unexpected retry loop termination");
}
