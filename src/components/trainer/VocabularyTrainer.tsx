"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Explanation } from "@/components/content/Explanation";
import { GapSentence } from "@/components/content/GapSentence";
import { Icon } from "@/components/icons/Icon";
import { Button } from "@/components/ui/Button";
import { CEFR_LEVELS, type CefrLevel } from "@/lib/content/schemas/common";
import type { CoreVocabularyExercise } from "@/lib/content/schemas/core";
import { countGaps } from "@/lib/content/text";
import { cx } from "@/lib/cx";
import { mistakeKeys, recordSession } from "@/lib/progress/progress";
import {
  readProgress,
  saveProgress,
  useProgress,
} from "@/lib/progress/useProgress";
import { CORE_PART_EXAM, STUDY_SESSION_SIZE } from "@/lib/trainer/config";
import { createRng, randomSeed } from "@/lib/trainer/random";
import {
  initialTrainerState,
  trainerReducer,
  type TrainerMode,
} from "@/lib/trainer/reducer";
import { scoreItems, type Answers, type ItemResult } from "@/lib/trainer/score";
import {
  buildVocabularySession,
  vocabularyKey,
  type VocabularyTask,
} from "@/lib/trainer/session";
import { Perforations } from "./Perforations";
import { ResultsView } from "./ResultsView";
import { SessionHeader } from "./SessionHeader";
import { TrainerSetup } from "./TrainerSetup";
import { useCountdown } from "./useCountdown";

/** A session as the trainer starts it; the placement test and mock exam build their own. */
export type VocabularySessionData = {
  id: number;
  mode: TrainerMode;
  tasks: VocabularyTask[];
  startedAt: number;
  deadline: number | null;
};
type Session = VocabularySessionData;

type Outcome = {
  correct: number;
  total: number;
  results: ItemResult[];
  timeUp: boolean;
};

const itemsOf = (tasks: VocabularyTask[]) =>
  tasks.flatMap((task) => task.items);

export function VocabularyTrainer({
  tasks,
}: {
  tasks: CoreVocabularyExercise[];
}) {
  const progress = useProgress();
  const [mode, setMode] = useState<TrainerMode>("study");
  const [level, setLevel] = useState<CefrLevel | "all">("all");
  const [session, setSession] = useState<Session | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const levels = useMemo(
    () => CEFR_LEVELS.filter((l) => tasks.some((t) => t.cefrLevel === l)),
    [tasks],
  );
  const levelFilter = level === "all" ? undefined : [level];
  const poolSize = tasks
    .filter((task) => !levelFilter || levelFilter.includes(task.cefrLevel))
    .reduce((sum, task) => sum + task.items.length, 0);
  const knownKeys = new Set(
    tasks.flatMap((task) =>
      task.items.map((item) => vocabularyKey(task.id, item.id)),
    ),
  );
  const mistakes = mistakeKeys(progress, "core-vocabulary").filter((key) =>
    knownKeys.has(key),
  );

  function start(onlyKeys?: string[]) {
    const startedAt = Date.now();
    const exam = mode === "exam";
    const sessionTasks = buildVocabularySession({
      tasks,
      count: exam ? CORE_PART_EXAM.vocabulary.count : STUDY_SESSION_SIZE,
      rng: createRng(randomSeed()),
      ...(onlyKeys ? { onlyKeys } : { levels: levelFilter }),
    });
    if (sessionTasks.length === 0) return;
    setOutcome(null);
    setSession({
      id: startedAt,
      mode,
      tasks: sessionTasks,
      startedAt,
      deadline: exam
        ? startedAt + CORE_PART_EXAM.vocabulary.seconds * 1000
        : null,
    });
  }

  function finish(
    current: Session,
    answers: Answers,
    timeUp: boolean,
    finishedAt: number,
  ) {
    const scored = scoreItems(itemsOf(current.tasks), answers);
    saveProgress(
      recordSession(readProgress(), {
        part: "core-vocabulary",
        mode: current.mode,
        startedAt: current.startedAt,
        finishedAt,
        results: scored.results,
      }),
    );
    setOutcome({ ...scored, timeUp });
  }

  if (session && outcome) {
    const wrong = outcome.results.filter((r) => !r.correct);
    return (
      <ResultsView
        correct={outcome.correct}
        total={outcome.total}
        timeUp={outcome.timeUp}
        wrongCount={wrong.length}
        onNewSession={() => start()}
        onReviewThese={() => start(wrong.map((r) => r.key))}
        onChangeSettings={() => {
          setSession(null);
          setOutcome(null);
        }}
      >
        <MistakeList tasks={session.tasks} results={wrong} />
      </ResultsView>
    );
  }

  if (session) {
    return (
      <VocabularySession
        key={session.id}
        session={session}
        onFinish={(answers, timeUp, at) => finish(session, answers, timeUp, at)}
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
      examCount={CORE_PART_EXAM.vocabulary.count}
      examMinutes={CORE_PART_EXAM.vocabulary.seconds / 60}
      poolSize={poolSize}
      mistakes={mistakes.length}
      onStart={() => start()}
      onReviewMistakes={() => start(mistakes)}
    />
  );
}

type VocabularySessionProps = {
  session: Session;
  onFinish: (answers: Answers, timeUp: boolean, finishedAt: number) => void;
};

export function VocabularySession({
  session,
  onFinish,
}: VocabularySessionProps) {
  const t = useTranslations("Trainer");
  const tTypes = useTranslations("VocabTypes");
  const tLesson = useTranslations("Lesson");
  const locale = useLocale();
  const { tasks, mode } = session;
  const [state, dispatch] = useReducer(
    trainerReducer,
    { mode, steps: tasks.length, startedAt: session.startedAt },
    initialTrainerState,
  );
  const task = tasks[state.index]!;
  const last = state.index === tasks.length - 1;
  const checked = task.items.every((item) => state.revealed[item.key]);
  const firstSelectRef = useRef<HTMLSelectElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  // Move focus to the first answer of each new task, and to Next once it is checked.
  useEffect(() => {
    firstSelectRef.current?.focus();
  }, [state.index]);
  useEffect(() => {
    if (checked) nextRef.current?.focus();
  }, [checked]);

  const finish = (timeUp = false) => {
    const at = Date.now();
    dispatch({ type: "finish", at });
    onFinish(state.answers, timeUp, at);
  };
  const remaining = useCountdown(
    session.deadline,
    CORE_PART_EXAM.vocabulary.seconds * 1000,
    () => finish(true),
  );
  const advance = () => (last ? finish() : dispatch({ type: "next" }));

  const allItems = itemsOf(tasks);
  const holes = allItems.map((item) => {
    if (task.items.includes(item)) return "current" as const;
    if (state.revealed[item.key])
      return state.answers[item.key] === item.answer
        ? ("right" as const)
        : ("wrong" as const);
    return state.answers[item.key] !== undefined
      ? ("answered" as const)
      : ("open" as const);
  });

  return (
    <section
      aria-label={t("task", { current: state.index + 1, total: tasks.length })}
      className="max-w-[68ch] space-y-8"
    >
      <SessionHeader
        counter={t("task", { current: state.index + 1, total: tasks.length })}
        remaining={session.deadline ? remaining : undefined}
        progress={<Perforations states={holes} />}
        actions={
          mode === "exam" ? (
            <Button variant="ghost" onClick={() => finish()}>
              {t("finish")}
            </Button>
          ) : null
        }
      />

      <div>
        <h2 className="text-lg font-bold">{tTypes(task.vocabType)}</h2>
        {task.instructions ? (
          <p lang="en" className="mt-1 text-ink-soft">
            {task.instructions}
          </p>
        ) : null}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-ink-soft">{t("wordBank")}</h3>
        <ul lang="en" className="mt-2 flex flex-wrap gap-2">
          {task.options.map((word) => (
            <li
              key={word}
              className="rounded-control border border-hairline bg-surface px-3 py-1"
            >
              {word}
            </li>
          ))}
        </ul>
      </div>

      <ol className="space-y-5">
        {task.items.map((item, i) => {
          const chosen = state.answers[item.key];
          const revealed = Boolean(state.revealed[item.key]);
          const right = chosen === item.answer;
          const selectId = `vocab-${item.key}`;
          return (
            <li key={item.key} className="space-y-2">
              <label
                htmlFor={selectId}
                lang="en"
                className="prose-reading block text-lg"
              >
                <span className="mr-2 font-sans text-sm font-bold text-ink-soft">
                  {i + 1}.
                </span>
                {countGaps(item.prompt) > 0 ? (
                  <GapSentence text={item.prompt} gapLabel={tLesson("gap")} />
                ) : (
                  item.prompt
                )}
              </label>
              <div className="flex items-center gap-3">
                <select
                  ref={i === 0 ? firstSelectRef : undefined}
                  id={selectId}
                  value={chosen ?? ""}
                  disabled={revealed}
                  onChange={(event) =>
                    dispatch({
                      type: "answer",
                      key: item.key,
                      choice: Number(event.target.value),
                    })
                  }
                  className={cx(
                    "min-h-12 w-full max-w-xs rounded-control border-[1.5px] bg-canvas px-3 disabled:opacity-100",
                    !revealed && "border-line",
                    revealed && right && "border-success",
                    revealed && !right && "border-danger",
                  )}
                >
                  <option value="" disabled>
                    {t("chooseWord")}
                  </option>
                  {task.options.map((word, j) => (
                    <option key={word} value={j}>
                      {word}
                    </option>
                  ))}
                </select>
                {revealed ? (
                  <Icon
                    name={right ? "check" : "cross"}
                    className={right ? "text-success" : "text-danger"}
                  />
                ) : null}
              </div>
              {revealed ? (
                <div
                  role="status"
                  className="rounded-control bg-surface p-3 text-sm"
                >
                  <p
                    className={
                      right
                        ? "font-semibold text-success"
                        : "font-semibold text-danger"
                    }
                  >
                    {right
                      ? t("correct")
                      : t("correctAnswer", {
                          answer: task.options[item.answer] ?? "",
                        })}
                  </p>
                  <div className="mt-1">
                    <Explanation text={item.explanation} locale={locale} />
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap gap-3">
        {mode === "study" ? (
          checked ? (
            <Button ref={nextRef} variant="primary" onClick={advance}>
              {last ? t("finish") : t("next")}
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() =>
                dispatch({
                  type: "reveal",
                  keys: task.items.map((item) => item.key),
                })
              }
            >
              {t("check")}
            </Button>
          )
        ) : (
          <>
            <Button
              onClick={() => dispatch({ type: "prev" })}
              disabled={state.index === 0}
            >
              {t("previous")}
            </Button>
            <Button variant={last ? "primary" : "secondary"} onClick={advance}>
              {last ? t("finish") : t("next")}
            </Button>
          </>
        )}
      </div>
    </section>
  );
}

function MistakeList({
  tasks,
  results,
}: {
  tasks: VocabularyTask[];
  results: ItemResult[];
}) {
  const t = useTranslations("Trainer");
  const locale = useLocale();
  return (
    <ul className="mt-3 divide-y divide-hairline border-y border-hairline">
      {results.map((result) => {
        const task = tasks.find((candidate) =>
          candidate.items.some((item) => item.key === result.key),
        )!;
        const item = task.items.find(
          (candidate) => candidate.key === result.key,
        )!;
        return (
          <li key={result.key} className="space-y-1 py-4">
            <p lang="en" className="prose-reading text-lg">
              {item.prompt.replace(/_{3,}/, task.options[item.answer] ?? "___")}
            </p>
            <p className="text-sm font-semibold text-success">
              {t("correctAnswer", { answer: task.options[item.answer] ?? "" })}
            </p>
            <p className="text-sm text-danger">
              {result.chosen === undefined
                ? t("notAnswered")
                : t("yourAnswer", {
                    answer: task.options[result.chosen] ?? "",
                  })}
            </p>
            <Explanation text={item.explanation} locale={locale} />
          </li>
        );
      })}
    </ul>
  );
}
