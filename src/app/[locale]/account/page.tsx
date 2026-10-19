import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AccountPanel } from "@/components/account/AccountPanel";
import { CheckoutNotice } from "@/components/account/CheckoutNotice";
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
      <Suspense fallback={null}>
        <CheckoutNotice />
      </Suspense>
      <AccountPanel />
    </>
  );
}
