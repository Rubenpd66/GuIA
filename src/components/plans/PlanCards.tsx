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
import { PlanButton } from "./PlanButton";

const INTERVALS: readonly BillingInterval[] = ["month", "year"];

/** Interval choice and the four plan cards; `?nivel=B2` marks the plan that opens that level. */
export function PlanCards({ figures }: { figures: Record<Tier, PlanFigures> }) {
  const t = useTranslations("Plans");
  const locale = useLocale() === "en" ? "en" : "es";
  const [interval, setInterval] = useState<BillingInterval>("year");
  const highlighted = parseLevelParam(useSearchParams().getAll("nivel"));

  return (
    <div className="space-y-8">
      <fieldset className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <legend className="sr-only">{t("intervalLegend")}</legend>
        <div className="flex gap-2">
          {INTERVALS.map((value) => (
            <label
              key={value}
              className="flex min-h-12 cursor-pointer items-center rounded-control border-[1.5px] border-line px-5 font-semibold has-[:checked]:border-ink has-[:checked]:bg-sheet has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2"
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
              <article
                aria-current={highlighted === tier ? "true" : undefined}
                className={cx(
                  "flex w-full flex-col gap-4 rounded-page border-[1.5px] bg-sheet p-5",
                  highlighted === tier
                    ? "border-ink ring-2 ring-ink"
                    : "border-line",
                )}
              >
                <h2 className="text-xl font-bold font-semi-expanded">
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
                </ul>
                <PlanButton card={tier} interval={interval} />
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
