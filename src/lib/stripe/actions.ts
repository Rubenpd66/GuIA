"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { SITE } from "@/config/site";
import { getPathname } from "@/i18n/navigation";
import type { SubscriptionRow } from "@/lib/access/rule";
import { supabaseConfigured } from "@/lib/supabase/env";
import { supabaseServer } from "@/lib/supabase/server";
import { WAIVER, checkoutCustomer, checkoutOrPortal } from "./checkout";
import { lookupKeyFor } from "./plans";
import { stripeServer } from "./server";

export type PaymentResult = {
  status: "error";
  message: "unavailable" | "signedOut" | "failed";
};

const Args = z.object({
  tier: z.enum(["b1", "b2", "c1"]),
  interval: z.enum(["month", "year"]),
  locale: z.enum(["es", "en"]),
});

type Row = SubscriptionRow & { stripe_customer_id: string | null };

/** The signed-in learner, their email and their own subscription row (RLS: owner only). */
async function learner(): Promise<
  { userId: string; email: string; row: Row | null } | PaymentResult
> {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  const email = data?.claims?.email;
  if (!userId || typeof email !== "string")
    return { status: "error", message: "signedOut" };
  const { data: row, error } = await supabase
    .from("subscriptions")
    .select("tier, status, current_period_end, stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle<Row>();
  // Unknown is not "no plan": a live subscriber must never be offered a second one.
  if (error) return { status: "error", message: "failed" };
  return { userId, email, row };
}

async function origin() {
  return (await headers()).get("origin") ?? SITE.url;
}

/** Sends the learner to Stripe Checkout, or to the portal when they already have a plan. */
export async function startCheckout(
  tier: "b1" | "b2" | "c1",
  interval: "month" | "year",
  locale: "es" | "en",
): Promise<PaymentResult> {
  const parsed = Args.safeParse({ tier, interval, locale });
  const stripe = stripeServer();
  if (!parsed.success || !stripe || !supabaseConfigured)
    return { status: "error", message: "unavailable" };
  const who = await learner();
  if ("status" in who) return who;
  if (checkoutOrPortal(who.row, Date.now()) === "portal")
    return openPortal(parsed.data.locale);

  const base = await origin();
  const account = `${base}${getPathname({ href: "/account", locale })}`;
  let url: string | null = null;
  try {
    const prices = await stripe.prices.list({
      lookup_keys: [lookupKeyFor(tier, interval)],
      active: true,
      limit: 1,
    });
    const price = prices.data[0];
    if (!price) return { status: "error", message: "failed" };
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: price.id, quantity: 1 }],
      client_reference_id: who.userId,
      subscription_data: { metadata: { user_id: who.userId } },
      ...checkoutCustomer(who.row?.stripe_customer_id ?? null, who.email),
      automatic_tax: { enabled: true },
      billing_address_collection: "required",
      consent_collection: { terms_of_service: "required" },
      custom_text: {
        terms_of_service_acceptance: {
          message: WAIVER[locale](
            `${base}${getPathname({ href: "/terms", locale })}`,
          ),
        },
      },
      locale: locale === "en" ? "en-GB" : "es",
      success_url: `${account}?checkout=success`,
      cancel_url: `${account}?checkout=cancel`,
    });
    url = session.url;
  } catch (error) {
    console.error(
      "sello: could not start checkout",
      (error as { code?: string }).code,
    );
  }
  if (!url) return { status: "error", message: "failed" };
  redirect(url);
}

/** Sends the learner to Stripe's customer portal: change plan, cancel, invoices. */
export async function openPortal(locale: "es" | "en"): Promise<PaymentResult> {
  const stripe = stripeServer();
  if (
    !stripe ||
    !supabaseConfigured ||
    !Args.shape.locale.safeParse(locale).success
  )
    return { status: "error", message: "unavailable" };
  const who = await learner();
  if ("status" in who) return who;
  const customer = who.row?.stripe_customer_id;
  if (!customer) return { status: "error", message: "failed" };
  let url: string | null = null;
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer,
      return_url: `${await origin()}${getPathname({ href: "/account", locale })}`,
      locale: locale === "en" ? "en-GB" : "es",
    });
    url = session.url;
  } catch (error) {
    console.error(
      "sello: could not open the portal",
      (error as { code?: string }).code,
    );
  }
  if (!url) return { status: "error", message: "failed" };
  redirect(url);
}
