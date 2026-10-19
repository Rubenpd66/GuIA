import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FurtherStudy } from "@/components/lessons/FurtherStudy";
import { GatedEntries } from "@/components/lessons/GatedEntries";
import { VocabEntry } from "@/components/lessons/VocabEntry";
import { PageHeader } from "@/components/ui/PageHeader";
import { Link } from "@/i18n/navigation";
import { entriesOfGroup, groupBySlug } from "@/lib/content";
import { getContent } from "@/lib/content/load";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE } from "@/config/site";
import { localized } from "@/lib/content/localize";
import { alternatesFor } from "@/lib/seo/alternates";

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
        alternates: await alternatesFor("/vocabulary/[slug]", { slug }),
      }
    : {};
}

export default function VocabularyGroupPage({ params }: { params: Params }) {
  return (
    <Suspense
      fallback={
        <div
          aria-hidden="true"
          className="h-40 max-w-xl rounded-card bg-hairline"
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
  const free = entries.filter((entry) => entry.level === "A2");
  const allFree = free.length === entries.length;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "LearningResource",
          name: localized(group.title, locale),
          inLanguage: "en-GB",
          learningResourceType: "Vocabulary list",
          isAccessibleForFree: allFree,
          ...(allFree
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
      <PageHeader
        title={localized(group.title, locale)}
        lead={localized(group.summary, locale)}
      />
      <ul className="max-w-[68ch] divide-y divide-hairline border-y border-hairline">
        {free.map((entry) => (
          <VocabEntry key={entry.id} entry={entry} />
        ))}
        {allFree ? null : (
          <Suspense
            fallback={
              <li
                aria-hidden="true"
                className="my-5 h-24 rounded-card bg-hairline"
              />
            }
          >
            <GatedEntries group={slug} />
          </Suspense>
        )}
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
