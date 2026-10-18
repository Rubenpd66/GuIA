import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/PageHeader";

const TOPICS = ["stored", "notStored", "delete"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Privacy");
  return { title: t("title"), description: t("lead") };
}

export default async function PrivacyPage() {
  const t = await getTranslations("Privacy");
  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <div className="space-y-8">
        {TOPICS.map((topic) => (
          <section key={topic} aria-labelledby={`privacy-${topic}`}>
            <h2 id={`privacy-${topic}`} className="text-lg font-bold">
              {t(`${topic}Title`)}
            </h2>
            <p className="prose-reading mt-2">{t(`${topic}Body`)}</p>
          </section>
        ))}
      </div>
    </>
  );
}
