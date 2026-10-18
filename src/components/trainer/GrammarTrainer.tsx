"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Explanation } from "@/components/content/Explanation";
import { GapSentence } from "@/components/content/GapSentence";
import { Button } from "@/components/ui/Button";
import { CEFR_LEVELS, type CefrLevel } from "@/lib/content/schemas/common";
import type { CoreGrammarExercise } from "@/lib/content/schemas/core";
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
  buildGrammarSession,
  type ChoiceQuestion,
} from "@/lib/trainer/session";
import { OptionButton, optionState } from "./OptionButton";
import { Perforations } from "./Perforations";
import { ResultsView } from "./ResultsView";
import { SessionHeader } from "./SessionHeader";
import { TrainerSetup } from "./TrainerSetup";
import { useCountdown } from "./useCountdown";

type GrammarTrainerProps = {
  exercises: CoreGrammarExercise[];
  /** Lesson titles by slug, in the interface language. */
  lessonTitles: Record<string, string>;
};

type Session = {
  id: number;
  mode: TrainerMode;
  questions: ChoiceQuestion[];
  startedAt: number;
  deadline: number | null;
};

type Outcome = {
  correct: number;
  total: number;
  results: ItemResult[];
  timeUp: boolean;
};

export function GrammarTrainer({
  exercises,
  lessonTitles,
}: GrammarTrainerProps) {
  const point = useSearchParams().get("point");
  const progress = useProgress();
  const [focus, setFocus] = useState<string | null>(
    point && lessonTitles[point] ? point : null,
  );
  const [mode, setMode] = useState<TrainerMode>("study");
  const [level, setLevel] = useState<CefrLevel | "all">("all");
  const [session, setSession] = useState<Session | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const levels = useMemo(
    () => CEFR_LEVELS.filter((l) => exercises.some((q) => q.cefrLevel === l)),
    [exercises],
  );
  const filters = {
    levels: !focus && level !== "all" ? [level] : undefined,
    grammarPoint: focus ?? undefined,
  };
  const poolSize = exercises.filter(
    (q) =>
      (!filters.levels || filters.levels.includes(q.cefrLevel)) &&
      (!filters.grammarPoint || q.grammarPoint === filters.grammarPoint),
  ).length;
  const mistakes = mistakeKeys(progress, "core-grammar").filter((key) =>
    exercises.some((q) => q.id === key),
  );

  function start(onlyKeys?: string[]) {
    const startedAt = Date.now();
    const exam = mode === "exam";
    const questions = buildGrammarSession({
      exercises,
      count: exam ? CORE_PART_EXAM.grammar.count : STUDY_SESSION_SIZE,
      rng: createRng(randomSeed()),
      ...(onlyKeys ? { onlyKeys } : filters),
    });
    if (questions.length === 0) return;
    setOutcome(null);
    setSession({
      id: startedAt,
      mode,
      questions,
      startedAt,
      deadline: exam ? startedAt + CORE_PART_EXAM.grammar.seconds * 1000 : null,
    });
  }

  function finish(
    current: Session,
    answers: Answers,
    timeUp: boolean,
    finishedAt: number,
  ) {
    const scored = scoreItems(current.questions, answers);
    saveProgress(
      recordSession(readProgress(), {
        part: "core-grammar",
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
        <MistakeList questions={session.questions} results={wrong} />
      </ResultsView>
    );
  }

  if (session) {
    return (
      <GrammarSession
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
      examCount={CORE_PART_EXAM.grammar.count}
      examMinutes={CORE_PART_EXAM.grammar.seconds / 60}
      poolSize={poolSize}
      focusName={focus ? lessonTitles[focus] : undefined}
      onClearFocus={() => setFocus(null)}
      mistakes={mistakes.length}
      onStart={() => start()}
      onReviewMistakes={() => start(mistakes)}
    />
  );
}

type GrammarSessionProps = {
  session: Session;
  onFinish: (answers: Answers, timeUp: boolean, finishedAt: number) => void;
};

function GrammarSession({ session, onFinish }: GrammarSessionProps) {
  const t = useTranslations("Trainer");
  const tLesson = useTranslations("Lesson");
  const locale = useLocale();
  const { questions, mode } = session;
  const [state, dispatch] = useReducer(
    trainerReducer,
    { mode, steps: questions.length, startedAt: session.startedAt },
    initialTrainerState,
  );
  const question = questions[state.index]!;
  const chosen = state.answers[question.key];
  const revealed = Boolean(state.revealed[question.key]);
  const last = state.index === questions.length - 1;

  const finish = (timeUp = false) => {
    const at = Date.now();
    dispatch({ type: "finish", at });
    onFinish(state.answers, timeUp, at);
  };
  const remaining = useCountdown(
    session.deadline,
    CORE_PART_EXAM.grammar.seconds * 1000,
    () => finish(true),
  );

  const select = (choice: number) => {
    if (revealed) return;
    dispatch({ type: "answer", key: question.key, choice });
    if (mode === "study") dispatch({ type: "reveal", keys: [question.key] });
  };
  const advance = () => (last ? finish() : dispatch({ type: "next" }));

  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    keyHandler.current = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName) ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      )
        return;
      const number = Number(event.key);
      if (number >= 1 && number <= question.options.length) {
        event.preventDefault();
        select(number - 1);
      }
    };
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => keyHandler.current(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  const holes = questions.map((q, i) => {
    if (i === state.index) return "current" as const;
    if (state.revealed[q.key])
      return state.answers[q.key] === q.answer
        ? ("right" as const)
        : ("wrong" as const);
    return state.answers[q.key] !== undefined
      ? ("answered" as const)
      : ("open" as const);
  });

  return (
    <section
      aria-label={t("question", {
        current: state.index + 1,
        total: questions.length,
      })}
      className="max-w-[68ch] space-y-8"
    >
      <SessionHeader
        counter={t("question", {
          current: state.index + 1,
          total: questions.length,
        })}
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
        {question.register === "spoken" ? (
          <p className="mb-2 text-sm font-semibold text-ink-soft">
            {t("spoken")}
          </p>
        ) : null}
        <p lang="en" className="prose-reading text-xl sm:text-2xl">
          <GapSentence
            text={question.prompt}
            fill={
              chosen !== undefined && revealed
                ? question.options[chosen]
                : undefined
            }
            tone={
              revealed
                ? chosen === question.answer
                  ? "entry"
                  : "refusal"
                : "neutral"
            }
            gapLabel={tLesson("gap")}
          />
        </p>
      </div>

      <div className="grid gap-2" lang="en">
        {question.options.map((option, i) => {
          const state = optionState(i, {
            chosen,
            answer: question.answer,
            revealed,
          });
          return (
            <OptionButton
              key={option}
              index={i}
              label={option}
              state={state}
              disabled={revealed}
              onSelect={() => select(i)}
              stateLabel={
                state === "correct"
                  ? t("correct")
                  : state === "wrong"
                    ? t("incorrect")
                    : undefined
              }
            />
          );
        })}
        <p className="text-sm text-ink-soft">{t("keyboard")}</p>
      </div>

      <div role="status">
        {revealed ? (
          <div className="space-y-4 rounded-page bg-sheet p-5">
            <p
              className={
                chosen === question.answer
                  ? "font-semibold text-entry"
                  : "font-semibold text-refusal"
              }
            >
              {chosen === question.answer
                ? t("correct")
                : t("correctAnswer", {
                    answer: question.options[question.answer] ?? "",
                  })}
            </p>
            <Explanation text={question.explanation} locale={locale} />
            <details>
              <summary className="cursor-pointer font-semibold">
                {t("whyOptions")}
              </summary>
              <ul className="mt-2 space-y-2">
                {question.options.map((option, i) => (
                  <li key={option}>
                    <span lang="en" className="font-semibold">
                      {option}
                    </span>
                    : {question.optionNotes[i]?.en}
                  </li>
                ))}
              </ul>
            </details>
            <Button variant="primary" autoFocus onClick={advance}>
              {last ? t("finish") : t("next")}
            </Button>
          </div>
        ) : null}
      </div>

      {mode === "exam" ? (
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => dispatch({ type: "prev" })}
            disabled={state.index === 0}
          >
            {t("previous")}
          </Button>
          <Button variant={last ? "primary" : "secondary"} onClick={advance}>
            {last ? t("finish") : t("next")}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function MistakeList({
  questions,
  results,
}: {
  questions: ChoiceQuestion[];
  results: ItemResult[];
}) {
  const t = useTranslations("Trainer");
  const tLesson = useTranslations("Lesson");
  const locale = useLocale();
  return (
    <ul className="mt-3 divide-y divide-hairline border-y border-hairline">
      {results.map((result) => {
        const question = questions.find((q) => q.key === result.key)!;
        return (
          <li key={result.key} className="space-y-2 py-4">
            <p lang="en" className="prose-reading text-lg">
              <GapSentence
                text={question.prompt}
                fill={question.options[question.answer]}
                tone="entry"
                gapLabel={tLesson("gap")}
              />
            </p>
            <p className="text-sm text-refusal">
              {result.chosen === undefined
                ? t("notAnswered")
                : t("yourAnswer", {
                    answer: question.options[result.chosen] ?? "",
                  })}
            </p>
            <Explanation text={question.explanation} locale={locale} />
          </li>
        );
      })}
    </ul>
  );
}
