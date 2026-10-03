import { GoogleGenAI } from "@google/genai";
import { logWarn } from "@/lib/logger";
import { db } from "@/lib/db";
import { generationLogs } from "@/lib/db/schema";
import { gte, and, eq, sql } from "drizzle-orm";

export type GeminiModelName = "gemini-3.8-flash" | "gemini-3.5-flash-lite";

export function getGenAI(): GoogleGenAI {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    throw new Error(
      "MISSING_GEMINI_API_KEY: Environment variable GEMINI_API_KEY is missing or empty in Vercel settings. Please configure GEMINI_API_KEY in your Vercel Project Environment Variables."
    );
  }
  return new GoogleGenAI({ apiKey: apiKey.trim() });
}

export const QUOTA_LIMITS: Record<GeminiModelName, number> = {
  "gemini-3.8-flash": 20,
  "gemini-3.5-flash-lite": 500,
};

function getStartOfTodayUTC(): Date {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return now;
}

/**
 * Number of API requests made to a model today (UTC), counted from generation_logs.
 * A repaired row stands for two requests (the first call and the repair call).
 * Rows that never reached the API (quota_exhausted) are left out.
 */
export async function getModelUsageToday(model: GeminiModelName): Promise<number> {
  try {
    const [row] = await db
      .select({
        value: sql<number>`count(*) + count(*) FILTER (WHERE ${generationLogs.repaired})`,
      })
      .from(generationLogs)
      .where(
        and(
          eq(generationLogs.model, model),
          gte(generationLogs.createdAt, getStartOfTodayUTC()),
          sql`${generationLogs.errorType} IS DISTINCT FROM 'quota_exhausted'`
        )
      );
    return Number(row?.value ?? 0);
  } catch (e) {
    console.warn(`Quota count query for ${model} failed:`, e);
    return 0;
  }
}

export interface QuotaStatusSummary {
  flash38: { used: number; limit: number; percent: number };
  flash35Lite: { used: number; limit: number; percent: number };
  activeModel: GeminiModelName;
  healthStatus: "Optimal" | "Smart Fallback Active" | "Quota Exhausted";
}

/**
 * Gets full daily quota status summary for Admin Dashboard.
 */
export async function getDailyQuotaStatus(): Promise<QuotaStatusSummary> {
  const used38 = await getModelUsageToday("gemini-3.8-flash");
  const used35Lite = await getModelUsageToday("gemini-3.5-flash-lite");

  const limit38 = QUOTA_LIMITS["gemini-3.8-flash"];
  const limit35Lite = QUOTA_LIMITS["gemini-3.5-flash-lite"];

  const percent38 = Math.min(100, Math.round((used38 / limit38) * 100));
  const percent35Lite = Math.min(100, Math.round((used35Lite / limit35Lite) * 100));

  let activeModel: GeminiModelName = "gemini-3.8-flash";
  let healthStatus: QuotaStatusSummary["healthStatus"] = "Optimal";

  if (used38 >= 18 && used35Lite < 480) {
    activeModel = "gemini-3.5-flash-lite";
    healthStatus = "Smart Fallback Active";
  } else if (used38 >= 20 && used35Lite >= 500) {
    healthStatus = "Quota Exhausted";
  }

  return {
    flash38: { used: used38, limit: limit38, percent: percent38 },
    flash35Lite: { used: used35Lite, limit: limit35Lite, percent: percent35Lite },
    activeModel,
    healthStatus,
  };
}

export interface SmartModelSelection {
  modelName: GeminiModelName;
  isFallback: boolean;
}

/**
 * Picks the Gemini model for one generation call. Usage is counted from the
 * generation_logs row that lib/ai/generate.ts writes for the call.
 * If preferredModel (gemini-3.8-flash) is near its limit (>=18/20 calls),
 * it falls back to gemini-3.5-flash-lite (500/day limit) instead of failing.
 * Callers should not use this directly; go through lib/ai/generate.ts.
 */
export async function selectSmartModel(
  preferredModel: GeminiModelName = "gemini-3.8-flash"
): Promise<SmartModelSelection> {
  const usage38 = await getModelUsageToday("gemini-3.8-flash");

  if (preferredModel === "gemini-3.8-flash" && usage38 >= 18) {
    const usage35Lite = await getModelUsageToday("gemini-3.5-flash-lite");

    if (usage35Lite < 490) {
      logWarn(
        `[QUOTA_FALLBACK] Gemini 3.8 Flash daily quota near limit (${usage38}/20). Routing request to Gemini 3.5 Flash Lite fallback!`
      );

      return { modelName: "gemini-3.5-flash-lite", isFallback: true };
    }

    throw new Error(
      "DAILY_AI_QUOTA_EXHAUSTED: Daily AI generation limit reached (20/20 on 3.8 Flash and 500/500 on 3.5 Lite). Please come back tomorrow!"
    );
  }

  return { modelName: preferredModel, isFallback: false };
}
