import { getLocale, getTranslations } from "next-intl/server";
import { Icon } from "@/components/icons/Icon";
import { RichText } from "@/components/content/RichText";
import { CanDoList } from "@/components/lessons/CanDoList";
import { FurtherStudy } from "@/components/lessons/FurtherStudy";
import { LessonPractice } from "@/components/lessons/LessonPractice";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Link } from "@/i18n/navigation";
import { canDoOfLesson, lessonBySlug, questionsForLesson } from "@/lib/content";
import { getContent } from "@/lib/content/load";
import { localized } from "@/lib/content/localize";

const H2 = "text-xl font-bold";

/**
 * Everything after a lesson's summary. It loads the lesson itself by slug, so a page can put
 * it behind the access check without the text passing through the static part.
 */
export async function LessonBody({ slug }: { slug: string }) {
  const [content, locale, t] = await Promise.all([
    getContent(),
    getLocale(),
    getTranslations(),
  ]);
  const lesson = lessonBySlug(content, slug);
  if (!lesson) return null;
  const questions = questionsForLesson(content, slug).length;
  const objectives = canDoOfLesson(content, slug);

  return (
    <>
      <section aria-labelledby="form" className="max-w-[68ch]">
        <h2 id="form" className={H2}>
          {t("Lesson.form")}
        </h2>
        <ul lang="en" className="mt-4 space-y-2 rounded-card bg-surface p-5">
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
              className="rounded-card border border-hairline p-4"
            >
              <p lang="en" className="flex items-start gap-2 text-danger">
                <Icon name="cross" className="mt-0.5 size-5" />
                <span className="sr-only">{t("Lesson.wrong")}: </span>
                <s className="decoration-1">{mistake.wrong}</s>
              </p>
              <p
                lang="en"
                className="mt-1 flex items-start gap-2 font-semibold text-success"
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
        <aside
          aria-labelledby="trainer"
          className="rounded-card bg-surface p-5"
        >
          <h2 id="trainer" className="text-lg font-bold">
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
    </>
  );
}
