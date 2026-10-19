"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { getPathname } from "@/i18n/navigation";
import { buttonFor } from "@/lib/access/plan-button";
import type { PaidTier, Tier } from "@/lib/access/tiers";
import { useTier } from "@/lib/access/useTier";
import { useUser } from "@/lib/auth/useUser";
import {
  openPortal,
  startCheckout,
  type PaymentResult,
} from "@/lib/stripe/actions";
import type { BillingInterval } from "@/lib/stripe/plans";

function ActionButton({
  label,
  run,
}: {
  label: string;
  run: () => Promise<PaymentResult>;
}) {
  const t = useTranslations("Payments.messages");
  const [state, action, pending] = useActionState<PaymentResult | null>(
    async () => (await run()) ?? null,
    null,
  );
  return (
    <form action={action} className="space-y-2">
      <Button type="submit" variant="primary" disabled={pending}>
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

/** The one button of a plan card, chosen from who is looking (see `buttonFor`). */
export function PlanButton({
  card,
  interval,
}: {
  card: Tier;
  interval: BillingInterval;
}) {
  const t = useTranslations("Plans.buttons");
  const locale = useLocale() === "en" ? "en" : "es";
  const user = useUser();
  const tier = useTier();
  const kind = buttonFor(
    card,
    user === undefined
      ? { user: "unknown" }
      : user === null
        ? { user: "signedOut" }
        : tier === undefined
          ? { user: "unknown" }
          : { user: "signedIn", tier },
  );
  if (kind === null) return <div className="min-h-12" aria-hidden="true" />;

  switch (kind) {
    case "start":
      return (
        <ButtonLink href="/syllabus" variant="primary">
          {t("start")}
        </ButtonLink>
      );
    case "createAccount":
      return (
        <ButtonLink
          href={{
            pathname: "/sign-in",
            query: { next: getPathname({ href: "/plans", locale }) },
          }}
          variant="primary"
        >
          {t("createAccount")}
        </ButtonLink>
      );
    case "subscribe":
      return (
        <ActionButton
          label={t("subscribe")}
          run={() => startCheckout(card as PaidTier, interval, locale)}
        />
      );
    case "change":
      return (
        <ActionButton label={t("change")} run={() => openPortal(locale)} />
      );
    case "current":
    case "included":
      return (
        <Button disabled aria-disabled="true">
          {t(kind)}
        </Button>
      );
  }
}
