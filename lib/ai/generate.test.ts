import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/quota", () => ({
  getGenAI: vi.fn(() => {
    throw new Error("the real Gemini client must not be used in tests");
  }),
  selectSmartModel: vi.fn(async (preferred: string) => ({ modelName: preferred, isFallback: false })),
}));

vi.mock("@/lib/ai/log", () => ({
  logGeneration: vi.fn(async () => {}),
}));

import {
  generate,
  parseAndValidate,
  validateAndRepair,
  toGeminiJsonSchema,
  GenerationOutputError,
  type ModelCall,
} from "@/lib/ai/generate";
import { quizSchema, flashcardsSchema, syllabusSchema } from "@/lib/ai/schemas";
import { logGeneration } from "@/lib/ai/log";
import { selectSmartModel } from "@/lib/quota";

const goodQuiz = [
  { questionText: "What is 2 + 2?", options: ["1", "2", "3", "4"], correctAnswer: 3 },
];

function replies(...texts: string[]): ModelCall & ReturnType<typeof vi.fn> {
  const fn = vi.fn();
  for (const text of texts) {
    fn.mockResolvedValueOnce({ text, inputTokens: 10, outputTokens: 5 });
  }
  return fn as ModelCall & ReturnType<typeof vi.fn>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("parseAndValidate", () => {
  it("accepts valid JSON that matches the schema", () => {
    const result = parseAndValidate(JSON.stringify(goodQuiz), quizSchema);
    expect(result).toEqual({ ok: true, data: goodQuiz });
  });

  it("strips a markdown code fence around the JSON", () => {
    const result = parseAndValidate("```json\n" + JSON.stringify(goodQuiz) + "\n```", quizSchema);
    expect(result.ok).toBe(true);
  });

  it("reports invalid_json for text that is not JSON", () => {
    const result = parseAndValidate("Sure! Here is your quiz:", quizSchema);
    expect(result).toMatchObject({ ok: false, errorType: "invalid_json" });
  });

  it("reports invalid_json for an empty reply", () => {
    expect(parseAndValidate("   ", quizSchema)).toMatchObject({ ok: false, errorType: "invalid_json" });
  });

  it("rejects a quiz question that does not have exactly 4 options", () => {
    const bad = [{ ...goodQuiz[0], options: ["1", "2", "3"] }];
    expect(parseAndValidate(JSON.stringify(bad), quizSchema)).toMatchObject({
      ok: false,
      errorType: "schema_mismatch",
    });
  });

  it("rejects a correctAnswer outside 0-3 or not an integer", () => {
    for (const correctAnswer of [4, -1, 1.5, "2"]) {
      const bad = [{ ...goodQuiz[0], correctAnswer }];
      expect(parseAndValidate(JSON.stringify(bad), quizSchema)).toMatchObject({
        ok: false,
        errorType: "schema_mismatch",
      });
    }
  });

  it("rejects flashcards with an empty front or back", () => {
    expect(
      parseAndValidate(JSON.stringify([{ front: "  ", back: "answer" }]), flashcardsSchema)
    ).toMatchObject({ ok: false, errorType: "schema_mismatch" });
    expect(
      parseAndValidate(JSON.stringify([{ front: "term", back: "" }]), flashcardsSchema)
    ).toMatchObject({ ok: false, errorType: "schema_mismatch" });
  });

  it("rejects an empty syllabus and one with a missing field", () => {
    expect(parseAndValidate("[]", syllabusSchema)).toMatchObject({ ok: false, errorType: "schema_mismatch" });
    expect(parseAndValidate(JSON.stringify([{ title: "Intro" }]), syllabusSchema)).toMatchObject({
      ok: false,
      errorType: "schema_mismatch",
    });
  });
});

describe("validateAndRepair", () => {
  it("returns the first reply when it is valid and does not retry", async () => {
    const call = replies(JSON.stringify(goodQuiz));
    const result = await validateAndRepair({ prompt: "make a quiz", schema: quizSchema, call });

    expect(result).toEqual({ data: goodQuiz, repaired: false, firstErrorType: null });
    expect(call).toHaveBeenCalledTimes(1);
  });

  it("retries once with the error message added to the prompt", async () => {
    const bad = [{ ...goodQuiz[0], correctAnswer: 7 }];
    const call = replies(JSON.stringify(bad), JSON.stringify(goodQuiz));
    const onRetry = vi.fn();

    const result = await validateAndRepair({ prompt: "make a quiz", schema: quizSchema, call, onRetry });

    expect(result).toEqual({ data: goodQuiz, repaired: true, firstErrorType: "schema_mismatch" });
    expect(call).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledWith("schema_mismatch");

    const repairPrompt = call.mock.calls[1][0] as string;
    expect(repairPrompt.startsWith("make a quiz")).toBe(true);
    expect(repairPrompt).toContain("correctAnswer must be between 0 and 3");
  });

  it("gives up after one retry and reports the second error", async () => {
    const call = replies("not json", JSON.stringify([{ questionText: "Q" }]));

    await expect(
      validateAndRepair({ prompt: "make a quiz", schema: quizSchema, call })
    ).rejects.toMatchObject({ name: "GenerationOutputError", errorType: "schema_mismatch" });
    expect(call).toHaveBeenCalledTimes(2);
  });
});

describe("generate", () => {
  it("returns parsed data and logs one successful row with token counts", async () => {
    const call = replies(JSON.stringify(goodQuiz));
    const result = await generate({
      step: "quiz",
      prompt: "make a quiz",
      schema: quizSchema,
      preferredModel: "gemini-3.5-flash-lite",
      userId: "user_1",
      call,
    });

    expect(result).toEqual({
      data: goodQuiz,
      modelName: "gemini-3.5-flash-lite",
      isFallback: false,
      repaired: false,
    });
    expect(selectSmartModel).toHaveBeenCalledWith("gemini-3.5-flash-lite");
    expect(logGeneration).toHaveBeenCalledTimes(1);
    expect(logGeneration).toHaveBeenCalledWith(
      expect.objectContaining({
        step: "quiz",
        model: "gemini-3.5-flash-lite",
        userId: "user_1",
        inputTokens: 10,
        outputTokens: 5,
        success: true,
        errorType: null,
        repaired: false,
      })
    );
  });

  it("logs a repaired row with tokens from both calls", async () => {
    const call = replies("oops", JSON.stringify(goodQuiz));
    const result = await generate({ step: "quiz", prompt: "p", schema: quizSchema, call });

    expect(result.repaired).toBe(true);
    expect(logGeneration).toHaveBeenCalledTimes(1);
    expect(logGeneration).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        repaired: true,
        errorType: "invalid_json",
        inputTokens: 20,
        outputTokens: 10,
      })
    );
  });

  it("logs a failed row and throws when the retry is also invalid", async () => {
    const call = replies("oops", "still not json");

    await expect(
      generate({ step: "flashcards", prompt: "p", schema: flashcardsSchema, call })
    ).rejects.toBeInstanceOf(GenerationOutputError);
    expect(logGeneration).toHaveBeenCalledTimes(1);
    expect(logGeneration).toHaveBeenCalledWith(
      expect.objectContaining({ step: "flashcards", success: false, errorType: "invalid_json", repaired: false })
    );
  });

  it("logs api_error when the model call itself fails", async () => {
    const call: ModelCall = vi.fn().mockRejectedValue(new Error("400 bad request"));

    await expect(generate({ step: "lesson", prompt: "p", call })).rejects.toThrow("400 bad request");
    expect(logGeneration).toHaveBeenCalledWith(
      expect.objectContaining({ step: "lesson", success: false, errorType: "api_error" })
    );
  });

  it("returns plain text when no schema is given, without retrying", async () => {
    const call = replies("# Lesson\nSome text");
    const result = await generate({ step: "lesson", prompt: "p", call });

    expect(result.data).toBe("# Lesson\nSome text");
    expect(call).toHaveBeenCalledTimes(1);
    expect(logGeneration).toHaveBeenCalledWith(expect.objectContaining({ step: "lesson", success: true }));
  });

  it("treats an empty text reply as a failure", async () => {
    const call = replies("  ");
    await expect(generate({ step: "mermaid", prompt: "p", call })).rejects.toMatchObject({
      errorType: "empty_response",
    });
    expect(logGeneration).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, errorType: "empty_response" })
    );
  });

  it("skips the quota pick when a model is passed in", async () => {
    const call = replies("summary");
    const result = await generate({ step: "pdf_summary", prompt: "p", model: "gemini-3.5-flash-lite", call });

    expect(selectSmartModel).not.toHaveBeenCalled();
    expect(result.modelName).toBe("gemini-3.5-flash-lite");
  });
});

describe("toGeminiJsonSchema", () => {
  it("keeps the structure Gemini needs and drops keywords it does not document", () => {
    const schema = toGeminiJsonSchema(quizSchema) as {
      type: string;
      items: { properties: Record<string, Record<string, unknown>>; required: string[] };
    };

    expect(schema.type).toBe("array");
    expect(schema.items.required).toEqual(["questionText", "options", "correctAnswer"]);
    expect(schema.items.properties.options).toMatchObject({ type: "array", minItems: 4, maxItems: 4 });
    expect(schema.items.properties.correctAnswer).toMatchObject({ type: "integer", minimum: 0, maximum: 3 });

    const text = JSON.stringify(schema);
    expect(text).not.toContain("$schema");
    expect(text).not.toContain("minLength");
  });
});
