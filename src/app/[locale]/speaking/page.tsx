import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MicCheck } from "@/components/speaking/MicCheck";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { EXAM_FORMAT, partNumber } from "@/lib/exam/format";
import { SPEAKING_PART_EXAM } from "@/lib/trainer/config";
import { SPEAKING_RUBRIC, type SpeakingPart } from "@/lib/trainer/speaking";

const H2 = "font-semi-expanded text-xl font-bold";
const PARTS = Object.keys(SPEAKING_PART_EXAM) as SpeakingPart[];
const STRATEGIES = ["s1", "s2", "s3", "s4"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Sections.speaking");
  return { title: t("title"), description: t("lead") };
}

export default async function SpeakingPage() {
  const t = await getTranslations();
  return (
    <>
      <PageHeader
        title={t("Sections.speaking.title")}
        lead={t("Sections.speaking.lead")}
      />
      <div className="max-w-[68ch] space-y-12">
        <p className="prose-reading">
          {t("SpeakingPage.intro", { minutes: EXAM_FORMAT.speaking.minutes })}
        </p>

        <section
          aria-labelledby="speaking-privacy"
          className="space-y-3 rounded-page bg-sheet p-5"
        >
          <h2 id="speaking-privacy" className="font-semibold">
            {t("SpeakingPage.privacyTitle")}
          </h2>
          <p>{t("SpeakingPage.privacyBody")}</p>
          <p>{t("SpeakingPage.noMarking")}</p>
          <h3 className="font-semibold">{t("SpeakingPage.rubricTitle")}</h3>
          <ul className="list-disc space-y-1 pl-6">
            {SPEAKING_RUBRIC.map((criterion) => (
              <li key={criterion}>{t(`Speaking.rubric.${criterion}`)}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="speaking-mic" className="space-y-3">
          <h2 id="speaking-mic" className={H2}>
            {t("SpeakingPage.micTitle")}
          </h2>
          <p>{t("SpeakingPage.micBody")}</p>
          <MicCheck />
        </section>

        {PARTS.map((part) => (
          <section
            key={part}
            aria-labelledby={`speaking-${part}`}
            className="space-y-4 border-t border-hairline pt-8"
          >
            <h2 id={`speaking-${part}`} className={H2}>
              {t("SpeakingPage.partTitle", {
                number: partNumber(part) ?? 0,
                name: t(`Parts.${part}`),
              })}
            </h2>
            <p className="prose-reading">{t(`SpeakingPage.task.${part}`)}</p>
            <p className="text-sm text-ink-soft">
              {t("SpeakingPage.examNote")}
            </p>
            <h3 className="font-semibold">{t("SpeakingPage.strategies")}</h3>
            <ul className="list-disc space-y-2 pl-6">
              {STRATEGIES.map((key) => (
                <li key={key}>
                  {t(`Speaking.trainer.strategies.${part}.${key}`)}
                </li>
              ))}
            </ul>
            <ButtonLink
              variant="primary"
              href={{ pathname: "/practice/[part]", params: { part } }}
            >
              {t("SpeakingPage.practise", { number: partNumber(part) ?? 0 })}
            </ButtonLink>
          </section>
        ))}
      </div>
    </>
  );
}
