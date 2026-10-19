import { tierFromRow, type SubscriptionRow } from "@/lib/access/rule";

/** A learner with a live plan changes it in the portal; buying a second one would double-bill. */
export function checkoutOrPortal(
  row: SubscriptionRow | null,
  now: number,
): "checkout" | "portal" {
  return tierFromRow(row, now) === "free" ? "checkout" : "portal";
}

/**
 * Checkout creates the customer itself only when the payment goes through, so abandoned
 * attempts leave nothing behind; a known customer is reused.
 */
export function checkoutCustomer(customerId: string | null, email: string) {
  return customerId
    ? {
        customer: customerId,
        customer_update: { address: "auto", name: "auto" } as const,
      }
    : { customer_email: email };
}

/** Whether Stripe could still bill this row, so deleting the account has to cancel it first. */
export function needsCancelling(
  row: { status: string; stripe_subscription_id: string | null } | null,
): boolean {
  return (
    !!row?.stripe_subscription_id &&
    row.status !== "canceled" &&
    row.status !== "incomplete_expired"
  );
}

/** Shown beside Stripe's terms checkbox: the immediate-access waiver (spec section 5, Legal). */
export const WAIVER: Record<"es" | "en", (termsUrl: string) => string> = {
  es: (termsUrl) =>
    `Acepto los [términos](${termsUrl}) y pido acceso inmediato al contenido digital, por lo que pierdo el derecho de desistimiento de 14 días.`,
  en: (termsUrl) =>
    `I agree to the [terms](${termsUrl}) and ask for immediate access to the digital content, so I lose the 14-day right of withdrawal.`,
};
