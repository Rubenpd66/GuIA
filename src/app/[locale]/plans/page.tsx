import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { PlanCards } from "@/components/plans/PlanCards";
import { LevelCatalogue } from "@/components/plans/LevelCatalogue";
import { PlansFaq } from "@/components/plans/PlansFaq";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageHeader } from "@/components/ui/PageHeader";
import { SITE } from "@/config/site";
import { getPathname } from "@/i18n/navigation";
import {
  levelCatalogue,
  offersFor,
  planFigures,
  type PlanFigures,
} from "@/lib/access/figures";
import {
  TIERS,
  TIER_LEVEL,
  type PaidTier,
  type Tier,
} from "@/lib/access/tiers";
import { getContent } from "@/lib/content/load";
import { CEFR_LEVELS, type CefrLevel } from "@/lib/content/schemas/common";
import { alternatesFor } from "@/lib/seo/alternates";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Plans");
  return {
    title: t("title"),
    description: t("lead"),
    alternates: await alternatesFor("/plans"),
  };
}

export default async function PlansPage() {
  const [t, content, current] = await Promise.all([
    getTranslations("Plans"),
    getContent(),
    getLocale(),
  ]);
  const locale = current === "en" ? "en" : "es";
  const url = `${SITE.url}${getPathname({ href: "/plans", locale })}`;
  const catalogue = Object.fromEntries(
    CEFR_LEVELS.map((level) => [level, levelCatalogue(content, level, locale)]),
  ) as Record<CefrLevel, ReturnType<typeof levelCatalogue>>;
  const figures = Object.fromEntries(
    TIERS.map((tier) => [tier, planFigures(content, tier)]),
  ) as Record<Tier, PlanFigures>;
  return (
    <>
      {(["b1", "b2", "c1"] as PaidTier[]).map((tier) => (
        <JsonLd
          key={tier}
          data={{
            "@context": "https://schema.org",
            "@type": "Product",
            name: t("planName", { level: TIER_LEVEL[tier] }),
            description: t("lead"),
            brand: { "@type": "Brand", name: SITE.name },
            offers: offersFor(tier).map(({ interval, price }) => ({
              "@type": "Offer",
              name: t(interval === "month" ? "monthly" : "yearly"),
              price,
              priceCurrency: "EUR",
              availability: "https://schema.org/InStock",
              url,
            })),
          }}
        />
      ))}
      <PageHeader title={t("title")} lead={t("lead")} />
      <div className="space-y-16">
        <Suspense fallback={<p aria-busy="true">{t("loading")}</p>}>
          <PlanCards figures={figures} />
        </Suspense>
        <LevelCatalogue catalogue={catalogue} />
        <PlansFaq />
      </div>
    </>
  );
}
