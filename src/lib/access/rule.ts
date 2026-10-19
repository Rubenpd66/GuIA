import type { CefrLevel } from "@/lib/content/schemas/common";
import { canAccess, type PaidTier, type Tier } from "./tiers";

/** The columns of `public.subscriptions` that decide access. */
export type SubscriptionRow = {
  tier: PaidTier;
  status: string;
  current_period_end: string;
};

/** Stripe statuses that keep access; past_due while Stripe retries a failed payment. */
const LIVE = new Set(["active", "trialing", "past_due"]);

/**
 * The tier a subscription row grants right now. The period end is checked here too, so access
 * stops on time even if the webhook that updates the row is late.
 */
export function tierFromRow(row: SubscriptionRow | null, now: number): Tier {
  if (!row || !LIVE.has(row.status)) return "free";
  const end = Date.parse(row.current_period_end);
  return end > now ? row.tier : "free";
}

/** Exercises of a locked level stay hidden, except the placement test's public pool. */
export function isVisible(
  tier: Tier,
  item: { cefrLevel: CefrLevel; placement?: true },
): boolean {
  return item.placement === true || canAccess(tier, item.cefrLevel);
}

export function visibleTo<T extends { cefrLevel: CefrLevel; placement?: true }>(
  tier: Tier,
  items: readonly T[],
): T[] {
  return items.filter((item) => isVisible(tier, item));
}

/** Lessons, vocabulary entries, phrases and flashcards, which carry `level`. */
export function entriesVisibleTo<T extends { level: CefrLevel }>(
  tier: Tier,
  items: readonly T[],
): T[] {
  return items.filter((item) => canAccess(tier, item.level));
}
