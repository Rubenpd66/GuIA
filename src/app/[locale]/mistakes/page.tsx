import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MistakesBank } from "@/components/dashboard/MistakesBank";
import { PageHeader } from "@/components/ui/PageHeader";
import { alternatesFor } from "@/lib/seo/alternates";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Sections.mistakes");
  return {
    title: t("title"),
    description: t("lead"),
    alternates: await alternatesFor("/mistakes"),
  };
}

export default async function MistakesPage() {
  const t = await getTranslations("Sections.mistakes");
  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <MistakesBank />
    </>
  );
}
