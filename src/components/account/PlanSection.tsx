"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { TIER_LEVEL } from "@/lib/access/tiers";
import { useTier } from "@/lib/access/useTier";
import { openPortal, type PaymentResult } from "@/lib/stripe/actions";

/** The learner's plan, with a way to buy one or to manage it in Stripe's portal. */
export function PlanSection() {
  const t = useTranslations("Account.plan");
  const messages = useTranslations("Payments.messages");
  const locale = useLocale() === "en" ? "en" : "es";
  const tier = useTier();
  const [state, action, pending] = useActionState<PaymentResult | null>(
    async () => (await openPortal(locale)) ?? null,
    null,
  );
  if (tier === undefined) return null;

  return (
    <section aria-labelledby="plan-heading">
      <h2 id="plan-heading" className="text-lg font-bold">
        {t("title")}
      </h2>
      {tier === "free" ? (
        <>
          <p className="mt-2 text-ink-soft">{t("free")}</p>
          <ButtonLink href="/plans" variant="primary" className="mt-4">
            {t("seePlans")}
          </ButtonLink>
        </>
      ) : (
        <form action={action} className="mt-2 space-y-3">
          <p className="text-ink-soft">
            {t("paid", { level: TIER_LEVEL[tier] })}
          </p>
          <p className="text-ink-soft">{t("portalHint")}</p>
          <Button type="submit" disabled={pending}>
            {t("manage")}
          </Button>
          {state ? (
            <p role="alert" className="font-semibold text-refusal">
              {messages(state.message)}
            </p>
          ) : null}
        </form>
      )}
    </section>
  );
}
