import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SkillMark } from "@/components/passport/SkillMark";
import { PageHeader } from "@/components/ui/PageHeader";
import { EXAM_FORMAT, SKILLS } from "@/lib/exam/format";

const H2 = "font-semi-expanded text-xl font-bold";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Sections.examGuide");
  return { title: t("title"), description: t("lead") };
}

export default async function ExamGuidePage() {
  const t = await getTranslations();

  return (
    <>
      <PageHeader
        title={t("Sections.examGuide.title")}
        lead={t("Sections.examGuide.lead")}
      />
      <div className="max-w-[68ch] space-y-12">
        <section aria-labelledby="guide-format">
          <h2 id="guide-format" className={H2}>
            {t("ExamGuide.formatTitle")}
          </h2>
          <p className="mt-1 text-ink-soft">{t("ExamGuide.formatLead")}</p>
          <dl className="mt-4 divide-y divide-hairline border-y border-hairline">
            {SKILLS.map((skill) => (
              <div
                key={skill}
                className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr] sm:gap-6"
              >
                <dt className="flex items-start gap-2.5 font-semibold">
                  <SkillMark
                    skill={skill}
                    className="mt-0.5 text-cover dark:text-foil"
                  />
                  <span>
                    {t(`Skills.${skill}`)}
                    <span className="block text-sm font-normal text-ink-soft">
                      {t("ExamGuide.minutes", {
                        minutes: EXAM_FORMAT[skill].minutes,
                      })}
                    </span>
                  </span>
                </dt>
                <dd>{t(`ExamGuide.${skill}`)}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="guide-scoring">
          <h2 id="guide-scoring" className={H2}>
            {t("ExamGuide.scoringTitle")}
          </h2>
          <p className="prose-reading mt-3">{t("ExamGuide.scoringBody")}</p>
        </section>

        <section
          aria-labelledby="guide-core"
          className="rounded-page border-[1.5px] border-foil-ink p-5"
        >
          <h2 id="guide-core" className={H2}>
            {t("ExamGuide.coreTitle")}
          </h2>
          <p className="prose-reading mt-3">{t("ExamGuide.coreBody")}</p>
        </section>

        <p className="text-sm text-ink-soft">{t("ExamGuide.estimateNote")}</p>
      </div>
    </>
  );
}
