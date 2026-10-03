import { z } from "zod";
import {
  getGenAI,
  selectSmartModel,
  type GeminiModelName,
} from "@/lib/quota";
import { withRetry } from "@/lib/utils/retry";
import {
  logGeneration,
  type GenerationErrorType,
  type GenerationStep,
} from "@/lib/ai/log";

export interface ModelCallResult {
  text: string;
  inputTokens: number | null;
  outputTokens: number | null;
}

/** Sends one prompt to the model. Swapped out in tests. */
export type ModelCall = (prompt: string) => Promise<ModelCallResult>;

type OutputErrorType = Extract<
  GenerationErrorType,
  "invalid_json" | "schema_mismatch" | "empty_response"
>;

/** The model answered, but the answer could not be used. */
export class GenerationOutputError extends Error {
  readonly errorType: OutputErrorType;

  constructor(errorType: OutputErrorType, message: string) {
    super(message);
    this.name = "GenerationOutputError";
    this.errorType = errorType;
  }
}

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; errorType: OutputErrorType; message: string };

const MAX_ERROR_CHARS = 1000;

/**
 * Parses the raw model reply as JSON and checks it against the schema.
 */
export function parseAndValidate<T>(raw: string, schema: z.ZodType<T>): ParseResult<T> {
  // Structured output should not come wrapped in a code fence, but older prompts saw it happen.
  const cleaned = raw.replace(/```json\n?/gi, "").replace(/```/g, "").trim();

  if (cleaned.length === 0) {
    return { ok: false, errorType: "invalid_json", message: "The reply was empty." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return { ok: false, errorType: "invalid_json", message: `The reply was not valid JSON: ${reason}` };
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      errorType: "schema_mismatch",
      message: z.prettifyError(result.error).slice(0, MAX_ERROR_CHARS),
    };
  }

  return { ok: true, data: result.data };
}

export function buildRepairPrompt(prompt: string, errorMessage: string): string {
  return `${prompt}

Your previous reply was rejected for this reason:
${errorMessage}

Reply again. Return only JSON that matches the required format exactly.`;
}

export interface ValidateAndRepairResult<T> {
  data: T;
  /** True when the first reply was rejected and the retry was accepted. */
  repaired: boolean;
  /** Why the first reply was rejected, if it was. */
  firstErrorType: OutputErrorType | null;
}

/**
 * Calls the model, checks the reply against the schema, and on a bad reply
 * retries ONCE with the error message added to the prompt.
 * Throws GenerationOutputError if the retry is also bad.
 * `onRetry` runs just before the second call.
 */
export async function validateAndRepair<T>(params: {
  prompt: string;
  schema: z.ZodType<T>;
  call: ModelCall;
  onRetry?: (firstErrorType: OutputErrorType) => void | Promise<void>;
}): Promise<ValidateAndRepairResult<T>> {
  const { prompt, schema, call, onRetry } = params;

  const first = parseAndValidate((await call(prompt)).text, schema);
  if (first.ok) {
    return { data: first.data, repaired: false, firstErrorType: null };
  }

  await onRetry?.(first.errorType);

  const second = parseAndValidate(
    (await call(buildRepairPrompt(prompt, first.message))).text,
    schema
  );
  if (second.ok) {
    return { data: second.data, repaired: true, firstErrorType: first.errorType };
  }

  throw new GenerationOutputError(
    second.errorType,
    `The AI returned output in the wrong format, even after one retry. ${second.message}`
  );
}

// JSON Schema keywords the Gemini `responseJsonSchema` field documents support for.
// Zod emits a few others ("$schema", "minLength", ...); those are dropped here and
// still enforced by the Zod check after the reply comes back.
const GEMINI_SCHEMA_KEYS = new Set([
  "type",
  "format",
  "title",
  "description",
  "enum",
  "items",
  "prefixItems",
  "minItems",
  "maxItems",
  "minimum",
  "maximum",
  "anyOf",
  "oneOf",
  "properties",
  "additionalProperties",
  "required",
]);

function toGeminiSchemaNode(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(toGeminiSchemaNode);
  if (node === null || typeof node !== "object") return node;

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    if (!GEMINI_SCHEMA_KEYS.has(key)) continue;
    if (key === "properties" && value !== null && typeof value === "object") {
      // Property names are free-form; only their schemas get filtered.
      out[key] = Object.fromEntries(
        Object.entries(value).map(([name, child]) => [name, toGeminiSchemaNode(child)])
      );
    } else if (key === "enum" || key === "required") {
      out[key] = value;
    } else {
      out[key] = toGeminiSchemaNode(value);
    }
  }
  return out;
}

export function toGeminiJsonSchema(schema: z.ZodType): unknown {
  return toGeminiSchemaNode(z.toJSONSchema(schema));
}

function createGeminiCall(model: string, jsonSchema?: unknown): ModelCall {
  return async (prompt) => {
    const ai = getGenAI();
    const response = await withRetry(() =>
      ai.models.generateContent({
        model,
        contents: prompt,
        config: jsonSchema
          ? { responseMimeType: "application/json", responseJsonSchema: jsonSchema }
          : undefined,
      })
    );

    const usage = response.usageMetadata;
    const outputTokens =
      usage?.candidatesTokenCount === undefined && usage?.thoughtsTokenCount === undefined
        ? null
        : (usage?.candidatesTokenCount ?? 0) + (usage?.thoughtsTokenCount ?? 0);

    return {
      text: response.text ?? "",
      inputTokens: usage?.promptTokenCount ?? null,
      outputTokens,
    };
  };
}

export interface GenerateOptions {
  /** What this call is for; stored in generation_logs.step. */
  step: GenerationStep;
  prompt: string;
  /** Model to ask for. The daily quota check may swap it for the fallback model. */
  preferredModel?: GeminiModelName;
  /**
   * Use exactly this model and skip the quota check.
   * For follow-up calls that belong to a model pick already made (see pickModel).
   */
  model?: GeminiModelName;
  userId?: string | null;
  /** Test hook: replaces the Gemini call. */
  call?: ModelCall;
}

export interface GenerateResult<T> {
  data: T;
  modelName: GeminiModelName;
  isFallback: boolean;
  repaired: boolean;
}

/** Picks a model once so several calls can share it via `model`. */
export const pickModel = selectSmartModel;

/**
 * The single entry point for every Gemini generation call.
 * With `schema`: asks for structured JSON, validates it and repairs once (see validateAndRepair).
 * Without `schema`: returns the reply text.
 * Every call writes one row to generation_logs, whether it worked or not.
 */
export async function generate<T>(
  options: GenerateOptions & { schema: z.ZodType<T> }
): Promise<GenerateResult<T>>;
export async function generate(options: GenerateOptions): Promise<GenerateResult<string>>;
export async function generate<T>(
  options: GenerateOptions & { schema?: z.ZodType<T> }
): Promise<GenerateResult<T | string>> {
  const { step, prompt, schema, userId } = options;
  const startedAt = Date.now();

  let modelName: GeminiModelName = options.model ?? options.preferredModel ?? "gemini-3.8-flash";
  let isFallback = false;
  let inputTokens: number | null = null;
  let outputTokens: number | null = null;

  const finish = (
    success: boolean,
    errorType: GenerationErrorType | null,
    repaired: boolean
  ) =>
    logGeneration({
      step,
      model: modelName,
      userId,
      inputTokens,
      outputTokens,
      durationMs: Date.now() - startedAt,
      success,
      errorType,
      repaired,
    });

  try {
    if (!options.model) {
      const selection = await selectSmartModel(modelName);
      modelName = selection.modelName;
      isFallback = selection.isFallback;
    }

    const rawCall =
      options.call ?? createGeminiCall(modelName, schema ? toGeminiJsonSchema(schema) : undefined);

    // Add up tokens across the first call and the repair call.
    const call: ModelCall = async (p) => {
      const result = await rawCall(p);
      if (result.inputTokens !== null) inputTokens = (inputTokens ?? 0) + result.inputTokens;
      if (result.outputTokens !== null) outputTokens = (outputTokens ?? 0) + result.outputTokens;
      return result;
    };

    if (!schema) {
      const { text } = await call(prompt);
      if (text.trim().length === 0) {
        throw new GenerationOutputError("empty_response", "The AI returned an empty reply.");
      }
      await finish(true, null, false);
      return { data: text, modelName, isFallback, repaired: false };
    }

    const result = await validateAndRepair({
      prompt,
      schema,
      call,
    });

    await finish(true, result.firstErrorType, result.repaired);
    return { data: result.data, modelName, isFallback, repaired: result.repaired };
  } catch (err) {
    let errorType: GenerationErrorType = "api_error";
    if (err instanceof GenerationOutputError) {
      errorType = err.errorType;
    } else if (err instanceof Error && err.message.startsWith("DAILY_AI_QUOTA_EXHAUSTED")) {
      errorType = "quota_exhausted";
    }
    await finish(false, errorType, false);
    throw err;
  }
}
