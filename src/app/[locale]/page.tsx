import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { LevelPassport } from "@/components/passport/LevelPassport";
import { PlanCards } from "@/components/plans/PlanCards";
import { aiEnabled } from "@/lib/ai/enabled";
import { JsonLd } from "@/components/seo/JsonLd";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Section, SectionStack } from "@/components/ui/Section";
import { SITE } from "@/config/site";
import { planFigures, type PlanFigures } from "@/lib/access/figures";
import { TIERS, type Tier } from "@/lib/access/tiers";
import { getContent } from "@/lib/content/load";
import { alternatesFor } from "@/lib/seo/alternates";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    title: { absolute: t("title") },
    description: t("description"),
    alternates: await alternatesFor("/"),
  };
}

export default async function HomePage() {
  const [t, content] = await Promise.all([
    getTranslations("Home"),
    getContent(),
  ]);
  const figures = Object.fromEntries(
    TIERS.map((tier) => [tier, planFigures(content, tier)]),
  ) as Record<Tier, PlanFigures>;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE.name,
          url: SITE.url,
          description: t("structuredDescription"),
          inLanguage: ["es-ES", "en-GB"],
          publisher: { "@type": "Person", name: SITE.owner.name },
        }}
      />
      <SectionStack>
        <section className="grid items-center gap-12 overflow-x-clip lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)] lg:gap-8">
          <div className="enter max-w-[40rem]">
            <h1 className="text-3xl leading-[1.04] font-extrabold text-balance sm:text-4xl">
              {t("title")}
            </h1>
            <p className="mt-5 max-w-[34rem] text-lg text-pretty text-ink-soft">
              {t("lead")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink
                href="/placement-test"
                variant="primary"
                size="lg"
                className="w-full sm:w-auto"
              >
                {t("placementTest")}
              </ButtonLink>
              <ButtonLink
                href="/syllabus"
                size="lg"
                className="w-full sm:w-auto"
              >
                {t("startStudying")}
              </ButtonLink>
            </div>
            <p className="mt-3 text-sm text-ink-soft">{t("freeNote")}</p>
          </div>
          <div className="flex justify-center py-4">
            <LevelPassport />
          </div>
        </section>

        <Section id="plans-title" title={t("plansTitle")} lead={t("plansLead")}>
          <Suspense fallback={<div className="h-96" aria-hidden="true" />}>
            <PlanCards figures={figures} ai={aiEnabled()} />
          </Suspense>
          <p className="mt-6">
            <ButtonLink href="/plans" variant="ghost">
              {t("plansMore")}
            </ButtonLink>
          </p>
        </Section>
      </SectionStack>
    </>
  );
}
