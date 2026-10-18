import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Link } from "@/i18n/navigation";
import { entriesOfGroup } from "@/lib/content";
import { getContent } from "@/lib/content/load";
import { localized } from "@/lib/content/localize";
import {
  VOCAB_SETS,
  type VocabularyGroup,
} from "@/lib/content/schemas/lessons";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Sections.vocabulary");
  return { title: t("title"), description: t("lead") };
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
      <div className="space-y-12">
        {sections.map((section) => (
          <section key={section.id} aria-labelledby={`vocab-${section.id}`}>
            <h2
              id={`vocab-${section.id}`}
              className="text-xl font-bold font-semi-expanded"
            >
              {section.title}
            </h2>
            {section.groups.length === 0 ? (
              <p className="mt-3 text-ink-soft">
                {t("Syllabus.entries", { count: 0 })}
              </p>
            ) : (
              <ul className="mt-3 border-t border-hairline">
                {section.groups.map((group) => (
                  <li key={group.slug} className="border-b border-hairline">
                    <Link
                      href={{
                        pathname: "/vocabulary/[slug]",
                        params: { slug: group.slug },
                      }}
                      className="flex min-h-14 flex-col justify-center gap-0.5 py-3 transition-colors duration-150 hover:text-cover sm:flex-row sm:items-baseline sm:justify-between sm:gap-6 dark:hover:text-foil"
                    >
                      <span>
                        <span className="block font-semibold">
                          {localized(group.title, locale)}
                        </span>
                        <span className="block max-w-[60ch] text-sm text-ink-soft">
                          {localized(group.summary, locale)}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm text-ink-soft">
                        {t("Syllabus.entries", {
                          count: entriesOfGroup(content, group.slug).length,
                        })}
                      </span>
                    </Link>
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
