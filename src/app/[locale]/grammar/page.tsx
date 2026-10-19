import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { LockMark } from "@/components/access/LockMark";
import { LevelBadge } from "@/components/content/LevelBadge";
import { PageHeader } from "@/components/ui/PageHeader";
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
      <div className="space-y-12">
        {CEFR_LEVELS.map((level) => {
          const lessons = content.grammarLessons.filter(
            (lesson) => lesson.level === level,
          );
          return (
            <section key={level} aria-labelledby={`level-${level}`}>
              <h2
                id={`level-${level}`}
                className="flex items-center gap-3 text-xl font-bold"
              >
                <LevelBadge level={level} />
                {t(`Levels.${level}`)}
                <LockMark level={level} />
              </h2>
              {lessons.length === 0 ? (
                <p className="mt-3 text-ink-soft">
                  {t("Syllabus.lessons", { count: 0 })}
                </p>
              ) : (
                <ul className="mt-3 border-t border-hairline">
                  {lessons.map((lesson) => (
                    <li key={lesson.slug} className="border-b border-hairline">
                      <Link
                        href={{
                          pathname: "/grammar/[slug]",
                          params: { slug: lesson.slug },
                        }}
                        className="flex min-h-14 flex-col justify-center gap-0.5 py-3 transition-colors duration-150 hover:text-accent sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                      >
                        <span>
                          <span className="block font-semibold">
                            {localized(lesson.title, locale)}
                          </span>
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
            </section>
          );
        })}
      </div>
    </>
  );
}
