import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { ProgressManager } from "@/components/settings/ProgressManager";
import { ThemeChoice } from "@/components/theme/ThemeChoice";
import { PageHeader } from "@/components/ui/PageHeader";

/** Settings that arrive with later phases. */
const LATER = [
  { key: "voice", phase: 4 },
  { key: "examDate", phase: 7 },
] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Sections.settings");
  return { title: t("title"), description: t("lead") };
}

export default async function SettingsPage() {
  const t = await getTranslations();
  return (
    <>
      <PageHeader
        title={t("Sections.settings.title")}
        lead={t("Sections.settings.lead")}
      />
      <div className="max-w-[68ch] space-y-10">
        <section aria-labelledby="theme-heading">
          <h2 id="theme-heading" className="text-lg font-bold">
            {t("Settings.theme")}
          </h2>
          <div className="mt-3">
            <ThemeChoice />
          </div>
        </section>
        <section aria-labelledby="language-heading">
          <h2 id="language-heading" className="text-lg font-bold">
            {t("Settings.language")}
          </h2>
          <div className="mt-3">
            <LocaleSwitcher variant="full" />
          </div>
        </section>
        <section aria-labelledby="progress-heading">
          <h2 id="progress-heading" className="text-lg font-bold">
            {t("Settings.progressTitle")}
          </h2>
          <div className="mt-3">
            <ProgressManager />
          </div>
        </section>
        <section aria-labelledby="later-heading">
          <h2 id="later-heading" className="text-lg font-bold">
            {t("Settings.laterTitle")}
          </h2>
          <ul className="mt-3 divide-y divide-hairline border-y border-hairline">
            {LATER.map(({ key, phase }) => (
              <li
                key={key}
                className="flex min-h-14 items-center justify-between gap-4 py-3"
              >
                <span>{t(`Settings.${key}`)}</span>
                <span className="shrink-0 text-sm text-ink-soft">
                  {t("Settings.phase", { phase })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
