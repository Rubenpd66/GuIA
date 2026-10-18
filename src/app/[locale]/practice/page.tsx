import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PartsList } from "@/components/sections/PartsList";
import { PageHeader } from "@/components/ui/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Sections.practice");
  return { title: t("title"), description: t("lead") };
}

export default async function PracticePage() {
  const t = await getTranslations("Sections.practice");
  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <PartsList headingLevel={2} />
    </>
  );
}
