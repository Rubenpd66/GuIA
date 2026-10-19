import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { SITE } from "@/config/site";

const TOPICS = ["stored", "notStored", "audio", "hosting", "delete"] as const;

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
        <section aria-labelledby="privacy-contact">
          <h2 id="privacy-contact" className="text-lg font-bold">
            {t("contactTitle")}
          </h2>
          <p className="prose-reading mt-2">
            {t("contactBody", {
              name: SITE.owner.name,
              email: SITE.owner.email,
            })}
          </p>
        </section>
      </div>
    </>
  );
}
