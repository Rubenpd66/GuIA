"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { TIER_LEVEL } from "@/lib/access/tiers";
import { useSubscriptionState } from "@/lib/access/useTier";
import { openPortal, type PaymentResult } from "@/lib/stripe/actions";

/** The learner's plan and its state, with a way to buy one or to manage it in Stripe's portal. */
export function PlanSection() {
  const t = useTranslations("Account.plan");
  const messages = useTranslations("Payments.messages");
  const locale = useLocale() === "en" ? "en" : "es";
  const plan = useSubscriptionState();
  const [state, action, pending] = useActionState<PaymentResult | null>(
    async () => (await openPortal(locale)) ?? null,
    null,
  );
  if (plan === undefined) return null;

  const ends =
    plan.endsOn &&
    new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "es-ES", {
      dateStyle: "long",
    }).format(new Date(plan.endsOn));

  return (
    <section aria-labelledby="plan-heading">
      <h2 id="plan-heading" className="text-lg font-bold">
        {t("title")}
      </h2>
      {plan.tier === "free" ? (
        <p className="mt-2 text-ink-soft">{t("free")}</p>
      ) : (
        <>
          <p className="mt-2 text-ink-soft">
            {t("paid", { level: TIER_LEVEL[plan.tier] })}
          </p>
          {plan.state === "ending" && ends ? (
            <p role="status" className="mt-2 font-semibold">
              {t("endsOn", { date: ends })}
            </p>
          ) : null}
          {plan.state === "pastDue" ? (
            <p role="alert" className="mt-2 font-semibold text-danger">
              {t("pastDue")}
            </p>
          ) : null}
          <p className="mt-2 text-ink-soft">{t("portalHint")}</p>
        </>
      )}
      <div className="mt-4 flex flex-wrap items-start gap-3">
        {plan.tier === "free" ? (
          <ButtonLink href="/plans" variant="primary">
            {t("seePlans")}
          </ButtonLink>
        ) : null}
        {plan.tier !== "free" || plan.hasCustomer ? (
          <form action={action}>
            <Button type="submit" disabled={pending}>
              {plan.tier === "free" ? t("invoices") : t("manage")}
            </Button>
          </form>
        ) : null}
      </div>
      {state ? (
        <p role="alert" className="mt-3 font-semibold text-danger">
          {messages(state.message)}
        </p>
      ) : null}
    </section>
  );
}
