import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalSections } from "@/components/legal/LegalSections";
import { aiEnabled } from "@/lib/ai/enabled";
import { alternatesFor } from "@/lib/seo/alternates";

const TOPICS = [
  "what",
  "account",
  "use",
  "content",
  "liability",
  "plans",
  "ai",
  "changes",
];

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Terms");
  return {
    title: t("title"),
    description: t("lead"),
    alternates: await alternatesFor("/terms"),
  };
}

export default function TermsPage() {
  return (
    <LegalSections
      namespace="Terms"
      topics={aiEnabled() ? TOPICS : TOPICS.filter((topic) => topic !== "ai")}
    />
  );
}
