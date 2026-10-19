import type { PaidTier } from "@/lib/access/tiers";

export type BillingInterval = "month" | "year";

/** Code only knows prices by lookup key, so Stripe's test and live modes share it. */
export function lookupKeyFor(
  tier: PaidTier,
  interval: BillingInterval,
): string {
  return `sello_${tier}_${interval}`;
}

const KEY = /^sello_(b1|b2|c1)_(month|year)$/;

export function planFromLookupKey(
  key: string | null | undefined,
): { tier: PaidTier; interval: BillingInterval } | null {
  const match = key ? KEY.exec(key) : null;
  return match
    ? { tier: match[1] as PaidTier, interval: match[2] as BillingInterval }
    : null;
}
