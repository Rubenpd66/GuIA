import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SECTIONS, type SectionKey } from "@/config/sections";

/** A section that is planned but not built yet: its title, purpose and the phase that brings it. */
export async function ComingSoon({ section }: { section: SectionKey }) {
  const t = await getTranslations();
  return (
    <>
      <PageHeader
        title={t(`Sections.${section}.title`)}
        lead={t(`Sections.${section}.lead`)}
      />
      <EmptyState
        title={t("Coming.title")}
        body={t("Coming.body", { phase: SECTIONS[section].phase })}
        action={<ButtonLink href="/">{t("Coming.back")}</ButtonLink>}
      />
    </>
  );
}
