import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { SubscribeButtons } from "@/components/plans/SubscribeButtons";
import { PageHeader } from "@/components/ui/PageHeader";
import { PRICES, TIER_LEVEL, formatPrice } from "@/lib/access/tiers";

// shortcut: placeholder so lock notices have somewhere to point; phase 10d builds the real page.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Plans");
  return { title: t("title"), robots: { index: false } };
}

export default async function PlansPage() {
  const [t, locale] = await Promise.all([
    getTranslations("Plans"),
    getLocale(),
  ]);
  const lang = locale === "en" ? "en" : "es";
  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <ul className="max-w-[68ch] divide-y divide-hairline border-y border-hairline">
        <li className="py-4">
          <span className="font-bold">A2</span> · {t("free")}
        </li>
        {(["b1", "b2", "c1"] as const).map((tier) => (
          <li key={tier} className="space-y-3 py-4">
            <p>
              <span className="font-bold">{TIER_LEVEL[tier]}</span> ·{" "}
              {t("price", {
                month: formatPrice(PRICES[tier].month, lang),
                year: formatPrice(PRICES[tier].year, lang),
              })}
            </p>
            <SubscribeButtons tier={tier} />
          </li>
        ))}
      </ul>
    </>
  );
}
