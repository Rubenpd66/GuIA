import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { PageHeader } from "@/components/ui/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Sections.dashboard");
  return { title: t("title"), description: t("lead") };
}

export default async function DashboardPage() {
  const t = await getTranslations("Sections.dashboard");
  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      {/* The view renders in the browser only: keep its room so the footer does not jump. */}
      <div className="min-h-[36rem]">
        <Dashboard />
      </div>
    </>
  );
}
