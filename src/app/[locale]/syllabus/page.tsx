import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { LevelBadge } from "@/components/content/LevelBadge";
import { CanDoList } from "@/components/lessons/CanDoList";
import { Card } from "@/components/ui/Card";
import { Tilt } from "@/components/ui/Tilt";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section, SectionStack } from "@/components/ui/Section";
import { SECTIONS } from "@/config/sections";
import { Link } from "@/i18n/navigation";
import { canDoByLevel, entriesOfGroup } from "@/lib/content";
import { getContent } from "@/lib/content/load";
import { localized } from "@/lib/content/localize";
import { CEFR_LEVELS } from "@/lib/content/schemas/common";
import { TARGET_LEVELS } from "@/lib/content/schemas/lessons";
import { alternatesFor } from "@/lib/seo/alternates";

const SKILL_SECTIONS = [
  { skill: "reading", section: "reading" },
  { skill: "listening", section: "listening" },
  { skill: "writing", section: "writing" },
  { skill: "speaking", section: "speaking" },
] as const;

const ROW =
  "pressable flex min-h-14 items-center justify-between gap-6 py-3 hover-fine:text-accent";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Sections.syllabus");
  return {
    title: t("title"),
    description: t("lead"),
    alternates: await alternatesFor("/syllabus"),
  };
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
      <SectionStack>
        <div className="grid gap-4 lg:grid-cols-2">
          <Tilt>
            <Card className="h-full">
              <h2 className="text-xl font-bold">
                <Link href="/grammar" className="hover-fine:text-accent">
                  {t("Syllabus.grammarTitle")}
                </Link>
              </h2>
              <p className="mt-1 text-ink-soft">{t("Syllabus.grammarLead")}</p>
              <ul className="mt-4 border-t border-hairline">
                {CEFR_LEVELS.map((level) => (
                  <li
                    key={level}
                    className="border-b border-hairline last:border-b-0"
                  >
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
            </Card>
          </Tilt>

          <Tilt>
            <Card className="h-full">
              <h2 className="text-xl font-bold">
                <Link
                  href="/functional-language"
                  className="hover-fine:text-accent"
                >
                  {t("Syllabus.functionalTitle")}
                </Link>
              </h2>
              <p className="mt-1 text-ink-soft">
                {t("Syllabus.functionalLead")}
              </p>
              <h2 className="mt-8 text-xl font-bold">
                {t("Syllabus.skillsTitle")}
              </h2>
              <p className="mt-1 text-ink-soft">{t("Syllabus.skillsLead")}</p>
              <ul className="mt-4 border-t border-hairline">
                {SKILL_SECTIONS.map(({ skill, section }) => (
                  <li
                    key={skill}
                    className="border-b border-hairline last:border-b-0"
                  >
                    <Link href={SECTIONS[section].pathname} className={ROW}>
                      <span className="font-medium">
                        {t(`Skills.${skill}`)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </Tilt>
        </div>

        <Section
          id="syllabus-vocabulary"
          title={
            <Link href="/vocabulary" className="hover-fine:text-accent">
              {t("Syllabus.vocabularyTitle")}
            </Link>
          }
          lead={t("Syllabus.vocabularyLead")}
        >
          <ul className="enter-stagger grid gap-x-10 border-t border-hairline sm:grid-cols-2 lg:grid-cols-3">
            {content.vocabularyGroups.map((group, i) => (
              <li
                key={group.slug}
                className="border-b border-hairline"
                style={{ "--i": i } as React.CSSProperties}
              >
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
        </Section>

        <Section
          id="syllabus-can-do"
          title={t("Syllabus.canDoTitle")}
          lead={t("Syllabus.canDoLead")}
        >
          <div className="border-t border-hairline">
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
        </Section>
      </SectionStack>
    </>
  );
}
