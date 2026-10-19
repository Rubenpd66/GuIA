import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PlacementTest } from "@/components/assessment/PlacementTest";
import { PageHeader } from "@/components/ui/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Sections.placementTest");
  return { title: t("title"), description: t("lead") };
}

export default async function PlacementTestPage() {
  const t = await getTranslations("Sections.placementTest");
  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <PlacementTest />
    </>
  );
}
