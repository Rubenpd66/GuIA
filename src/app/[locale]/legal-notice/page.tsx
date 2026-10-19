import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { SITE } from "@/config/site";
import { alternatesFor } from "@/lib/seo/alternates";

const TOPICS = ["unofficial", "content", "estimates"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Legal");
  return {
    title: t("title"),
    description: t("lead"),
    alternates: await alternatesFor("/legal-notice"),
  };
}

export default async function LegalNoticePage() {
  const t = await getTranslations("Legal");
  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <div className="space-y-8">
        {TOPICS.map((topic) => (
          <section key={topic} aria-labelledby={`legal-${topic}`}>
            <h2 id={`legal-${topic}`} className="text-lg font-bold">
              {t(`${topic}Title`)}
            </h2>
            <p className="prose-reading mt-2">{t(`${topic}Body`)}</p>
          </section>
        ))}
        <section aria-labelledby="legal-owner">
          <h2 id="legal-owner" className="text-lg font-bold">
            {t("ownerTitle")}
          </h2>
          <p className="prose-reading mt-2">{t("ownerBody")}</p>
          <dl className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-[auto_1fr]">
            <dt className="font-semibold">{t("ownerName")}</dt>
            <dd>{SITE.owner.name}</dd>
            <dt className="font-semibold">{t("ownerTaxId")}</dt>
            <dd>{SITE.owner.taxId}</dd>
            <dt className="font-semibold">{t("ownerAddress")}</dt>
            <dd>{SITE.owner.address}</dd>
            <dt className="font-semibold">{t("ownerEmail")}</dt>
            <dd>
              <a
                href={`mailto:${SITE.owner.email}`}
                className="underline underline-offset-4"
              >
                {SITE.owner.email}
              </a>
            </dd>
          </dl>
        </section>
        <section aria-labelledby="legal-hosting">
          <h2 id="legal-hosting" className="text-lg font-bold">
            {t("hostingTitle")}
          </h2>
          <p className="prose-reading mt-2">{t("hostingBody")}</p>
        </section>
      </div>
    </>
  );
}
