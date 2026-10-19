import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { needsCancelling } from "./checkout";
import { stripeServer } from "./server";

/**
 * Cancels a learner's Stripe subscription at once, before their account is deleted. False means
 * it could not be confirmed, and the caller must keep the account. Invoices stay in Stripe.
 */
export async function cancelStripeFor(userId: string): Promise<boolean> {
  const admin = supabaseAdmin();
  if (!admin) return false;
  const { data: row, error } = await admin
    .from("subscriptions")
    .select("status, stripe_subscription_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return false;
  if (!needsCancelling(row)) return true;
  const stripe = stripeServer();
  if (!stripe) return false;
  try {
    await stripe.subscriptions.cancel(row!.stripe_subscription_id!);
    return true;
  } catch (e) {
    // Already gone in Stripe counts as cancelled.
    if ((e as { code?: string }).code === "resource_missing") return true;
    console.error(
      "sello: could not cancel the subscription",
      (e as { code?: string }).code,
    );
    return false;
  }
}
