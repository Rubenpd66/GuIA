import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AccountPanel } from "@/components/account/AccountPanel";
import { PageHeader } from "@/components/ui/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Account");
  return {
    title: t("title"),
    description: t("lead"),
    robots: { index: false },
  };
}

export default async function AccountPage() {
  const t = await getTranslations("Account");
  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <AccountPanel />
    </>
  );
}
