import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tilt } from "@/components/ui/Tilt";
import { entriesOfGroup } from "@/lib/content";
import { getContent } from "@/lib/content/load";
import { localized } from "@/lib/content/localize";
import {
  VOCAB_SETS,
  type VocabularyGroup,
} from "@/lib/content/schemas/lessons";
import { alternatesFor } from "@/lib/seo/alternates";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Sections.vocabulary");
  return {
    title: t("title"),
    description: t("lead"),
    alternates: await alternatesFor("/vocabulary"),
  };
}

const isSet = (group: VocabularyGroup) =>
  (VOCAB_SETS as readonly string[]).includes(group.slug);

export default async function VocabularyIndexPage() {
  const [t, locale, content] = await Promise.all([
    getTranslations(),
    getLocale(),
    getContent(),
  ]);
  const sections = [
    {
      id: "topics",
      title: t("Vocab.topicsTitle"),
      groups: content.vocabularyGroups.filter((g) => !isSet(g)),
    },
    {
      id: "sets",
      title: t("Vocab.setsTitle"),
      groups: content.vocabularyGroups.filter(isSet),
    },
  ];

  return (
    <>
      <PageHeader
        title={t("Sections.vocabulary.title")}
        lead={t("Sections.vocabulary.lead")}
      />
      <div className="flex flex-col gap-16">
        {sections.map((section) => (
          <section key={section.id} aria-labelledby={`vocab-${section.id}`}>
            <h2 id={`vocab-${section.id}`} className="text-xl font-bold">
              {section.title}
            </h2>
            {section.groups.length === 0 ? (
              <p className="mt-3 text-ink-soft">
                {t("Syllabus.entries", { count: 0 })}
              </p>
            ) : (
              <ul className="enter-stagger mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {section.groups.map((group, i) => (
                  <li key={group.slug} style={{ "--i": i } as CSSProperties}>
                    <Tilt className="h-full">
                      <Card
                        href={{
                          pathname: "/vocabulary/[slug]",
                          params: { slug: group.slug },
                        }}
                        className="flex h-full flex-col gap-2"
                      >
                        <span className="font-semibold">
                          {localized(group.title, locale)}
                        </span>
                        <span className="text-sm text-ink-soft">
                          {localized(group.summary, locale)}
                        </span>
                        <span className="mt-auto text-sm font-medium text-accent">
                          {t("Syllabus.entries", {
                            count: entriesOfGroup(content, group.slug).length,
                          })}
                        </span>
                      </Card>
                    </Tilt>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
