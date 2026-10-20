"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Explanation } from "@/components/content/Explanation";
import { QuestionProgress } from "@/components/trainer/QuestionProgress";
import { ResultsView } from "@/components/trainer/ResultsView";
import { SessionHeader } from "@/components/trainer/SessionHeader";
import { TrainerSetup } from "@/components/trainer/TrainerSetup";
import { useCountdown } from "@/components/trainer/useCountdown";
import { Button } from "@/components/ui/Button";
import { CEFR_LEVELS, type CefrLevel } from "@/lib/content/levels";
import { mistakeKeys, recordSession } from "@/lib/progress/progress";
import {
  readProgress,
  saveProgress,
  useProgress,
} from "@/lib/progress/useProgress";
import { READING_PART_EXAM } from "@/lib/trainer/config";
import { createRng, randomSeed } from "@/lib/trainer/random";
import {
  buildReadingSession,
  initialOrder,
  moveItem,
  readingItems,
  readingKey,
  type ReadingExercise,
  type ReadingPart,
} from "@/lib/trainer/reading";
import {
  initialTrainerState,
  trainerReducer,
  type TrainerMode,
} from "@/lib/trainer/reducer";
import { scoreItems, type Answers, type ItemResult } from "@/lib/trainer/score";
import { Reading1Task } from "./Reading1Task";
import { Reading2Task } from "./Reading2Task";
import { Reading3Task } from "./Reading3Task";
import { Reading4Task } from "./Reading4Task";

/** A session as the trainer starts it; the placement test and mock exam build their own. */
export type ReadingSessionData = {
  id: number;
  mode: TrainerMode;
  tasks: ReadingExercise[];
  /** Part 2 only: the starting order of each task's sentences. */
  orders: Record<string, number[]>;
  startedAt: number;
  deadline: number | null;
};
type Session = ReadingSessionData;

type Outcome = {
  correct: number;
  total: number;
  results: ItemResult[];
  timeUp: boolean;
};

// Only called from event handlers; the purity lint misreads `start` as render code here.
const now = () => Date.now();

const itemsOf = (tasks: readonly ReadingExercise[]) =>
  tasks.flatMap(readingItems);

/** Part 2 answers come from the current order: position p holds sentence order[p]. */
const orderAnswers = (orders: Record<string, number[]>): Answers =>
  Object.fromEntries(
    Object.entries(orders).flatMap(([id, order]) =>
      order.slice(1).map((sentence, i) => [readingKey(id, i + 1), sentence]),
    ),
  );

export function ReadingTrainer({
  part,
  tasks,
}: {
  part: ReadingPart;
  tasks: ReadingExercise[];
}) {
  const t = useTranslations("Reading.trainer");
  const progress = useProgress();
  const [mode, setMode] = useState<TrainerMode>("study");
  const [level, setLevel] = useState<CefrLevel | "all">("all");
  const [session, setSession] = useState<Session | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const exam = READING_PART_EXAM[part];

  const levels = useMemo(
    () => CEFR_LEVELS.filter((l) => tasks.some((t) => t.cefrLevel === l)),
    [tasks],
  );
  const levelFilter = level === "all" ? undefined : [level];
  const poolSize = tasks.filter(
    (task) => !levelFilter || levelFilter.includes(task.cefrLevel),
  ).length;
  const knownKeys = new Set(itemsOf(tasks).map((item) => item.key));
  const mistakes = mistakeKeys(progress, part).filter((key) =>
    knownKeys.has(key),
  );

  function start(onlyKeys?: string[]) {
    const startedAt = now();
    const rng = createRng(randomSeed());
    const sessionTasks = buildReadingSession({
      tasks,
      part,
      mode,
      rng,
      ...(onlyKeys ? { onlyKeys } : { levels: levelFilter }),
    });
    if (sessionTasks.length === 0) return;
    setOutcome(null);
    setSession({
      id: startedAt,
      mode,
      tasks: sessionTasks,
      orders: Object.fromEntries(
        sessionTasks.flatMap((task) =>
          task.examPart === "reading-2"
            ? [[task.id, initialOrder(task, rng)]]
            : [],
        ),
      ),
      startedAt,
      deadline: mode === "exam" ? startedAt + exam.seconds * 1000 : null,
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
        part,
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
        note={t("scoreNote")}
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
      <ReadingSession
        key={session.id}
        part={part}
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
      examCount={exam.tasks}
      examMinutes={exam.seconds / 60}
      examHint={t("examHint", {
        count: exam.tasks,
        minutes: exam.seconds / 60,
      })}
      bankText={t("bankSize", { count: poolSize })}
      poolSize={poolSize}
      mistakes={mistakes.length}
      onStart={() => start()}
      onReviewMistakes={() => start(mistakes)}
    />
  );
}

type ReadingSessionProps = {
  part: ReadingPart;
  session: Session;
  onFinish: (answers: Answers, timeUp: boolean, finishedAt: number) => void;
};

export function ReadingSession({
  part,
  session,
  onFinish,
}: ReadingSessionProps) {
  const t = useTranslations("Trainer");
  const tReading = useTranslations("Reading.trainer");
  const { tasks, mode } = session;
  const [state, dispatch] = useReducer(
    trainerReducer,
    { mode, steps: tasks.length, startedAt: session.startedAt },
    initialTrainerState,
  );
  const [orders, setOrders] = useState(session.orders);
  const task = tasks[state.index]!;
  const items = readingItems(task);
  const currentKeys = new Set(items.map((item) => item.key));
  const last = state.index === tasks.length - 1;
  const checked = items.every((item) => state.revealed[item.key]);
  const answers = { ...state.answers, ...orderAnswers(orders) };
  const headingRef = useRef<HTMLHeadingElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const exam = READING_PART_EXAM[part];

  // Each new task starts reading from its instructions; once checked, focus goes to Next.
  useEffect(() => {
    if (state.index > 0) headingRef.current?.focus();
  }, [state.index]);
  useEffect(() => {
    if (checked) nextRef.current?.focus();
  }, [checked]);

  const finish = (timeUp = false) => {
    const at = Date.now();
    dispatch({ type: "finish", at });
    onFinish(answers, timeUp, at);
  };
  const remaining = useCountdown(session.deadline, exam.seconds * 1000, () =>
    finish(true),
  );
  const advance = () => (last ? finish() : dispatch({ type: "next" }));

  const holes = itemsOf(tasks).map((item) => {
    if (currentKeys.has(item.key)) return "current" as const;
    if (state.revealed[item.key])
      return answers[item.key] === item.answer
        ? ("right" as const)
        : ("wrong" as const);
    return answers[item.key] !== undefined
      ? ("answered" as const)
      : ("open" as const);
  });
  const onAnswer = (key: string, choice: number) =>
    dispatch({ type: "answer", key, choice });
  const taskProps = { answers, revealed: state.revealed, onAnswer };

  return (
    <section
      aria-label={t("task", { current: state.index + 1, total: tasks.length })}
      className={
        part === "reading-3" ? "max-w-6xl space-y-8" : "max-w-[68ch] space-y-8"
      }
    >
      <SessionHeader
        counter={t("task", { current: state.index + 1, total: tasks.length })}
        remaining={session.deadline ? remaining : undefined}
        progress={<QuestionProgress states={holes} />}
        actions={
          mode === "exam" ? (
            <Button variant="ghost" onClick={() => finish()}>
              {t("finish")}
            </Button>
          ) : null
        }
      />

      {mode === "exam" && tasks.length < exam.tasks ? (
        <p role="status" className="rounded-control bg-surface px-4 py-3">
          {tReading("shortBank", { count: tasks.length, total: exam.tasks })}
        </p>
      ) : null}

      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-lg font-bold focus:outline-none"
      >
        {tReading(`instructions.${part}`)}
      </h2>

      {task.examPart === "reading-1" ? (
        <Reading1Task task={task} {...taskProps} />
      ) : task.examPart === "reading-2" ? (
        <Reading2Task
          task={task}
          order={orders[task.id]!}
          onMove={(from, to) =>
            setOrders((current) => ({
              ...current,
              [task.id]: moveItem(current[task.id]!, from, to),
            }))
          }
          revealed={checked}
        />
      ) : task.examPart === "reading-3" ? (
        <Reading3Task task={task} {...taskProps} />
      ) : (
        <Reading4Task task={task} {...taskProps} />
      )}

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
                  keys: items.map((item) => item.key),
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

/** What a wrong item asked, its right answer and the learner's, in plain text. */
function describe(task: ReadingExercise, index: number) {
  switch (task.examPart) {
    case "reading-1": {
      const item = task.items[index]!;
      return {
        prompt: item.prompt.replace(
          /_{3,}/,
          item.options[item.answer] ?? "___",
        ),
        answerOf: (choice: number) => item.options[choice] ?? "",
        answer: item.answer,
        explanation: item.explanation,
      };
    }
    case "reading-2":
      return {
        prompt: task.sentences[index]!,
        answerOf: (choice: number) => task.sentences[choice] ?? "",
        answer: index,
        explanation: task.explanation,
      };
    case "reading-3": {
      const statement = task.statements[index]!;
      return {
        prompt: statement.text,
        answerOf: (choice: number) => task.people[choice]?.name ?? "",
        answer: statement.answer,
        explanation: statement.explanation,
      };
    }
    case "reading-4":
      return {
        prompt: task.paragraphs[index]!,
        answerOf: (choice: number) => task.headings[choice] ?? "",
        answer: task.answers[index]!,
        explanation: task.explanations[index]!,
      };
  }
}

function MistakeList({
  tasks,
  results,
}: {
  tasks: ReadingExercise[];
  results: ItemResult[];
}) {
  const t = useTranslations("Trainer");
  const tReading = useTranslations("Reading.trainer");
  const locale = useLocale();
  // Part 2 has one explanation per text: show it under the first wrong position only.
  const explained = new Set<string>();
  return (
    <ul className="mt-3 divide-y divide-hairline border-y border-hairline">
      {results.map((result) => {
        const [id, index] = result.key.split("#") as [string, string];
        const task = tasks.find((candidate) => candidate.id === id)!;
        const position = Number(index);
        const item = describe(task, position);
        const showExplanation = !(
          task.examPart === "reading-2" && explained.has(id)
        );
        explained.add(id);
        return (
          <li key={result.key} className="space-y-1 py-4">
            {task.examPart === "reading-2" ? (
              <p className="text-sm font-semibold text-ink-soft">
                {tReading("position", { number: position + 1 })}
              </p>
            ) : task.examPart === "reading-4" ? (
              <p className="text-sm font-semibold text-ink-soft">
                {tReading("paragraph", { number: position + 1 })}
              </p>
            ) : null}
            <p
              lang="en"
              className={
                task.examPart === "reading-4"
                  ? "prose-reading line-clamp-3"
                  : "prose-reading text-lg"
              }
            >
              {item.prompt}
            </p>
            <p className="text-sm font-semibold text-success">
              {t("correctAnswer", { answer: item.answerOf(item.answer) })}
            </p>
            <p className="text-sm text-danger">
              {result.chosen === undefined
                ? t("notAnswered")
                : t("yourAnswer", { answer: item.answerOf(result.chosen) })}
            </p>
            {showExplanation ? (
              <Explanation text={item.explanation} locale={locale} />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
