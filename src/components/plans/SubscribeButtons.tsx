"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import type { PaidTier } from "@/lib/access/tiers";
import { useUser } from "@/lib/auth/useUser";
import { startCheckout, type PaymentResult } from "@/lib/stripe/actions";
import type { BillingInterval } from "@/lib/stripe/plans";

function CheckoutForm({
  tier,
  interval,
  label,
}: {
  tier: PaidTier;
  interval: BillingInterval;
  label: string;
}) {
  const t = useTranslations("Payments.messages");
  const locale = useLocale() === "en" ? "en" : "es";
  const [state, action, pending] = useActionState<PaymentResult | null>(
    async () => (await startCheckout(tier, interval, locale)) ?? null,
    null,
  );
  return (
    <form action={action} className="space-y-2">
      <Button type="submit" disabled={pending}>
        {label}
      </Button>
      {state ? (
        <p role="alert" className="font-semibold text-refusal">
          {t(state.message)}
        </p>
      ) : null}
    </form>
  );
}

/** Monthly and yearly purchase buttons for one plan; signed-out visitors are sent to sign in. */
export function SubscribeButtons({ tier }: { tier: PaidTier }) {
  const t = useTranslations("Payments");
  const user = useUser();
  if (user === undefined) return null;
  if (user === null)
    return (
      <ButtonLink href="/sign-in" variant="primary">
        {t("signInToSubscribe")}
      </ButtonLink>
    );
  return (
    <div className="flex flex-wrap gap-3">
      <CheckoutForm tier={tier} interval="month" label={t("monthly")} />
      <CheckoutForm tier={tier} interval="year" label={t("yearly")} />
    </div>
  );
}
