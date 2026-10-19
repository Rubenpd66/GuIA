import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { EXAM_FORMAT, partNumber } from "@/lib/exam/format";
import { WRITING_PART_EXAM } from "@/lib/trainer/config";
import { RUBRIC_CRITERIA, type WritingPart } from "@/lib/trainer/writing";

const H2 = "font-semi-expanded text-xl font-bold";
const PARTS = Object.keys(WRITING_PART_EXAM) as WritingPart[];
const STRATEGIES = ["s1", "s2", "s3", "s4"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Sections.writing");
  return { title: t("title"), description: t("lead") };
}

export default async function WritingPage() {
  const t = await getTranslations();
  return (
    <>
      <PageHeader
        title={t("Sections.writing.title")}
        lead={t("Sections.writing.lead")}
      />
      <div className="max-w-[68ch] space-y-12">
        <p className="prose-reading">
          {t("WritingPage.intro", { minutes: EXAM_FORMAT.writing.minutes })}
        </p>

        <section
          aria-labelledby="writing-marking"
          className="space-y-3 rounded-page bg-sheet p-5"
        >
          <h2 id="writing-marking" className="font-semibold">
            {t("WritingPage.noMarkingTitle")}
          </h2>
          <p>{t("WritingPage.noMarkingBody")}</p>
          <h3 className="font-semibold">{t("WritingPage.rubricTitle")}</h3>
          <ul className="list-disc space-y-1 pl-6">
            {RUBRIC_CRITERIA.map((criterion) => (
              <li key={criterion}>{t(`Writing.rubric.${criterion}`)}</li>
            ))}
          </ul>
        </section>

        {PARTS.map((part) => (
          <section
            key={part}
            aria-labelledby={`writing-${part}`}
            className="space-y-4 border-t border-hairline pt-8"
          >
            <h2 id={`writing-${part}`} className={H2}>
              {t("WritingPage.partTitle", {
                number: partNumber(part) ?? 0,
                name: t(`Parts.${part}`),
              })}
            </h2>
            <p className="prose-reading">{t(`WritingPage.task.${part}`)}</p>
            <p className="text-sm text-ink-soft">
              {t("WritingPage.examNote", {
                minutes: WRITING_PART_EXAM[part].seconds / 60,
              })}
            </p>
            <h3 className="font-semibold">{t("WritingPage.strategies")}</h3>
            <ul className="list-disc space-y-2 pl-6">
              {STRATEGIES.map((key) => (
                <li key={key}>
                  {t(`Writing.trainer.strategies.${part}.${key}`)}
                </li>
              ))}
            </ul>
            <ButtonLink
              variant="primary"
              href={{ pathname: "/practice/[part]", params: { part } }}
            >
              {t("WritingPage.practise", { number: partNumber(part) ?? 0 })}
            </ButtonLink>
          </section>
        ))}
      </div>
    </>
  );
}
