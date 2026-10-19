"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Explanation } from "@/components/content/Explanation";
import { QuestionProgress } from "@/components/trainer/QuestionProgress";
import { ResultsView } from "@/components/trainer/ResultsView";
import { SessionHeader } from "@/components/trainer/SessionHeader";
import { TrainerSetup } from "@/components/trainer/TrainerSetup";
import { Button } from "@/components/ui/Button";
import { useSpeech } from "@/lib/audio/useSpeech";
import { CEFR_LEVELS, type CefrLevel } from "@/lib/content/schemas/common";
import { mistakeKeys, recordSession } from "@/lib/progress/progress";
import {
  readProgress,
  saveProgress,
  useProgress,
} from "@/lib/progress/useProgress";
import { LISTENING_PART_EXAM } from "@/lib/trainer/config";
import {
  buildListeningSession,
  listeningItems,
  recordings,
  SPEAKER_CHOICES,
  type ListeningExercise,
  type ListeningPart,
} from "@/lib/trainer/listening";
import { createRng, randomSeed } from "@/lib/trainer/random";
import {
  initialTrainerState,
  trainerReducer,
  type TrainerMode,
} from "@/lib/trainer/reducer";
import { scoreItems, type Answers, type ItemResult } from "@/lib/trainer/score";
import type { AudioControl } from "./AudioPlayer";
import { Listening1Task } from "./Listening1Task";
import { Listening2Task } from "./Listening2Task";
import { Listening3Task } from "./Listening3Task";
import { Listening4Task } from "./Listening4Task";
import { Transcript } from "./Transcript";

/** A session as the trainer starts it; the placement test and mock exam build their own. */
export type ListeningSessionData = {
  id: number;
  mode: TrainerMode;
  tasks: ListeningExercise[];
  startedAt: number;
};
type Session = ListeningSessionData;

type Outcome = { correct: number; total: number; results: ItemResult[] };

// Only called from event handlers; the purity lint misreads `start` as render code here.
const now = () => Date.now();

const itemsOf = (tasks: readonly ListeningExercise[]) =>
  tasks.flatMap(listeningItems);

export function ListeningTrainer({
  part,
  tasks,
}: {
  part: ListeningPart;
  tasks: ListeningExercise[];
}) {
  const t = useTranslations("Listening.trainer");
  const progress = useProgress();
  const [mode, setMode] = useState<TrainerMode>("study");
  const [level, setLevel] = useState<CefrLevel | "all">("all");
  const [session, setSession] = useState<Session | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const exam = LISTENING_PART_EXAM[part];

  const levels = useMemo(
    () => CEFR_LEVELS.filter((l) => tasks.some((task) => task.cefrLevel === l)),
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
    const sessionTasks = buildListeningSession({
      tasks,
      part,
      mode,
      rng: createRng(randomSeed()),
      ...(onlyKeys ? { onlyKeys } : { levels: levelFilter }),
    });
    if (sessionTasks.length === 0) return;
    setOutcome(null);
    setSession({ id: startedAt, mode, tasks: sessionTasks, startedAt });
  }

  function finish(current: Session, answers: Answers, finishedAt: number) {
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
    setOutcome(scored);
  }

  if (session && outcome) {
    const wrong = outcome.results.filter((r) => !r.correct);
    return (
      <ResultsView
        correct={outcome.correct}
        total={outcome.total}
        timeUp={false}
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
      <ListeningSession
        key={session.id}
        part={part}
        session={session}
        onFinish={(answers, at) => finish(session, answers, at)}
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
      examMinutes={0}
      examHint={t("examHint", { count: exam.tasks })}
      bankText={t("bankSize", { count: poolSize })}
      poolSize={poolSize}
      mistakes={mistakes.length}
      onStart={() => start()}
      onReviewMistakes={() => start(mistakes)}
    />
  );
}

type ListeningSessionProps = {
  part: ListeningPart;
  session: Session;
  onFinish: (answers: Answers, finishedAt: number) => void;
};

export function ListeningSession({
  part,
  session,
  onFinish,
}: ListeningSessionProps) {
  const t = useTranslations("Trainer");
  const tListening = useTranslations("Listening.trainer");
  const { tasks, mode } = session;
  const [state, dispatch] = useReducer(
    trainerReducer,
    { mode, steps: tasks.length, startedAt: session.startedAt },
    initialTrainerState,
  );
  const speech = useSpeech();
  const [plays, setPlays] = useState<Record<string, number>>({});
  const task = tasks[state.index]!;
  const items = listeningItems(task);
  const currentKeys = new Set(items.map((item) => item.key));
  const last = state.index === tasks.length - 1;
  const checked = items.every((item) => state.revealed[item.key]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const expected = LISTENING_PART_EXAM[part].tasks;

  // Each new task starts reading from its instructions; once checked, focus goes to Next.
  useEffect(() => {
    if (state.index > 0) headingRef.current?.focus();
  }, [state.index]);
  useEffect(() => {
    if (checked) nextRef.current?.focus();
  }, [checked]);
  // A recording must not keep playing under the next task.
  const { stop } = speech;
  useEffect(() => stop, [state.index, stop]);

  const finish = () => {
    const at = Date.now();
    stop();
    dispatch({ type: "finish", at });
    onFinish(state.answers, at);
  };
  const advance = () => (last ? finish() : dispatch({ type: "next" }));

  const holes = itemsOf(tasks).map((item) => {
    if (currentKeys.has(item.key)) return "current" as const;
    if (state.revealed[item.key])
      return state.answers[item.key] === item.answer
        ? ("right" as const)
        : ("wrong" as const);
    return state.answers[item.key] !== undefined
      ? ("answered" as const)
      : ("open" as const);
  });

  const audio: AudioControl = {
    speech,
    mode,
    plays,
    onPlay: (id) =>
      setPlays((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 })),
  };
  const taskProps = {
    answers: state.answers,
    revealed: state.revealed,
    onAnswer: (key: string, choice: number) =>
      dispatch({ type: "answer", key, choice }),
    audio,
    // Without speech the transcript is the only way to do the task.
    showScript: !speech.supported,
  };

  return (
    <section
      aria-label={t("task", { current: state.index + 1, total: tasks.length })}
      className="max-w-[68ch] space-y-8"
    >
      <SessionHeader
        counter={t("task", { current: state.index + 1, total: tasks.length })}
        progress={<QuestionProgress states={holes} />}
        actions={
          mode === "exam" ? (
            <Button variant="ghost" onClick={finish}>
              {t("finish")}
            </Button>
          ) : null
        }
      />

      {mode === "exam" && tasks.length < expected ? (
        <p role="status" className="rounded-control bg-surface px-4 py-3">
          {tListening("shortBank", { count: tasks.length, total: expected })}
        </p>
      ) : null}

      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-lg font-bold focus:outline-none"
      >
        {tListening(`instructions.${part}`)}
      </h2>
      <p className="text-sm text-ink-soft">{tListening("voiceNote")}</p>

      {task.examPart === "listening-1" ? (
        <Listening1Task task={task} {...taskProps} />
      ) : task.examPart === "listening-2" ? (
        <Listening2Task task={task} {...taskProps} />
      ) : task.examPart === "listening-3" ? (
        <Listening3Task task={task} {...taskProps} />
      ) : (
        <Listening4Task task={task} {...taskProps} />
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
function describe(
  task: ListeningExercise,
  index: number,
  choiceLabel: (choice: (typeof SPEAKER_CHOICES)[number]) => string,
) {
  switch (task.examPart) {
    case "listening-1":
      return {
        prompt: task.question,
        answerOf: (choice: number) => task.options[choice] ?? "",
        answer: task.answer,
        explanation: task.explanation,
      };
    case "listening-2": {
      const speaker = task.speakers[index]!;
      return {
        prompt: speaker.script.map((line) => line.text).join(" "),
        answerOf: (choice: number) => task.options[choice] ?? "",
        answer: speaker.answer,
        explanation: task.explanation,
      };
    }
    case "listening-3": {
      const statement = task.statements[index]!;
      return {
        prompt: statement.text,
        answerOf: (choice: number) => {
          const key = SPEAKER_CHOICES[choice];
          return key ? choiceLabel(key) : "";
        },
        answer: SPEAKER_CHOICES.indexOf(statement.answer),
        explanation: statement.explanation,
      };
    }
    case "listening-4": {
      const question = task.questions[index]!;
      return {
        prompt: question.prompt,
        answerOf: (choice: number) => question.options[choice] ?? "",
        answer: question.answer,
        explanation: question.explanation,
      };
    }
  }
}

function MistakeList({
  tasks,
  results,
}: {
  tasks: ListeningExercise[];
  results: ItemResult[];
}) {
  const t = useTranslations("Trainer");
  const tListening = useTranslations("Listening.trainer");
  const locale = useLocale();
  // Part 2 has one explanation per task, and every task has one script: show each once.
  const explained = new Set<string>();
  const transcribed = new Set<string>();
  return (
    <ul className="mt-3 divide-y divide-hairline border-y border-hairline">
      {results.map((result) => {
        const [id, index] = result.key.split("#") as [string, string];
        const task = tasks.find((candidate) => candidate.id === id)!;
        const item = describe(task, Number(index), (choice) =>
          tListening(`choices.${choice}`),
        );
        const showExplanation = !(
          task.examPart === "listening-2" && explained.has(id)
        );
        explained.add(id);
        const showTranscript = !transcribed.has(id);
        transcribed.add(id);
        return (
          <li key={result.key} className="space-y-1 py-4">
            <p lang="en" className="prose-reading text-lg">
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
            {showTranscript
              ? recordings(task).map((recording) => (
                  <Transcript
                    key={recording.id}
                    script={recording.script}
                    cues={
                      task.examPart === "listening-4"
                        ? task.questions.flatMap((q) => q.cues)
                        : []
                    }
                  />
                ))
              : null}
          </li>
        );
      })}
    </ul>
  );
}
