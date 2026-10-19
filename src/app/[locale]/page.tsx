import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PartsList } from "@/components/sections/PartsList";
import { JsonLd } from "@/components/seo/JsonLd";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { Section, SectionStack } from "@/components/ui/Section";
import { SITE } from "@/config/site";
import { PRICES, formatPrice } from "@/lib/access/tiers";
import { alternatesFor } from "@/lib/seo/alternates";

const BENEFITS = ["format", "spanish", "level"] as const;
const STEPS = ["test", "plan", "practice"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    title: { absolute: t("title") },
    description: t("description"),
    alternates: await alternatesFor("/"),
  };
}

export default async function HomePage() {
  const t = await getTranslations("Home");
  const locale = (await getLocale()) === "en" ? "en" : "es";

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
        <section className="enter max-w-[40rem]">
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
            <ButtonLink href="/plans" size="lg" className="w-full sm:w-auto">
              {t("seePlans")}
            </ButtonLink>
          </div>
          <p className="mt-3 text-sm text-ink-soft">{t("freeNote")}</p>
        </section>

        <ul className="enter-stagger grid gap-4 sm:grid-cols-3">
          {BENEFITS.map((key, i) => (
            <Card as="li" key={key} style={{ "--i": i } as CSSProperties}>
              <h2 className="text-lg font-bold">
                {t(`benefits.${key}.title`)}
              </h2>
              <p className="mt-1 text-ink-soft">{t(`benefits.${key}.body`)}</p>
            </Card>
          ))}
        </ul>

        <Section id="how-title" title={t("howTitle")}>
          <ol className="grid gap-6 sm:grid-cols-3">
            {STEPS.map((key, i) => (
              <li key={key}>
                <p className="text-sm font-semibold text-accent tabular-nums">
                  {i + 1}
                </p>
                <h3 className="mt-1 text-lg font-bold">
                  {t(`steps.${key}.title`)}
                </h3>
                <p className="mt-1 text-ink-soft">{t(`steps.${key}.body`)}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="parts-title" title={t("partsTitle")} lead={t("partsLead")}>
          <PartsList headingLevel={3} />
        </Section>

        <Section id="plans-title" title={t("plansTitle")} lead={t("plansLead")}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <p className="text-lg font-semibold">
              {t("plansFrom", { price: formatPrice(PRICES.b1.month, locale) })}
            </p>
            <ButtonLink href="/plans" className="w-full sm:w-auto">
              {t("seePlans")}
            </ButtonLink>
          </div>
        </Section>

        <section
          aria-labelledby="closing-title"
          className="rounded-card bg-accent p-6 text-on-accent sm:p-10"
        >
          <h2
            id="closing-title"
            className="text-2xl font-extrabold text-balance"
          >
            {t("closingTitle")}
          </h2>
          <p className="mt-2 max-w-[34rem] text-lg">{t("closingBody")}</p>
          <ButtonLink
            href="/placement-test"
            size="lg"
            className="mt-6 w-full bg-canvas text-ink sm:w-auto"
          >
            {t("placementTest")}
          </ButtonLink>
        </section>
      </SectionStack>
    </>
  );
}
