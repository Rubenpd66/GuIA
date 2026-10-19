import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LevelBadge } from "@/components/content/LevelBadge";
import { FurtherStudy } from "@/components/lessons/FurtherStudy";
import { PageHeader } from "@/components/ui/PageHeader";
import { Link } from "@/i18n/navigation";
import { entriesOfGroup, groupBySlug } from "@/lib/content";
import { getContent } from "@/lib/content/load";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE } from "@/config/site";
import { localized } from "@/lib/content/localize";

type Params = PageProps<"/[locale]/vocabulary/[slug]">["params"];

export async function generateStaticParams() {
  const content = await getContent();
  return content.vocabularyGroups.map((group) => ({ slug: group.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const [content, locale] = await Promise.all([getContent(), getLocale()]);
  const group = groupBySlug(content, slug);
  return group
    ? {
        title: localized(group.title, locale),
        description: localized(group.summary, locale),
      }
    : {};
}

export default function VocabularyGroupPage({ params }: { params: Params }) {
  return (
    <Suspense
      fallback={
        <div
          aria-hidden="true"
          className="h-40 max-w-xl rounded-page bg-hairline"
        />
      }
    >
      <Group params={params} />
    </Suspense>
  );
}

async function Group({ params }: { params: Params }) {
  const { slug } = await params;
  const [content, locale, t] = await Promise.all([
    getContent(),
    getLocale(),
    getTranslations(),
  ]);
  const group = groupBySlug(content, slug);
  if (!group) notFound();
  const entries = entriesOfGroup(content, slug);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "LearningResource",
          name: localized(group.title, locale),
          inLanguage: "en-GB",
          learningResourceType: "Vocabulary list",
          isAccessibleForFree: true,
          publisher: { "@type": "Person", name: SITE.owner.name },
        }}
      />
      <PageHeader
        title={localized(group.title, locale)}
        lead={localized(group.summary, locale)}
      />
      <ul className="max-w-[68ch] divide-y divide-hairline border-y border-hairline">
        {entries.map((entry) => (
          <li key={entry.id} lang="en" className="py-5">
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-xl font-bold font-semi-expanded">
                {entry.headword}
              </span>
              <span lang={locale} className="text-sm text-ink-soft italic">
                {t(`Vocab.${entry.pos}`)}
              </span>
              <LevelBadge level={entry.level} className="h-6 min-w-8 text-xs" />
              {entry.register && entry.register !== "neutral" ? (
                <span lang={locale} className="text-sm text-ink-soft">
                  {t(`Vocab.${entry.register}`)}
                </span>
              ) : null}
            </p>
            <p className="prose-reading mt-2">{entry.definition}</p>
            <ul className="prose-reading mt-2 space-y-1 text-ink-soft italic">
              {entry.examples.map((example) => (
                <li key={example}>{example}</li>
              ))}
            </ul>
            {entry.collocations?.length ? (
              <p className="mt-3 text-sm">
                <span lang={locale} className="font-semibold">
                  {t("Vocab.collocations")}:{" "}
                </span>
                {entry.collocations.join(", ")}
              </p>
            ) : null}
            {entry.synonyms?.length ? (
              <p className="mt-1 text-sm">
                <span lang={locale} className="font-semibold">
                  {t("Vocab.synonyms")}:{" "}
                </span>
                {entry.synonyms.join(", ")}
              </p>
            ) : null}
            {entry.falseFriend ? (
              <div
                lang={locale}
                className="mt-3 rounded-control border-l-[3px] border-foil-ink bg-sheet px-4 py-3"
              >
                <p className="font-semibold text-foil-ink">
                  {t("Vocab.falseFriend")}:{" "}
                  {t("Vocab.looksLike", { spanish: entry.falseFriend.spanish })}
                </p>
                <p className="mt-1 text-ink-soft">
                  {localized(entry.falseFriend.trap, locale)}
                </p>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      <div className="mt-8 max-w-[68ch]">
        <FurtherStudy references={group.references} />
      </div>
      <p className="mt-8">
        <Link
          href="/vocabulary"
          className="underline decoration-1 underline-offset-4 hover:decoration-2"
        >
          {t("Vocab.allGroups")}
        </Link>
      </p>
    </>
  );
}
