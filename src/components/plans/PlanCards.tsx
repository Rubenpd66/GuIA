"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { PlanFigures } from "@/lib/access/figures";
import { parseLevelParam } from "@/lib/access/plan-button";
import {
  PRICES,
  TIERS,
  TIER_LEVEL,
  formatPrice,
  type PaidTier,
  type Tier,
} from "@/lib/access/tiers";
import type { BillingInterval } from "@/lib/stripe/plans";
import { cx } from "@/lib/cx";
import { Tilt } from "@/components/ui/Tilt";
import { AI_CAPS } from "@/config/ai";
import { PlanButton } from "./PlanButton";

const INTERVALS: readonly BillingInterval[] = ["month", "year"];

/** Interval choice and the four plan cards; `?nivel=B2` marks the plan that opens that level. */
export function PlanCards({ figures }: { figures: Record<Tier, PlanFigures> }) {
  const t = useTranslations("Plans");
  const locale = useLocale() === "en" ? "en" : "es";
  const [interval, setInterval] = useState<BillingInterval>("month");
  const highlighted = parseLevelParam(useSearchParams().getAll("nivel"));

  return (
    <div className="flex flex-col gap-8">
      <fieldset className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <legend className="sr-only">{t("intervalLegend")}</legend>
        <div className="flex gap-2">
          {INTERVALS.map((value) => (
            <label
              key={value}
              className="pressable flex min-h-12 cursor-pointer items-center rounded-full border-[1.5px] border-line px-5 font-semibold has-[:checked]:border-accent has-[:checked]:bg-accent has-[:checked]:text-on-accent has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2"
            >
              <input
                type="radio"
                name="interval"
                value={value}
                checked={interval === value}
                onChange={() => setInterval(value)}
                className="sr-only"
              />
              {t(value === "month" ? "monthly" : "yearly")}
            </label>
          ))}
        </div>
        <p className="text-ink-soft">{t("saveNote")}</p>
      </fieldset>

      <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {TIERS.map((tier) => {
          const paid = tier !== "free";
          const fig = figures[tier];
          const price = paid ? PRICES[tier as PaidTier] : null;
          const saving = price ? price.month * 12 - price.year : 0;
          return (
            <li key={tier} className="flex">
              <Tilt className="flex w-full">
                <article
                  aria-current={highlighted === tier ? "true" : undefined}
                  className={cx(
                    "flex w-full flex-col gap-4 rounded-card bg-surface p-5 shadow-card dark:border dark:border-hairline",
                    highlighted === tier && "ring-2 ring-accent",
                  )}
                >
                  <h2 className="text-xl font-bold">
                    {t("planName", { level: TIER_LEVEL[tier] })}
                  </h2>
                  <p>
                    <span className="text-2xl font-extrabold">
                      {price
                        ? formatPrice(price[interval], locale)
                        : t("freePrice")}
                    </span>{" "}
                    {price ? (
                      <span className="text-ink-soft">
                        {t(interval === "month" ? "perMonth" : "perYear")}
                      </span>
                    ) : null}
                  </p>
                  <p className="min-h-6 text-ink-soft">
                    {price
                      ? interval === "year"
                        ? t("saves", { amount: formatPrice(saving, locale) })
                        : t("vatIncluded")
                      : t("noAccount")}
                  </p>
                  <ul className="flex-1 space-y-1">
                    <li>{t("figures.lessons", { count: fig.lessons })}</li>
                    <li>{t("figures.words", { count: fig.words })}</li>
                    <li>{t("figures.phrases", { count: fig.phrases })}</li>
                    <li>{t("figures.tasks", { count: fig.tasks })}</li>
                    <li>{t("figures.mock", { level: fig.mockLevel })}</li>
                    {AI_CAPS[tier] > 0 ? (
                      <li>{t("figures.ai", { count: AI_CAPS[tier] })}</li>
                    ) : null}
                  </ul>
                  <PlanButton card={tier} interval={interval} />
                </article>
              </Tilt>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
