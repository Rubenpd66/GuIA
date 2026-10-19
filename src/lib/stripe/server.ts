import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

/** The Stripe client, or null when payments are not configured. Secret key: server only. */
export function stripeServer(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return (client ??= new Stripe(key));
}
