import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/PageHeader";

const TOPICS = ["unofficial", "content", "estimates", "owner"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Legal");
  return { title: t("title"), description: t("lead") };
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
      </div>
    </>
  );
}
