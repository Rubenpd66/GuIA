"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { SessionHeader } from "@/components/trainer/SessionHeader";
import { Checklist } from "@/components/trainer/Checklist";
import { TrainerSetup } from "@/components/trainer/TrainerSetup";
import { useCountdown } from "@/components/trainer/useCountdown";
import { Button } from "@/components/ui/Button";
import { CEFR_LEVELS, type CefrLevel } from "@/lib/content/schemas/common";
import type { FunctionalPhrase } from "@/lib/content/schemas/lessons";
import { recordAttempt } from "@/lib/progress/progress";
import { readProgress, saveProgress } from "@/lib/progress/useProgress";
import { WRITING_PART_EXAM, formatClock } from "@/lib/trainer/config";
import { createRng, randomSeed } from "@/lib/trainer/random";
import type { TrainerMode } from "@/lib/trainer/reducer";
import {
  RUBRIC_CRITERIA,
  buildWritingSession,
  writingItems,
  type WritingExercise,
  type WritingPart,
} from "@/lib/trainer/writing";
import { clearDrafts, readDraft, saveDraft } from "@/lib/writing/drafts";
import { ModelAnswers } from "./ModelAnswers";
import { PhrasePanel } from "./PhrasePanel";
import { WritingEditor } from "./WritingEditor";

/** A session as the trainer starts it; the mock exam builds its own. */
export type WritingSessionData = {
  id: number;
  mode: TrainerMode;
  task: WritingExercise;
  startedAt: number;
  deadline: number | null;
};
type Session = WritingSessionData;

// Only called from event handlers; the purity lint misreads `start` as render code here.
const now = () => Date.now();

export function WritingTrainer({
  part,
  tasks,
  phrases,
}: {
  part: WritingPart;
  tasks: WritingExercise[];
  phrases: FunctionalPhrase[];
}) {
  const t = useTranslations("Writing.trainer");
  const [mode, setMode] = useState<TrainerMode>("study");
  const [level, setLevel] = useState<CefrLevel | "all">("all");
  const [session, setSession] = useState<Session | null>(null);
  const minutes = WRITING_PART_EXAM[part].seconds / 60;

  const levels = useMemo(
    () => CEFR_LEVELS.filter((l) => tasks.some((t) => t.cefrLevel === l)),
    [tasks],
  );
  const levelFilter = level === "all" ? undefined : [level];
  const poolSize = tasks.filter(
    (task) => !levelFilter || levelFilter.includes(task.cefrLevel),
  ).length;

  function start() {
    const [task] = buildWritingSession({
      tasks,
      part,
      rng: createRng(randomSeed()),
      levels: levelFilter,
      draftedIds: tasks
        .filter((task) =>
          writingItems(task).some((item) => readDraft(item.key) !== ""),
        )
        .map((task) => task.id),
    });
    if (!task) return;
    const startedAt = now();
    setSession({
      id: startedAt,
      mode,
      task,
      startedAt,
      deadline: mode === "exam" ? startedAt + minutes * 60_000 : null,
    });
  }

  if (session) {
    return (
      <WritingSession
        key={session.id}
        part={part}
        session={session}
        phrases={phrases}
        onNewSession={start}
        onChangeSettings={() => setSession(null)}
      />
    );
  }

  return (
    <TrainerSetup
      mode={mode}
      onModeChange={setMode}
      level={level}
      onLevelChange={setLevel}
      levels={levels}
      examCount={1}
      examMinutes={minutes}
      studyHint={t("studyHint")}
      examHint={t("examHint", { minutes })}
      bankText={t("bankSize", { count: poolSize })}
      poolSize={poolSize}
      mistakes={0}
      onStart={start}
      onReviewMistakes={() => {}}
    />
  );
}

type WritingSessionProps = {
  part: WritingPart;
  session: Session;
  phrases: FunctionalPhrase[];
  onNewSession?: () => void;
  onChangeSettings?: () => void;
  /** Set by the mock exam: called once the self-assessment is saved, instead of the summary. */
  onSaved?: (result: { correct: number; total: number }) => void;
};

export function WritingSession({
  part,
  session,
  phrases,
  onNewSession,
  onChangeSettings,
  onSaved,
}: WritingSessionProps) {
  const t = useTranslations("Writing.trainer");
  const tTrainer = useTranslations("Trainer");
  const tWriting = useTranslations("Writing");
  const { task, mode } = session;
  const items = writingItems(task);
  const [texts, setTexts] = useState<Record<string, string>>(() =>
    Object.fromEntries(items.map((item) => [item.key, readDraft(item.key)])),
  );
  const [reviewing, setReviewing] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [saved, setSaved] = useState<{ correct: number; total: number }>();
  const reviewRef = useRef<HTMLHeadingElement>(null);
  const durationMs = WRITING_PART_EXAM[part].seconds * 1000;

  const remaining = useCountdown(
    reviewing ? null : session.deadline,
    durationMs,
    () => {
      setTimeUp(true);
      setReviewing(true);
    },
  );
  useEffect(() => {
    if (reviewing) reviewRef.current?.focus();
  }, [reviewing]);

  const write = (key: string, text: string) => {
    setTexts((current) => ({ ...current, [key]: text }));
    saveDraft(key, text, now());
  };

  const save = (correct: number, total: number) => {
    saveProgress(
      recordAttempt(readProgress(), {
        part,
        mode,
        startedAt: session.startedAt,
        finishedAt: now(),
        correct,
        total,
      }),
    );
    clearDrafts(items.map((item) => item.key));
    if (onSaved) onSaved({ correct, total });
    else setSaved({ correct, total });
  };

  return (
    <section
      aria-label={t(`instructions.${part}`)}
      className="max-w-[68ch] space-y-8"
    >
      <SessionHeader
        counter={t(mode === "exam" ? "examMode" : "studyMode")}
        remaining={session.deadline && !reviewing ? remaining : undefined}
        progress={null}
        actions={
          mode === "study" && !reviewing ? <Stopwatch part={part} /> : null
        }
      />

      <h2 className="text-lg font-bold font-semi-expanded">
        {t(`instructions.${part}`)}
      </h2>

      <div className="space-y-2">
        <p lang="en" className="prose-reading text-ink-soft">
          {task.context}
        </p>
        {task.examPart === "writing-4" ? (
          <blockquote
            lang="en"
            className="prose-reading border-l-4 border-line pl-4"
          >
            {task.situation}
          </blockquote>
        ) : null}
      </div>

      {mode === "study" && !reviewing ? (
        <div className="space-y-3">
          <details className="rounded-page bg-sheet p-4">
            <summary className="min-h-11 cursor-pointer content-center font-semibold">
              {t("tips")}
            </summary>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              {(["s1", "s2", "s3", "s4"] as const).map((key) => (
                <li key={key}>{t(`strategies.${part}.${key}`)}</li>
              ))}
            </ul>
          </details>
          <PhrasePanel
            phrases={phrases}
            initialRegister={part === "writing-4" ? "all" : "informal"}
          />
        </div>
      ) : null}

      {reviewing ? (
        <h2
          ref={reviewRef}
          tabIndex={-1}
          className="text-xl font-bold font-semi-expanded focus:outline-none"
        >
          {t("reviewTitle")}
        </h2>
      ) : null}
      {timeUp ? (
        <p role="status" className="text-refusal">
          {tTrainer("timeUp")}
        </p>
      ) : null}

      <ol className="space-y-8">
        {items.map((item, i) => (
          <li key={item.key} className="space-y-4">
            <WritingEditor
              id={`w-${item.key}`}
              label={
                <>
                  {items.length > 1 ? (
                    <span className="mr-2 font-sans text-sm font-bold text-ink-soft">
                      {i + 1}.
                    </span>
                  ) : null}
                  {item.recipient ? (
                    <span className="block font-sans text-sm font-semibold text-ink-soft">
                      {t("to", { recipient: item.recipient })}
                    </span>
                  ) : null}
                  {item.prompt}
                </>
              }
              value={texts[item.key] ?? ""}
              onChange={(text) => write(item.key, text)}
              range={item.range}
              readOnly={reviewing}
              rows={
                task.examPart === "writing-1"
                  ? 1
                  : task.examPart === "writing-4" && i === 1
                    ? 12
                    : 6
              }
            />
            {reviewing && item.models ? (
              <ModelAnswers models={item.models} />
            ) : null}
            {reviewing && item.sampleAnswers ? (
              <p className="text-sm">
                <span className="font-semibold">{t("samples")}</span>{" "}
                <span lang="en">{item.sampleAnswers.join(" · ")}</span>
              </p>
            ) : null}
          </li>
        ))}
      </ol>

      {!reviewing ? (
        <Button variant="primary" onClick={() => setReviewing(true)}>
          {mode === "exam" ? tTrainer("finish") : t("showModels")}
        </Button>
      ) : saved ? (
        <div role="status" className="space-y-4">
          <p className="text-lg font-semibold">{t("savedSummary", saved)}</p>
          <p className="text-sm text-ink-soft">{tTrainer("estimate")}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="primary" onClick={onNewSession}>
              {tTrainer("newSession")}
            </Button>
            <Button variant="ghost" onClick={onChangeSettings}>
              {tTrainer("changeSettings")}
            </Button>
          </div>
        </div>
      ) : (
        <Checklist
          title={t("checklistTitle")}
          note={t("checklistNote")}
          saveLabel={t("saveAssessment")}
          criteria={RUBRIC_CRITERIA.map((key) => ({
            key,
            label: tWriting(`rubric.${key}`),
            hint: tWriting(`rubricHints.${part}.${key}`),
          }))}
          onSave={save}
        />
      )}
    </section>
  );
}

/** Study mode's optional stopwatch, shown against the exam's recommended time. */
function Stopwatch({ part }: { part: WritingPart }) {
  const t = useTranslations("Writing.trainer");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (startedAt === null) return;
    const id = window.setInterval(
      () => setElapsed(Date.now() - startedAt),
      1000,
    );
    return () => window.clearInterval(id);
  }, [startedAt]);
  const target = formatClock(WRITING_PART_EXAM[part].seconds * 1000);
  if (startedAt === null)
    return (
      <Button variant="ghost" onClick={() => setStartedAt(Date.now())}>
        {t("startStopwatch")}
      </Button>
    );
  return (
    <p className="font-semibold tabular-nums">
      <span className="sr-only">{t("stopwatchLabel")} </span>
      {formatClock(elapsed)} / {target}
    </p>
  );
}
