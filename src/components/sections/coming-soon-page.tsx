import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { SectionKey } from "@/config/sections";
import { ComingSoon } from "./ComingSoon";

/** Page and metadata for a section that is not built yet, so each route file stays one line. */
export function comingSoonPage(section: SectionKey) {
  async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations(`Sections.${section}`);
    return { title: t("title"), description: t("lead") };
  }

  function Page() {
    return <ComingSoon section={section} />;
  }

  return { generateMetadata, Page };
}
