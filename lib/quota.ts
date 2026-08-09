import { GoogleGenerativeAI } from "@google/generative-ai";
import { getCachedValue, setCachedValue } from "@/lib/redis";
import { logInfo, logWarn } from "@/lib/logger";

export function getGenAI(): GoogleGenerativeAI {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    throw new Error(
      "MISSING_GEMINI_API_KEY: Environment variable GEMINI_API_KEY is missing or empty in Vercel settings. Please configure GEMINI_API_KEY in your Vercel Project Environment Variables."
    );
  }
  return new GoogleGenerativeAI(apiKey.trim());
}

export const QUOTA_LIMITS = {
  "gemini-3.6-flash": 20,
  "gemini-3.5-flash-lite": 500,
};

// In-memory fallback counters if Redis is offline
const inMemoryQuotaMap = new Map<string, number>();

function getTodayKey(model: string): string {
  const today = new Date().toISOString().split("T")[0];
  return `gemini:quota:${model}:${today}`;
}

/**
 * Gets current daily usage count for a given model.
 */
export async function getModelUsageToday(model: "gemini-3.6-flash" | "gemini-3.5-flash-lite"): Promise<number> {
  const key = getTodayKey(model);
  const raw = await getCachedValue(key);
  if (raw !== null) {
    const val = parseInt(raw, 10);
    return isNaN(val) ? 0 : val;
  }
  return inMemoryQuotaMap.get(key) || 0;
}

/**
 * Increments daily usage counter for a given model.
 */
export async function incrementModelUsage(model: "gemini-3.6-flash" | "gemini-3.5-flash-lite"): Promise<number> {
  const key = getTodayKey(model);
  const current = await getModelUsageToday(model);
  const newCount = current + 1;

  inMemoryQuotaMap.set(key, newCount);
  await setCachedValue(key, String(newCount), 86400); // 24 hours TTL

  logInfo(`[QUOTA_TRACKER] Incremented usage for ${model}: ${newCount}/${QUOTA_LIMITS[model]} today`);
  return newCount;
}

export interface QuotaStatusSummary {
  flash36: { used: number; limit: number; percent: number };
  flash35Lite: { used: number; limit: number; percent: number };
  activeModel: "gemini-3.6-flash" | "gemini-3.5-flash-lite";
  healthStatus: "Optimal" | "Smart Fallback Active" | "Quota Exhausted";
}

/**
 * Gets full daily quota status summary for Admin Dashboard.
 */
export async function getDailyQuotaStatus(): Promise<QuotaStatusSummary> {
  const used36 = await getModelUsageToday("gemini-3.6-flash");
  const used35Lite = await getModelUsageToday("gemini-3.5-flash-lite");

  const limit36 = QUOTA_LIMITS["gemini-3.6-flash"];
  const limit35Lite = QUOTA_LIMITS["gemini-3.5-flash-lite"];

  const percent36 = Math.min(100, Math.round((used36 / limit36) * 100));
  const percent35Lite = Math.min(100, Math.round((used35Lite / limit35Lite) * 100));

  let activeModel: "gemini-3.6-flash" | "gemini-3.5-flash-lite" = "gemini-3.6-flash";
  let healthStatus: "Optimal" | "Smart Fallback Active" | "Quota Exhausted" = "Optimal";

  if (used36 >= 18 && used35Lite < 480) {
    activeModel = "gemini-3.5-flash-lite";
    healthStatus = "Smart Fallback Active";
  } else if (used36 >= 20 && used35Lite >= 500) {
    healthStatus = "Quota Exhausted";
  }

  return {
    flash36: { used: used36, limit: limit36, percent: percent36 },
    flash35Lite: { used: used35Lite, limit: limit35Lite, percent: percent35Lite },
    activeModel,
    healthStatus,
  };
}

export interface SmartModelSelection {
  model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>;
  modelName: "gemini-3.6-flash" | "gemini-3.5-flash-lite";
  isFallback: boolean;
}

/**
 * Returns a Gemini GenerativeModel instance with automatic quota fallback.
 * If preferredModel (e.g. gemini-3.6-flash) is near limit (>=18/20 calls),
 * automatically degrades to gemini-3.5-flash-lite (500/day limit) without failing.
 */
export async function getSmartGenerativeModel(
  preferredModel: "gemini-3.6-flash" | "gemini-3.5-flash-lite" = "gemini-3.6-flash"
): Promise<SmartModelSelection> {
  const genAI = getGenAI();
  const usage36 = await getModelUsageToday("gemini-3.6-flash");

  // Check if preferredModel (3.6 Flash) is near its 20/day limit
  if (preferredModel === "gemini-3.6-flash" && usage36 >= 18) {
    const usage35Lite = await getModelUsageToday("gemini-3.5-flash-lite");

    if (usage35Lite < 490) {
      logWarn(
        `[QUOTA_FALLBACK] Gemini 3.6 Flash daily quota near limit (${usage36}/20). Routing request to Gemini 3.5 Flash Lite fallback!`
      );

      await incrementModelUsage("gemini-3.5-flash-lite");
      return {
        model: genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" }),
        modelName: "gemini-3.5-flash-lite",
        isFallback: true,
      };
    } else {
      throw new Error(
        "DAILY_AI_QUOTA_EXHAUSTED: Daily AI generation limit reached (20/20 on 3.6 Flash and 500/500 on 3.5 Lite). Please try a cached topic or return tomorrow!"
      );
    }
  }

  // Use preferred model
  const selectedModel = preferredModel;
  await incrementModelUsage(selectedModel);

  return {
    model: genAI.getGenerativeModel({ model: selectedModel }),
    modelName: selectedModel,
    isFallback: false,
  };
}

/**
 * Generates text embedding vector with fallback models (text-embedding-004 -> embedding-001).
 */
export async function getEmbeddingVector(text: string): Promise<number[] | null> {
  if (!text || text.trim().length === 0) return null;

  const genAI = getGenAI();

  try {
    const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const res = await embedModel.embedContent(text);
    return res.embedding.values;
  } catch (err) {
    try {
      const fallbackModel = genAI.getGenerativeModel({ model: "embedding-001" });
      const res = await fallbackModel.embedContent(text);
      return res.embedding.values;
    } catch (fallbackErr) {
      logWarn("Embedding generation skipped: model unavailable or error occurred.");
      return null;
    }
  }
}
