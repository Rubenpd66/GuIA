import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalSections } from "@/components/legal/LegalSections";

const TOPICS = ["what", "account", "use", "content", "liability", "plans", "changes"];

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Terms");
  return { title: t("title"), description: t("lead") };
}

export default function TermsPage() {
  return <LegalSections namespace="Terms" topics={TOPICS} />;
}
