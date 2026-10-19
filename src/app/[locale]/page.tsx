import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PassportCover } from "@/components/passport/PassportCover";
import { PartsList } from "@/components/sections/PartsList";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE } from "@/config/site";
import { cx } from "@/lib/cx";

const LEVELS = ["A2", "B1", "B2", "C"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return { title: { absolute: t("title") }, description: t("description") };
}

export default async function HomePage() {
  const t = await getTranslations("Home");

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
      <section className="grid items-center gap-12 md:grid-cols-[minmax(0,1fr)_auto] md:gap-16">
        <div className="max-w-[40rem]">
          <h1 className="text-3xl leading-[1.04] font-black tracking-tight text-balance sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-5 max-w-[34rem] text-lg text-pretty text-ink-soft">
            {t("lead")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/placement-test" variant="primary" size="lg">
              {t("placementTest")}
            </ButtonLink>
            <ButtonLink href="/syllabus" size="lg">
              {t("startStudying")}
            </ButtonLink>
          </div>
        </div>
        <PassportCover className="mx-auto md:mx-0 md:-rotate-3" />
      </section>

      <section aria-labelledby="levels-title" className="mt-20">
        <h2 id="levels-title" className="text-xl font-bold">
          {t("levelsTitle")}
        </h2>
        <p className="mt-2 text-ink-soft">{t("levelsLead")}</p>
        <ol className="mt-6 flex flex-wrap gap-4">
          {LEVELS.map((level, i) => (
            <li
              key={level}
              className={cx(
                "flex size-16 items-center justify-center rounded-full border-2 border-dashed text-lg font-extrabold sm:size-20 sm:text-xl",
                i % 2 === 0 ? "-rotate-6" : "rotate-3",
                level === "C"
                  ? "border-reward-ink text-ink"
                  : "border-line text-ink-soft",
              )}
            >
              {level}
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="parts-title" className="mt-20">
        <h2 id="parts-title" className="text-xl font-bold">
          {t("partsTitle")}
        </h2>
        <p className="mt-2 text-ink-soft">{t("partsLead")}</p>
        <div className="mt-8">
          <PartsList headingLevel={3} />
        </div>
      </section>
    </>
  );
}
