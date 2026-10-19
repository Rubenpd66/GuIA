import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { PlanCards } from "@/components/plans/PlanCards";
import { PageHeader } from "@/components/ui/PageHeader";
import { planFigures, type PlanFigures } from "@/lib/access/figures";
import { TIERS, type Tier } from "@/lib/access/tiers";
import { getContent } from "@/lib/content/load";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Plans");
  return { title: t("title"), description: t("lead") };
}

export default async function PlansPage() {
  const [t, content] = await Promise.all([
    getTranslations("Plans"),
    getContent(),
  ]);
  const figures = Object.fromEntries(
    TIERS.map((tier) => [tier, planFigures(content, tier)]),
  ) as Record<Tier, PlanFigures>;
  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <Suspense fallback={<p aria-busy="true">{t("loading")}</p>}>
        <PlanCards figures={figures} />
      </Suspense>
    </>
  );
}
