import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripeServer } from "@/lib/stripe/server";
import {
  isGoneUser,
  rowFromSubscription,
  shouldReplace,
  subscriptionIdOf,
} from "@/lib/stripe/sync";

const ok = () => new Response(null, { status: 200 });

/**
 * Stripe's events keep the `subscriptions` row in step. The event only says which
 * subscription changed: the row is built from a fresh read, so order and repeats do not matter.
 */
export async function POST(request: Request) {
  const stripe = stripeServer();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const admin = supabaseAdmin();
  if (!stripe || !secret || !admin) return new Response(null, { status: 503 });

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      request.headers.get("stripe-signature") ?? "",
      secret,
    );
  } catch {
    return new Response(null, { status: 400 });
  }

  const id = subscriptionIdOf(event);
  if (!id) {
    console.info("sello: stripe event ignored", event.type);
    return ok();
  }

  try {
    const now = Date.now();
    const row = rowFromSubscription(
      await stripe.subscriptions.retrieve(id),
      now,
    );
    if (!row) {
      console.warn("sello: stripe subscription is not one of ours", id);
      return ok();
    }
    const { data: existing, error: readError } = await admin
      .from("subscriptions")
      .select("stripe_subscription_id, tier, status, current_period_end")
      .eq("user_id", row.user_id)
      .maybeSingle();
    // An unreadable row is not "no row": guessing could overwrite a newer live plan.
    if (readError) throw readError;
    if (!shouldReplace(existing, row, now)) {
      // A live one here means two subscriptions for one learner (two Checkouts in two tabs): refund by hand.
      const log = row.status === "canceled" ? console.info : console.warn;
      log("sello: older stripe subscription skipped", id, row.status);
      return ok();
    }
    const { error } = await admin
      .from("subscriptions")
      .upsert(row, { onConflict: "user_id" });
    if (isGoneUser(error)) {
      console.info("sello: stripe event for a deleted account", id);
      return ok();
    }
    if (error) throw error;
    return ok();
  } catch (error) {
    console.error("sello: stripe webhook failed", event.type, error);
    // Stripe retries on 5xx.
    return new Response(null, { status: 500 });
  }
}
