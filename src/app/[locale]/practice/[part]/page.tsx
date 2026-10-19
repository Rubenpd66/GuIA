import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListeningTrainer } from "@/components/listening/ListeningTrainer";
import { ReadingTrainer } from "@/components/reading/ReadingTrainer";
import { GrammarTrainer } from "@/components/trainer/GrammarTrainer";
import { VocabularyTrainer } from "@/components/trainer/VocabularyTrainer";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { PHASE_OF_SKILL } from "@/config/sections";
import { SpeakingTrainer } from "@/components/speaking/SpeakingTrainer";
import { WritingTrainer } from "@/components/writing/WritingTrainer";
import { exercisesOfPart, phrasesByFunction } from "@/lib/content";
import { getContent } from "@/lib/content/load";
import { localized } from "@/lib/content/localize";
import {
  EXAM_PARTS,
  SKILL_OF_PART,
  isExamPart,
  partNumber,
  type ExamPart,
} from "@/lib/exam/format";

/** Phrase functions that help in writing; the rest (buying time, interrupting…) are for speaking. */
const WRITING_FUNCTIONS = new Set([
  "opinion",
  "hedging",
  "contrast",
  "addition",
  "conclusion",
  "comparison",
  "speculation",
]);

export function generateStaticParams() {
  return EXAM_PARTS.map((part) => ({ part }));
}

async function titleOf(part: ExamPart) {
  const t = await getTranslations();
  const name = t(`Parts.${part}`);
  const number = partNumber(part);
  return number === null
    ? t("Practice.coreTitle", { name })
    : t("Practice.title", {
        skill: t(`Skills.${SKILL_OF_PART[part]}`),
        number,
        name,
      });
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/practice/[part]">): Promise<Metadata> {
  const { part } = await params;
  return isExamPart(part) ? { title: await titleOf(part) } : {};
}

type Params = PageProps<"/[locale]/practice/[part]">["params"];

/** Reading the part inside Suspense keeps client navigation to this route instant. */
export default function PracticePartPage({ params }: { params: Params }) {
  return (
    <Suspense
      fallback={
        <div
          aria-hidden="true"
          className="h-24 max-w-md rounded-control bg-hairline"
        />
      }
    >
      <PracticePart params={params} />
    </Suspense>
  );
}

async function PracticePart({ params }: { params: Params }) {
  const { part } = await params;
  // Unknown parts are not prerendered and must not render a trainer.
  if (!isExamPart(part)) notFound();
  const t = await getTranslations();

  if (part === "core-grammar" || part === "core-vocabulary") {
    const [content, locale] = await Promise.all([getContent(), getLocale()]);
    const lessonTitles = Object.fromEntries(
      content.grammarLessons.map((lesson) => [
        lesson.slug,
        localized(lesson.title, locale),
      ]),
    );
    return (
      <>
        <PageHeader title={await titleOf(part)} />
        {part === "core-grammar" ? (
          <GrammarTrainer
            exercises={exercisesOfPart(content, "core-grammar")}
            lessonTitles={lessonTitles}
          />
        ) : (
          <VocabularyTrainer
            tasks={exercisesOfPart(content, "core-vocabulary")}
          />
        )}
      </>
    );
  }

  if (
    part === "reading-1" ||
    part === "reading-2" ||
    part === "reading-3" ||
    part === "reading-4"
  ) {
    const content = await getContent();
    return (
      <>
        <PageHeader title={await titleOf(part)} />
        <ReadingTrainer part={part} tasks={exercisesOfPart(content, part)} />
      </>
    );
  }

  if (
    part === "listening-1" ||
    part === "listening-2" ||
    part === "listening-3" ||
    part === "listening-4"
  ) {
    const content = await getContent();
    return (
      <>
        <PageHeader title={await titleOf(part)} />
        <ListeningTrainer part={part} tasks={exercisesOfPart(content, part)} />
      </>
    );
  }

  if (
    part === "writing-1" ||
    part === "writing-2" ||
    part === "writing-3" ||
    part === "writing-4"
  ) {
    const content = await getContent();
    return (
      <>
        <PageHeader title={await titleOf(part)} />
        <WritingTrainer
          part={part}
          tasks={exercisesOfPart(content, part)}
          phrases={phrasesByFunction(content)
            .filter((group) => WRITING_FUNCTIONS.has(group.function))
            .flatMap((group) => group.phrases)}
        />
      </>
    );
  }

  if (
    part === "speaking-1" ||
    part === "speaking-2" ||
    part === "speaking-3" ||
    part === "speaking-4"
  ) {
    const content = await getContent();
    return (
      <>
        <PageHeader title={await titleOf(part)} />
        <SpeakingTrainer
          part={part}
          tasks={exercisesOfPart(content, part)}
          phrases={phrasesByFunction(content).flatMap((group) => group.phrases)}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title={await titleOf(part)} />
      <EmptyState
        title={t("Coming.title")}
        body={t("Coming.body", { phase: PHASE_OF_SKILL[SKILL_OF_PART[part]] })}
        action={<ButtonLink href="/practice">{t("Nav.practice")}</ButtonLink>}
      />
    </>
  );
}
