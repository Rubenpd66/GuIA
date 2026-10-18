import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { Link } from "@/i18n/navigation";
import { getContent } from "@/lib/content/load";
import { localized } from "@/lib/content/localize";
import { EXAM_FORMAT, partNumber } from "@/lib/exam/format";
import { READING_PART_EXAM } from "@/lib/trainer/config";
import type { ReadingPart } from "@/lib/trainer/reading";

const H2 = "font-semi-expanded text-xl font-bold";
const PARTS = Object.keys(READING_PART_EXAM) as ReadingPart[];
const STRATEGIES = ["s1", "s2", "s3", "s4"] as const;
/** Grammar lessons that train the links part 2 is built on. */
const COHESION_LESSONS = [
  "articles",
  "contrast-and-concession",
  "formal-discourse-markers",
  "ellipsis-and-substitution",
  "non-defining-relative-clauses",
];

const { part1, part2, part3, part4 } = EXAM_FORMAT.reading;
const TASK_VALUES = {
  "reading-1": { sentences: part1.sentences, options: part1.options },
  "reading-2": { tasks: part2.tasks, sentences: part2.sentences },
  "reading-3": { people: part3.people, statements: part3.statements },
  "reading-4": {
    words: part4.words.target,
    headings: part4.headings,
    paragraphs: part4.paragraphs,
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Sections.reading");
  return { title: t("title"), description: t("lead") };
}

export default async function ReadingPage() {
  const [t, locale, content] = await Promise.all([
    getTranslations(),
    getLocale(),
    getContent(),
  ]);
  const lessons = COHESION_LESSONS.flatMap((slug) =>
    content.grammarLessons.filter((lesson) => lesson.slug === slug),
  );

  return (
    <>
      <PageHeader
        title={t("Sections.reading.title")}
        lead={t("Sections.reading.lead")}
      />
      <div className="max-w-[68ch] space-y-12">
        <p className="prose-reading">
          {t("ReadingPage.intro", { minutes: EXAM_FORMAT.reading.minutes })}
        </p>

        {PARTS.map((part) => (
          <section
            key={part}
            aria-labelledby={`reading-${part}`}
            className="space-y-4 border-t border-hairline pt-8"
          >
            <h2 id={`reading-${part}`} className={H2}>
              {t("ReadingPage.partTitle", {
                number: partNumber(part) ?? 0,
                name: t(`Parts.${part}`),
              })}
            </h2>
            <p className="prose-reading">
              {t(`ReadingStrategies.${part}.task`, TASK_VALUES[part])}
            </p>
            <p className="text-sm text-ink-soft">
              {t("ReadingPage.examTime", {
                minutes: READING_PART_EXAM[part].seconds / 60,
              })}
            </p>
            <h3 className="font-semibold">{t("ReadingPage.strategies")}</h3>
            <ul className="list-disc space-y-2 pl-6">
              {STRATEGIES.map((key) => (
                <li key={key}>{t(`ReadingStrategies.${part}.${key}`)}</li>
              ))}
            </ul>
            {part === "reading-2" && lessons.length > 0 ? (
              <div>
                <h3 className="font-semibold">{t("ReadingPage.lessons")}</h3>
                <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
                  {lessons.map((lesson) => (
                    <li key={lesson.slug}>
                      <Link
                        href={{
                          pathname: "/grammar/[slug]",
                          params: { slug: lesson.slug },
                        }}
                        className="inline-flex min-h-11 items-center underline decoration-1 underline-offset-4 hover:decoration-2"
                      >
                        {localized(lesson.title, locale)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <ButtonLink
              variant="primary"
              href={{ pathname: "/practice/[part]", params: { part } }}
            >
              {t("ReadingPage.practise", { number: partNumber(part) ?? 0 })}
            </ButtonLink>
          </section>
        ))}
      </div>
    </>
  );
}
