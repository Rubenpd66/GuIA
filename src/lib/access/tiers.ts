import { CEFR_LEVELS, type CefrLevel } from "@/lib/content/levels";

/** Subscription plans, cheapest first. Each one unlocks its level and every level below. */
export const TIERS = ["free", "b1", "b2", "c1"] as const;
export type Tier = (typeof TIERS)[number];
export type PaidTier = Exclude<Tier, "free">;

export const TIER_LEVEL: Record<Tier, CefrLevel> = {
  free: "A2",
  b1: "B1",
  b2: "B2",
  c1: "C1",
};

/** Every level a tier opens, easiest first. */
export function levelsFor(tier: Tier): CefrLevel[] {
  return CEFR_LEVELS.slice(0, CEFR_LEVELS.indexOf(TIER_LEVEL[tier]) + 1);
}

/** The cheapest tier that opens a level. */
export function tierFor(level: CefrLevel): Tier {
  return TIERS.find((tier) => TIER_LEVEL[tier] === level)!;
}

export function canAccess(tier: Tier, level: CefrLevel): boolean {
  return levelsFor(tier).includes(level);
}

/** Euro cents, VAT included. Display only: Stripe holds the prices actually charged. */
export const PRICES: Record<PaidTier, { month: number; year: number }> = {
  b1: { month: 999, year: 9590 },
  b2: { month: 1499, year: 14390 },
  c1: { month: 1999, year: 19190 },
};

export function formatPrice(cents: number, locale: "es" | "en"): string {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-GB", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
