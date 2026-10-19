import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LevelBadge } from "@/components/content/LevelBadge";
import { RichText } from "@/components/content/RichText";
import { GatedLessonBody } from "@/components/lessons/GatedLessonBody";
import { LessonBody } from "@/components/lessons/LessonBody";
import { lessonBySlug } from "@/lib/content";
import { getContent } from "@/lib/content/load";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE } from "@/config/site";
import { localized } from "@/lib/content/localize";

type Params = PageProps<"/[locale]/grammar/[slug]">["params"];

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
  const free = lesson.level === "A2";

  return (
    <article className="space-y-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "LearningResource",
          name: localized(lesson.title, locale),
          description: lesson.summary.en.replace(/[*_=]/g, ""),
          inLanguage: "en-GB",
          educationalLevel: lesson.level,
          learningResourceType: "Grammar lesson",
          teaches: localized(lesson.title, locale),
          isAccessibleForFree: free,
          // Google's markup for paywalled content, so the preview is not taken for cloaking.
          ...(free
            ? {}
            : {
                hasPart: {
                  "@type": "WebPageElement",
                  isAccessibleForFree: false,
                  cssSelector: "[data-paywall]",
                },
              }),
          publisher: { "@type": "Person", name: SITE.owner.name },
        }}
      />
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

      {free ? (
        <LessonBody slug={slug} />
      ) : (
        <Suspense
          fallback={
            <div
              aria-hidden="true"
              className="h-40 max-w-xl rounded-page bg-hairline"
            />
          }
        >
          <GatedLessonBody slug={slug} />
        </Suspense>
      )}
    </article>
  );
}
