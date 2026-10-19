import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { VoiceSettings } from "@/components/settings/VoiceSettings";
import { ExamDateSetting } from "@/components/settings/ExamDateSetting";
import { ProgressManager } from "@/components/settings/ProgressManager";
import { ThemeChoice } from "@/components/theme/ThemeChoice";
import { PageHeader } from "@/components/ui/PageHeader";

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
        <section aria-labelledby="voice-heading">
          <h2 id="voice-heading" className="text-lg font-bold">
            {t("Settings.voice")}
          </h2>
          <div className="mt-3">
            <VoiceSettings />
          </div>
        </section>
        <section aria-labelledby="exam-date-heading">
          <h2 id="exam-date-heading" className="text-lg font-bold">
            {t("Settings.examDate")}
          </h2>
          <div className="mt-3">
            <ExamDateSetting />
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
      </div>
    </>
  );
}
