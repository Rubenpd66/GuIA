import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MockExam } from "@/components/assessment/MockExam";
import { PageHeader } from "@/components/ui/PageHeader";
import { alternatesFor } from "@/lib/seo/alternates";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Sections.mockExam");
  return {
    title: t("title"),
    description: t("lead"),
    alternates: await alternatesFor("/mock-exam"),
  };
}

export default async function MockExamPage() {
  const t = await getTranslations("Sections.mockExam");
  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      {/* The view renders in the browser only: keep its room so the footer does not jump. */}
      <div className="min-h-[36rem]">
        <MockExam />
      </div>
    </>
  );
}
