import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { subscriptionsToCancel } from "./checkout";
import { stripeServer } from "./server";

const UUID = /^[0-9a-f-]{36}$/i;

/**
 * Cancels every Stripe subscription of a learner at once, before their account is deleted. False
 * means it could not be confirmed, and the caller must keep the account. Invoices stay in Stripe.
 */
export async function cancelStripeFor(userId: string): Promise<boolean> {
  const admin = supabaseAdmin();
  if (!admin) return false;
  const { data: row, error } = await admin
    .from("subscriptions")
    .select("status, stripe_subscription_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !UUID.test(userId)) return false;
  // Every paid learner has a row (the webhook writes it), so no row means nothing to cancel.
  if (!row) return true;
  const stripe = stripeServer();
  if (!stripe) return subscriptionsToCancel(row, []).length === 0;
  try {
    // shortcut: Stripe search lags about a minute behind a new subscription; the row covers that window.
    const found = await stripe.subscriptions.search({
      query: `metadata['user_id']:'${userId}'`,
      limit: 20,
    });
    for (const id of subscriptionsToCancel(row, found.data)) {
      try {
        await stripe.subscriptions.cancel(id);
      } catch (e) {
        // Already gone in Stripe counts as cancelled.
        if ((e as { code?: string }).code !== "resource_missing") throw e;
      }
    }
    return true;
  } catch (e) {
    console.error(
      "sello: could not cancel the subscription",
      (e as { code?: string }).code,
    );
    return false;
  }
}
