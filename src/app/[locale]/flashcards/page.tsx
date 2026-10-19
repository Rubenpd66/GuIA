import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FlashcardsWithDeck } from "@/components/content/WithBank";
import { PageHeader } from "@/components/ui/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Sections.flashcards");
  return { title: t("title"), description: t("lead") };
}

export default async function FlashcardsPage() {
  const t = await getTranslations("Sections.flashcards");
  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      {/* The view renders in the browser only: keep its room so the footer does not jump. */}
      <div className="min-h-[36rem]">
        <FlashcardsWithDeck />
      </div>
    </>
  );
}
