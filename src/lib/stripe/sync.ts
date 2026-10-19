import type Stripe from "stripe";
import { tierFromRow, type SubscriptionRow } from "@/lib/access/rule";
import { planFromLookupKey, type BillingInterval } from "./plans";

export type SubscriptionUpsert = SubscriptionRow & {
  user_id: string;
  interval: BillingInterval;
  cancel_at_period_end: boolean;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  updated_at: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The `subscriptions` row for a Stripe subscription, or null when it is not one of Sello's. */
export function rowFromSubscription(
  sub: Stripe.Subscription,
  now: number,
): SubscriptionUpsert | null {
  const userId = sub.metadata?.user_id;
  const item = sub.items.data[0];
  const plan = planFromLookupKey(item?.price.lookup_key);
  if (!userId || !UUID.test(userId) || !item || !plan) return null;
  return {
    user_id: userId,
    tier: plan.tier,
    interval: plan.interval,
    status: sub.status,
    // Since API version Basil the billing period lives on the item, not the subscription.
    current_period_end: new Date(item.current_period_end * 1000).toISOString(),
    cancel_at_period_end: sub.cancel_at_period_end,
    stripe_customer_id:
      typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    stripe_subscription_id: sub.id,
    updated_at: new Date(now).toISOString(),
  };
}

/**
 * Whether an incoming subscription may take the learner's row. A late event of an old
 * subscription must not wipe a newer one that still grants access.
 */
export function shouldReplace(
  existing: Pick<
    SubscriptionUpsert,
    "stripe_subscription_id" | "tier" | "status" | "current_period_end"
  > | null,
  incoming: SubscriptionUpsert,
  now: number,
): boolean {
  if (!existing) return true;
  if (existing.stripe_subscription_id === incoming.stripe_subscription_id)
    return true;
  return tierFromRow(existing, now) === "free";
}

/** The subscription an event is about, or null for events Sello does not act on. */
export function subscriptionIdOf(event: Stripe.Event): string | null {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode !== "subscription" || !session.subscription) return null;
      return typeof session.subscription === "string"
        ? session.subscription
        : session.subscription.id;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      return event.data.object.id;
    default:
      return null;
  }
}
