// Price per one million tokens, in US dollars, for each model that shows up in
// generation_logs.model.
//
// OWNER: these are NOT filled in. Look up the current prices on the Gemini API
// pricing page for your billing tier and enter them here. While a model's
// entry is null, the admin page shows token counts only and no cost for it.
// Do not guess: a wrong number here shows up as a wrong cost on the admin page.
export interface ModelPrice {
  inputPerMillionUsd: number;
  outputPerMillionUsd: number;
}

export const MODEL_PRICES: Record<string, ModelPrice | null> = {
  "gemini-3.8-flash": null,
  "gemini-3.5-flash-lite": null,
  "gemini-embedding-001": null,
};

/** Estimated cost in US dollars, or null if the model has no price entered. */
export function estimateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number
): number | null {
  const price = MODEL_PRICES[model];
  if (!price) return null;
  return (
    (inputTokens / 1_000_000) * price.inputPerMillionUsd +
    (outputTokens / 1_000_000) * price.outputPerMillionUsd
  );
}
