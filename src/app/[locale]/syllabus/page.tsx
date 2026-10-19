import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { LevelBadge } from "@/components/content/LevelBadge";
import { CanDoList } from "@/components/lessons/CanDoList";
import { SkillMark } from "@/components/passport/SkillMark";
import { PageHeader } from "@/components/ui/PageHeader";
import { SECTIONS } from "@/config/sections";
import { Link } from "@/i18n/navigation";
import { canDoByLevel, entriesOfGroup } from "@/lib/content";
import { getContent } from "@/lib/content/load";
import { localized } from "@/lib/content/localize";
import { CEFR_LEVELS } from "@/lib/content/schemas/common";
import { TARGET_LEVELS } from "@/lib/content/schemas/lessons";

const SKILL_SECTIONS = [
  { skill: "reading", section: "reading" },
  { skill: "listening", section: "listening" },
  { skill: "writing", section: "writing" },
  { skill: "speaking", section: "speaking" },
] as const;

const H2 = " text-xl font-bold";
const ROW =
  "flex min-h-14 items-center justify-between gap-6 py-3 transition-colors duration-150 hover:text-accent";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Sections.syllabus");
  return { title: t("title"), description: t("lead") };
}

export default async function SyllabusPage() {
  const [t, locale, content] = await Promise.all([
    getTranslations(),
    getLocale(),
    getContent(),
  ]);
  const objectives = canDoByLevel(content);

  return (
    <>
      <PageHeader
        title={t("Sections.syllabus.title")}
        lead={t("Sections.syllabus.lead")}
      />
      <div className="grid gap-12 lg:grid-cols-2">
        <section aria-labelledby="syllabus-grammar">
          <h2 id="syllabus-grammar" className={H2}>
            <Link
              href="/grammar"
              className="hover:text-accent"
            >
              {t("Syllabus.grammarTitle")}
            </Link>
          </h2>
          <p className="mt-1 text-ink-soft">{t("Syllabus.grammarLead")}</p>
          <ul className="mt-3 border-t border-hairline">
            {CEFR_LEVELS.map((level) => (
              <li key={level} className="border-b border-hairline">
                <Link href="/grammar" className={ROW}>
                  <span className="flex items-center gap-3">
                    <LevelBadge level={level} />
                    {t(`Levels.${level}`)}
                  </span>
                  <span className="text-sm text-ink-soft">
                    {t("Syllabus.lessons", {
                      count: content.grammarLessons.filter(
                        (lesson) => lesson.level === level,
                      ).length,
                    })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="syllabus-vocabulary">
          <h2 id="syllabus-vocabulary" className={H2}>
            <Link
              href="/vocabulary"
              className="hover:text-accent"
            >
              {t("Syllabus.vocabularyTitle")}
            </Link>
          </h2>
          <p className="mt-1 text-ink-soft">{t("Syllabus.vocabularyLead")}</p>
          <ul className="mt-3 border-t border-hairline">
            {content.vocabularyGroups.map((group) => (
              <li key={group.slug} className="border-b border-hairline">
                <Link
                  href={{
                    pathname: "/vocabulary/[slug]",
                    params: { slug: group.slug },
                  }}
                  className={ROW}
                >
                  <span className="font-medium">
                    {localized(group.title, locale)}
                  </span>
                  <span className="text-sm text-ink-soft">
                    {t("Syllabus.entries", {
                      count: entriesOfGroup(content, group.slug).length,
                    })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6">
            <Link
              href="/functional-language"
              className="font-semibold underline decoration-1 underline-offset-4 hover:decoration-2"
            >
              {t("Syllabus.functionalTitle")}
            </Link>
          </p>
          <p className="mt-1 text-ink-soft">{t("Syllabus.functionalLead")}</p>
        </section>

        <section aria-labelledby="syllabus-can-do" className="lg:col-span-2">
          <h2 id="syllabus-can-do" className={H2}>
            {t("Syllabus.canDoTitle")}
          </h2>
          <p className="mt-1 text-ink-soft">{t("Syllabus.canDoLead")}</p>
          <div className="mt-3 border-t border-hairline">
            {TARGET_LEVELS.map((level) => (
              <details key={level} className="border-b border-hairline">
                <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-6 py-3">
                  <span className="flex items-center gap-3">
                    <LevelBadge level={level} />
                    <span className="font-medium">{t(`Levels.${level}`)}</span>
                  </span>
                  <span className="text-sm text-ink-soft">
                    {t("Syllabus.canDoCount", {
                      count: objectives[level].length,
                    })}
                  </span>
                </summary>
                {objectives[level].length > 0 ? (
                  <div className="max-w-[68ch] pb-4">
                    <CanDoList items={objectives[level]} />
                  </div>
                ) : null}
              </details>
            ))}
          </div>
        </section>

        <section aria-labelledby="syllabus-skills" className="lg:col-span-2">
          <h2 id="syllabus-skills" className={H2}>
            {t("Syllabus.skillsTitle")}
          </h2>
          <p className="mt-1 text-ink-soft">{t("Syllabus.skillsLead")}</p>
          <ul className="mt-3 grid border-t border-hairline sm:grid-cols-2 sm:gap-x-10">
            {SKILL_SECTIONS.map(({ skill, section }) => (
              <li key={skill} className="border-b border-hairline">
                <Link href={SECTIONS[section].pathname} className={ROW}>
                  <span className="flex items-center gap-3 font-medium">
                    <SkillMark
                      skill={skill}
                      className="text-accent"
                    />
                    {t(`Skills.${skill}`)}
                  </span>
                  <span className="text-sm text-ink-soft">
                    {t("Syllabus.phase", { phase: SECTIONS[section].phase })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
