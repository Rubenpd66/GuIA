import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalSections } from "@/components/legal/LegalSections";
import { alternatesFor } from "@/lib/seo/alternates";

const TOPICS = ["none", "session", "consent", "control"];

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Cookies");
  return {
    title: t("title"),
    description: t("lead"),
    alternates: await alternatesFor("/cookies"),
  };
}

export default function CookiesPage() {
  return <LegalSections namespace="Cookies" topics={TOPICS} />;
}
