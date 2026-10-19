import type { Metadata } from "next";
import { ViewTransition } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { LockMark } from "@/components/access/LockMark";
import { LevelBadge } from "@/components/content/LevelBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section, SectionStack } from "@/components/ui/Section";
import { Link } from "@/i18n/navigation";
import { questionsForLesson } from "@/lib/content";
import { getContent } from "@/lib/content/load";
import { localized } from "@/lib/content/localize";
import { CEFR_LEVELS } from "@/lib/content/schemas/common";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Sections.grammar");
  return { title: t("title"), description: t("lead") };
}

export default async function GrammarIndexPage() {
  const [t, locale, content] = await Promise.all([
    getTranslations(),
    getLocale(),
    getContent(),
  ]);

  return (
    <>
      <PageHeader
        title={t("Sections.grammar.title")}
        lead={t("Sections.grammar.lead")}
      />
      <SectionStack>
        {CEFR_LEVELS.map((level) => {
          const lessons = content.grammarLessons.filter(
            (lesson) => lesson.level === level,
          );
          return (
            <Section
              key={level}
              id={`level-${level}`}
              title={
                <span className="flex items-center gap-3">
                  <LevelBadge level={level} />
                  {t(`Levels.${level}`)}
                  <LockMark level={level} />
                </span>
              }
            >
              {lessons.length === 0 ? (
                <p className="text-ink-soft">
                  {t("Syllabus.lessons", { count: 0 })}
                </p>
              ) : (
                <ul className="enter-stagger border-t border-hairline">
                  {lessons.map((lesson) => (
                    <li key={lesson.slug} className="border-b border-hairline">
                      <Link
                        href={{
                          pathname: "/grammar/[slug]",
                          params: { slug: lesson.slug },
                        }}
                        className="pressable flex min-h-14 flex-col justify-center gap-0.5 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6 hover-fine:text-accent"
                      >
                        <span>
                          <ViewTransition
                            name={`lesson-${lesson.slug}`}
                            share="morph"
                            default="none"
                          >
                            <span className="block font-semibold">
                              {localized(lesson.title, locale)}
                            </span>
                          </ViewTransition>
                          <span className="block text-sm text-ink-soft">
                            {t(`Categories.${lesson.category}`)}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm text-ink-soft">
                          {t("Lesson.questions", {
                            count: questionsForLesson(content, lesson.slug)
                              .length,
                          })}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          );
        })}
      </SectionStack>
    </>
  );
}
