import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import {
  FlashcardTrainer,
  type FlashcardData,
} from "@/components/flashcards/FlashcardTrainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { getContent } from "@/lib/content/load";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Sections.flashcards");
  return { title: t("title"), description: t("lead") };
}

async function deck(): Promise<FlashcardData[]> {
  const content = await getContent();
  return [
    ...content.vocabulary.map((entry) => ({
      id: `v:${entry.id}`,
      deck: "vocabulary" as const,
      level: entry.level,
      topics: entry.topics,
      headword: entry.headword,
      pos: entry.pos,
      definition: entry.definition,
      example: entry.examples[0]!,
      collocations: entry.collocations ?? [],
      ...(entry.falseFriend ? { falseFriend: entry.falseFriend } : {}),
    })),
    ...content.functional.map((phrase) => ({
      id: `f:${phrase.id}`,
      deck: "phrases" as const,
      level: phrase.level,
      topics: [],
      function: phrase.function,
      register: phrase.register,
      phrase: phrase.phrase,
      example: phrase.example,
      ...(phrase.note ? { note: phrase.note } : {}),
    })),
  ];
}

async function Trainer() {
  return <FlashcardTrainer cards={await deck()} />;
}

export default async function FlashcardsPage() {
  const t = await getTranslations("Sections.flashcards");
  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <Suspense
        fallback={
          <div
            aria-hidden="true"
            className="h-24 max-w-md rounded-control bg-hairline"
          />
        }
      >
        <Trainer />
      </Suspense>
    </>
  );
}
