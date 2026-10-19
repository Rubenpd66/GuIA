import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalSections } from "@/components/legal/LegalSections";

const TOPICS = ["none", "session", "consent", "control"];

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Cookies");
  return { title: t("title"), description: t("lead") };
}

export default function CookiesPage() {
  return <LegalSections namespace="Cookies" topics={TOPICS} />;
}
