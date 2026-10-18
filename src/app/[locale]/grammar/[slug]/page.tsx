import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LevelBadge } from "@/components/content/LevelBadge";
import { RichText } from "@/components/content/RichText";
import { Icon } from "@/components/icons/Icon";
import { CanDoList } from "@/components/lessons/CanDoList";
import { FurtherStudy } from "@/components/lessons/FurtherStudy";
import { LessonPractice } from "@/components/lessons/LessonPractice";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Link } from "@/i18n/navigation";
import { canDoOfLesson, lessonBySlug, questionsForLesson } from "@/lib/content";
import { getContent } from "@/lib/content/load";
import { localized } from "@/lib/content/localize";

type Params = PageProps<"/[locale]/grammar/[slug]">["params"];

const H2 = "font-semi-expanded text-xl font-bold";

export async function generateStaticParams() {
  const content = await getContent();
  return content.grammarLessons.map((lesson) => ({ slug: lesson.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const [content, locale] = await Promise.all([getContent(), getLocale()]);
  const lesson = lessonBySlug(content, slug);
  return lesson
    ? {
        title: localized(lesson.title, locale),
        description: lesson.summary.en.replace(/[*_=]/g, ""),
      }
    : {};
}

export default function GrammarLessonPage({ params }: { params: Params }) {
  return (
    <Suspense
      fallback={
        <div
          aria-hidden="true"
          className="h-40 max-w-xl rounded-page bg-hairline"
        />
      }
    >
      <Lesson params={params} />
    </Suspense>
  );
}

async function Lesson({ params }: { params: Params }) {
  const { slug } = await params;
  const [content, locale, t] = await Promise.all([
    getContent(),
    getLocale(),
    getTranslations(),
  ]);
  const lesson = lessonBySlug(content, slug);
  if (!lesson) notFound();
  const questions = questionsForLesson(content, slug).length;
  const objectives = canDoOfLesson(content, slug);

  return (
    <article className="space-y-12">
      <header className="max-w-[68ch]">
        <p className="flex items-center gap-3 text-sm text-ink-soft">
          <LevelBadge level={lesson.level} />
          {t(`Categories.${lesson.category}`)}
        </p>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-balance font-expanded sm:text-3xl">
          {localized(lesson.title, locale)}
        </h1>
      </header>

      <section aria-labelledby="explanation" className="max-w-[68ch]">
        <h2 id="explanation" className="sr-only">
          {t("Lesson.explanation")}
        </h2>
        <p lang="en" className="prose-reading text-lg">
          <RichText text={lesson.summary.en} />
        </p>
        {lesson.summary.es ? (
          <details className="mt-4 rounded-control border border-hairline px-4 py-3">
            <summary className="cursor-pointer font-semibold">
              {t("Lesson.spanishNote")}
            </summary>
            <p lang="es" className="mt-2 text-ink-soft">
              <RichText text={lesson.summary.es} />
            </p>
          </details>
        ) : null}
      </section>

      <section aria-labelledby="form" className="max-w-[68ch]">
        <h2 id="form" className={H2}>
          {t("Lesson.form")}
        </h2>
        <ul
          lang="en"
          className="mt-4 space-y-2 rounded-page border-[1.5px] border-line bg-sheet p-5"
        >
          {lesson.form.map((line) => (
            <li key={line}>
              <RichText text={line} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="uses" className="max-w-[68ch]">
        <h2 id="uses" className={H2}>
          {t("Lesson.uses")}
        </h2>
        <ul lang="en" className="prose-reading mt-4 space-y-4">
          {lesson.uses.map((use) => (
            <li key={use.text}>
              <RichText text={use.text} />
              {use.note ? (
                <p className="mt-1 font-sans text-sm text-ink-soft">
                  {localized(use.note, locale)}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="examples" className="max-w-[68ch]">
        <h2 id="examples" className={H2}>
          {t("Lesson.examples")}
        </h2>
        <ol className="mt-4 divide-y divide-hairline border-y border-hairline">
          {lesson.examples.map((example) => (
            <li key={example.en} className="py-3">
              <p lang="en" className="prose-reading">
                <RichText text={example.en} />
              </p>
              {example.es ? (
                <details className="mt-1 text-sm text-ink-soft">
                  <summary className="cursor-pointer">
                    {t("Lesson.translation")}
                  </summary>
                  <p lang="es" className="mt-1">
                    {example.es}
                  </p>
                </details>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="mistakes" className="max-w-[68ch]">
        <h2 id="mistakes" className={H2}>
          {t("Lesson.mistakes")}
        </h2>
        <ul className="mt-4 space-y-4">
          {lesson.mistakes.map((mistake) => (
            <li
              key={mistake.wrong}
              className="rounded-page border border-hairline p-4"
            >
              <p lang="en" className="flex items-start gap-2 text-refusal">
                <Icon name="cross" className="mt-0.5 size-5" />
                <span className="sr-only">{t("Lesson.wrong")}: </span>
                <s className="decoration-1">{mistake.wrong}</s>
              </p>
              <p
                lang="en"
                className="mt-1 flex items-start gap-2 font-semibold text-entry"
              >
                <Icon name="check" className="mt-0.5 size-5" />
                <span className="sr-only">{t("Lesson.right")}: </span>
                {mistake.right}
              </p>
              <p className="mt-2 text-ink-soft">
                {localized(mistake.why, locale)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="practice" className="max-w-[68ch]">
        <h2 id="practice" className={H2}>
          {t("Lesson.practice")}
        </h2>
        <div className="mt-4">
          <LessonPractice items={lesson.practice} />
        </div>
      </section>

      {objectives.length > 0 ? (
        <section aria-labelledby="can-do" className="max-w-[68ch]">
          <h2 id="can-do" className={H2}>
            {t("Lesson.canDo")}
          </h2>
          <div className="mt-4">
            <CanDoList items={objectives} />
          </div>
        </section>
      ) : null}

      <div className="grid max-w-[68ch] gap-6">
        <aside aria-labelledby="trainer" className="rounded-page bg-sheet p-5">
          <h2 id="trainer" className="text-lg font-bold font-semi-expanded">
            {t("Lesson.trainerTitle")}
          </h2>
          <p className="mt-1 text-ink-soft">
            {t("Lesson.questions", { count: questions })}
          </p>
          {questions > 0 ? (
            <ButtonLink
              href={{
                pathname: "/practice/[part]",
                params: { part: "core-grammar" },
                query: { point: lesson.slug },
              }}
              variant="primary"
              className="mt-4"
            >
              {t("Lesson.trainerLink")}
            </ButtonLink>
          ) : null}
        </aside>
        <FurtherStudy references={lesson.references} />
      </div>

      <p>
        <Link
          href="/grammar"
          className="underline decoration-1 underline-offset-4 hover:decoration-2"
        >
          {t("Lesson.allLessons")}
        </Link>
      </p>
    </article>
  );
}
