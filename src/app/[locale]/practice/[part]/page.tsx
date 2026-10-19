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
import { LockedNotice } from "@/components/access/LockedNotice";
import { getEntitlement } from "@/lib/access/entitlement";
import {
  entriesVisibleTo,
  isVisible,
  lowestLevel,
  visibleTo,
} from "@/lib/access/rule";
import type { Tier } from "@/lib/access/tiers";
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
  const [t, tier] = await Promise.all([getTranslations(), getEntitlement()]);

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
            exercises={visibleTo(
              tier,
              exercisesOfPart(content, "core-grammar"),
            )}
            lessonTitles={lessonTitles}
          />
        ) : (
          <VocabularyTrainer
            tasks={visibleTo(tier, exercisesOfPart(content, "core-vocabulary"))}
          />
        )}
        <HiddenNotice tier={tier} part={part} />
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
        <ReadingTrainer
          part={part}
          tasks={visibleTo(tier, exercisesOfPart(content, part))}
        />
        <HiddenNotice tier={tier} part={part} />
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
        <ListeningTrainer
          part={part}
          tasks={visibleTo(tier, exercisesOfPart(content, part))}
        />
        <HiddenNotice tier={tier} part={part} />
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
          tasks={visibleTo(tier, exercisesOfPart(content, part))}
          phrases={entriesVisibleTo(
            tier,
            phrasesByFunction(content)
              .filter((group) => WRITING_FUNCTIONS.has(group.function))
              .flatMap((group) => group.phrases),
          )}
        />
        <HiddenNotice tier={tier} part={part} />
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
          tasks={visibleTo(tier, exercisesOfPart(content, part))}
          phrases={entriesVisibleTo(
            tier,
            phrasesByFunction(content).flatMap((group) => group.phrases),
          )}
        />
        <HiddenNotice tier={tier} part={part} />
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

/** Under a trainer: how many tasks of this part the learner's plan does not open. */
async function HiddenNotice({ tier, part }: { tier: Tier; part: ExamPart }) {
  const all = exercisesOfPart(await getContent(), part);
  const hidden = all.filter((exercise) => !isVisible(tier, exercise));
  const level = lowestLevel(hidden.map((exercise) => exercise.cefrLevel));
  return level ? (
    <div className="mt-10">
      <LockedNotice level={level} count={hidden.length} />
    </div>
  ) : null;
}
