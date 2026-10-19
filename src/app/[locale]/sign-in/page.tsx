import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { SignInPanel } from "@/components/account/SignInPanel";
import { PageHeader } from "@/components/ui/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Account");
  return {
    title: t("signInPageTitle"),
    description: t("signInLead"),
    robots: { index: false },
  };
}

export default async function SignInPage() {
  const t = await getTranslations("Account");
  return (
    <>
      <PageHeader title={t("signInPageTitle")} lead={t("signInLead")} />
      <Suspense>
        <SignInPanel />
      </Suspense>
    </>
  );
}
