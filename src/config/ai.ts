import type { Tier } from "@/lib/access/tiers";

export const AI_MODEL = "claude-haiku-5-5";

/** Corrections per calendar month (UTC) and plan. They do not roll over. */
export const AI_CAPS: Record<Tier, number> = {
  free: 0,
  b1: 10,
  b2: 20,
  c1: 40,
};

/** Spend that switches the feature off for everyone until next month. Decided 2026-10-20. */
export const AI_MONTHLY_BUDGET_USD = 20;

/**
 * USD per million tokens for AI_MODEL (prompts up to 100K tokens), from Anthropic's price list
 * on 2026-10-06. Check it again whenever the model changes.
 */
export const AI_PRICE_PER_MTOK = { input: 0.1, output: 0.5 } as const;
