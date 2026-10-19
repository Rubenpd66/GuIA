import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { GatedPhrases } from "@/components/lessons/GatedPhrases";
import { PhraseItem } from "@/components/lessons/PhraseItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { phrasesByFunction } from "@/lib/content";
import { getContent } from "@/lib/content/load";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Functional");
  return { title: t("title"), description: t("lead") };
}

export default async function FunctionalLanguagePage() {
  const [t, content] = await Promise.all([getTranslations(), getContent()]);
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
                {group.phrases
                  .filter((phrase) => phrase.level === "A2")
                  .map((phrase) => (
                    <PhraseItem key={phrase.id} phrase={phrase} />
                  ))}
                {group.phrases.some((phrase) => phrase.level !== "A2") ? (
                  <Suspense
                    fallback={
                      <li
                        aria-hidden="true"
                        className="my-3 h-12 rounded-control bg-hairline"
                      />
                    }
                  >
                    <GatedPhrases fn={group.function} />
                  </Suspense>
                ) : null}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
