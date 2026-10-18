import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { LevelBadge } from "@/components/content/LevelBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { phrasesByFunction } from "@/lib/content";
import { getContent } from "@/lib/content/load";
import { localized } from "@/lib/content/localize";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Functional");
  return { title: t("title"), description: t("lead") };
}

export default async function FunctionalLanguagePage() {
  const [t, locale, content] = await Promise.all([
    getTranslations(),
    getLocale(),
    getContent(),
  ]);
  const groups = phrasesByFunction(content);

  return (
    <>
      <PageHeader title={t("Functional.title")} lead={t("Functional.lead")} />
      {groups.length === 0 ? (
        <EmptyState
          title={t("Functional.empty")}
          body={t("Functional.emptyBody")}
        />
      ) : (
        <div className="space-y-12">
          <nav aria-labelledby="functional-contents">
            <h2
              id="functional-contents"
              className="text-sm font-semibold text-ink-soft"
            >
              {t("Functional.contents")}
            </h2>
            <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
              {groups.map((group) => (
                <li key={group.function}>
                  <a
                    href={`#${group.function}`}
                    className="underline decoration-1 underline-offset-4 hover:decoration-2"
                  >
                    {t(`Functional.${group.function}`)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {groups.map((group) => (
            <section
              key={group.function}
              id={group.function}
              aria-labelledby={`${group.function}-title`}
              className="max-w-[68ch] scroll-mt-24"
            >
              <h2
                id={`${group.function}-title`}
                className="text-xl font-bold font-semi-expanded"
              >
                {t(`Functional.${group.function}`)}
              </h2>
              <ul className="mt-4 divide-y divide-hairline border-y border-hairline">
                {group.phrases.map((phrase) => (
                  <li key={phrase.id} className="py-3">
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span lang="en" className="font-semibold">
                        {phrase.phrase}
                      </span>
                      <LevelBadge level={phrase.level} />
                      {phrase.register !== "neutral" ? (
                        <span className="text-sm text-ink-soft">
                          {t(`Vocab.${phrase.register}`)}
                        </span>
                      ) : null}
                    </p>
                    <p lang="en" className="prose-reading mt-1">
                      {phrase.example}
                    </p>
                    {phrase.note ? (
                      <p className="mt-1 text-sm text-ink-soft">
                        {localized(phrase.note, locale)}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
