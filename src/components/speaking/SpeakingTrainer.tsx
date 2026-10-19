"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Checklist } from "@/components/trainer/Checklist";
import { TrainerSetup } from "@/components/trainer/TrainerSetup";
import { Button } from "@/components/ui/Button";
import { PhrasePanel } from "@/components/writing/PhrasePanel";
import { useSpeech } from "@/lib/audio/useSpeech";
import { CEFR_LEVELS, type CefrLevel } from "@/lib/content/schemas/common";
import type { FunctionalPhrase } from "@/lib/content/schemas/lessons";
import { countWords } from "@/lib/content/text";
import { recordAttempt } from "@/lib/progress/progress";
import { readProgress, saveProgress } from "@/lib/progress/useProgress";
import { useRecorder } from "@/lib/speaking/useRecorder";
import { SPEAKING_PART_EXAM } from "@/lib/trainer/config";
import { createRng, randomSeed } from "@/lib/trainer/random";
import type { TrainerMode } from "@/lib/trainer/reducer";
import {
  SPEAKING_RUBRIC,
  buildSpeakingSession,
  initialSpeakingState,
  speakingReducer,
  speakingTurns,
  type SpeakingExercise,
  type SpeakingPart,
} from "@/lib/trainer/speaking";
import { AnswerTimer } from "./AnswerTimer";
import { RecordingPlayer } from "./RecordingPlayer";
import { SceneImage } from "./SceneImage";
import { SpeakingModels } from "./SpeakingModels";

/** app decision: reading time before the clock starts when there is no synthetic voice. */
const SILENT_READING_MS = 5000;

type Session = { id: number; mode: TrainerMode; task: SpeakingExercise };

// Only called from event handlers and effects; the purity lint misreads them as render code.
const now = () => Date.now();

export function SpeakingTrainer({
  part,
  tasks,
  phrases,
}: {
  part: SpeakingPart;
  tasks: SpeakingExercise[];
  phrases: FunctionalPhrase[];
}) {
  const t = useTranslations("Speaking.trainer");
  const [mode, setMode] = useState<TrainerMode>("study");
  const [level, setLevel] = useState<CefrLevel | "all">("all");
  const [session, setSession] = useState<Session | null>(null);
  const { prepSeconds, answerSeconds, turns } = SPEAKING_PART_EXAM[part];

  const levels = useMemo(
    () => CEFR_LEVELS.filter((l) => tasks.some((t) => t.cefrLevel === l)),
    [tasks],
  );
  const levelFilter = level === "all" ? undefined : [level];
  const poolSize = tasks.filter(
    (task) => !levelFilter || levelFilter.includes(task.cefrLevel),
  ).length;

  function start() {
    const [task] = buildSpeakingSession({
      tasks,
      part,
      rng: createRng(randomSeed()),
      levels: levelFilter,
    });
    if (task) setSession({ id: now(), mode, task });
  }

  if (session)
    return (
      <SpeakingSession
        key={session.id}
        part={part}
        session={session}
        phrases={phrases}
        onNewSession={start}
        onChangeSettings={() => setSession(null)}
      />
    );

  return (
    <TrainerSetup
      mode={mode}
      onModeChange={setMode}
      level={level}
      onLevelChange={setLevel}
      levels={levels}
      examCount={1}
      examMinutes={((prepSeconds + answerSeconds * turns) / 60) | 0}
      studyHint={t("studyHint")}
      examHint={t("examHint")}
      bankText={t("bankSize", { count: poolSize })}
      poolSize={poolSize}
      mistakes={0}
      onStart={start}
      onReviewMistakes={() => {}}
    />
  );
}

type SpeakingSessionProps = {
  part: SpeakingPart;
  session: Session;
  phrases: FunctionalPhrase[];
  onNewSession: () => void;
  onChangeSettings: () => void;
};

function SpeakingSession({
  part,
  session,
  phrases,
  onNewSession,
  onChangeSettings,
}: SpeakingSessionProps) {
  const t = useTranslations("Speaking.trainer");
  const tSpeaking = useTranslations("Speaking");
  const tTrainer = useTranslations("Trainer");
  const locale = useLocale();
  const { task, mode } = session;
  const turns = useMemo(() => speakingTurns(task), [task]);
  const [state, dispatch] = useReducer(
    speakingReducer,
    initialSpeakingState(part, mode, turns.length),
  );
  const [clock, setClock] = useState(0);
  const [saved, setSaved] = useState<{ correct: number; total: number }>();
  const speech = useSpeech();
  const { status: micStatus, recordings, recorder } = useRecorder();
  const speechRef = useRef(speech);
  const startedAt = useRef(session.id);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const turn = turns[Math.min(state.turn, turns.length - 1)]!;
  const finished = state.phase === "finished";

  useEffect(() => {
    speechRef.current = speech;
  });

  // Exam mode reads the question aloud (or leaves silent reading time); study waits for the learner.
  useEffect(() => {
    if (state.phase !== "reading") return;
    if (mode === "study") {
      dispatch({ type: "read-end", at: now() });
      return;
    }
    const voice = speechRef.current;
    const text = turn.questions.map((q) => q.prompt).join(" ");
    const readEnd = () => dispatch({ type: "read-end", at: now() });
    // Without a voice, silent reading time; with one, a cap in case the voice never reports its end.
    const id = window.setTimeout(
      readEnd,
      voice.supported
        ? SILENT_READING_MS + (countWords(text) / 2) * 1000
        : SILENT_READING_MS,
    );
    if (voice.supported)
      voice.play(turn.key, [{ speaker: "woman", text }], readEnd);
    return () => {
      window.clearTimeout(id);
      voice.stop();
    };
  }, [state.phase, state.turn, mode, turn]);

  // Ask for the microphone as the session starts, not halfway through the first answer.
  useEffect(() => recorder.prepare(), [recorder]);

  // The microphone records exactly while the answer time runs.
  useEffect(() => {
    if (state.phase !== "answering") return;
    void recorder.start(turn.key);
    return () => recorder.stop();
  }, [state.phase, turn.key, recorder]);

  // One clock drives the countdown and moves the phases on.
  useEffect(() => {
    if (state.endsAt === null) return;
    const tick = () => {
      const at = now();
      setClock(at);
      dispatch({ type: "tick", at });
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [state.endsAt]);

  // The exam moves straight on to the next question.
  useEffect(() => {
    if (mode === "exam" && state.phase === "done") dispatch({ type: "next" });
  }, [mode, state.phase]);

  useEffect(() => {
    if (finished) headingRef.current?.focus();
  }, [finished]);

  const save = (correct: number, total: number) => {
    saveProgress(
      recordAttempt(readProgress(), {
        part,
        mode,
        startedAt: startedAt.current,
        finishedAt: now(),
        correct,
        total,
      }),
    );
    setSaved({ correct, total });
  };

  const images =
    task.examPart === "speaking-2" || task.examPart === "speaking-4"
      ? [task.image]
      : task.examPart === "speaking-3"
        ? task.images
        : [];
  const totalMs =
    (state.phase === "preparing" ? state.prepSeconds : state.answerSeconds) *
    1000;
  const remainingMs = state.endsAt === null ? 0 : state.endsAt - clock;

  const micNotice =
    micStatus === "denied"
      ? t("micDenied")
      : micStatus === "unavailable"
        ? t("micUnavailable")
        : micStatus === "requesting"
          ? t("micRequesting")
          : null;

  const questionList = (questions: typeof turn.questions, offset: number) => (
    <ol className="space-y-2">
      {questions.map((question, i) => (
        <li key={i} lang="en" className="prose-reading text-lg">
          <span className="mr-2 font-sans text-sm font-bold text-ink-soft">
            {offset + i + 1}.
          </span>
          {question.prompt}
        </li>
      ))}
    </ol>
  );

  const pictures =
    images.length > 0 ? (
      <div
        className={images.length > 1 ? "grid gap-3 sm:grid-cols-2" : "max-w-xl"}
      >
        {images.map((image, i) => (
          <figure key={i}>
            <SceneImage image={image} locale={locale} />
            {images.length > 1 ? (
              <figcaption className="mt-1 text-sm text-ink-soft">
                {t("pictureN", { number: i + 1 })}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    ) : null;

  if (finished) {
    return (
      <section className="max-w-[68ch] space-y-8">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-xl font-bold font-semi-expanded focus:outline-none"
        >
          {t("reviewTitle")}
        </h2>
        {pictures}
        <ol className="space-y-10">
          {turns.map((item, i) => (
            <li key={item.key} className="space-y-4">
              {questionList(item.questions, turns.length > 1 ? i : 0)}
              <RecordingPlayer
                label={t("yourRecording")}
                name={item.key.replace("#", "-")}
                recording={recordings[item.key]}
              />
              {item.questions.map((question, j) => (
                <SpeakingModels
                  key={j}
                  id={`${item.key}-${j}`}
                  question={question}
                  speech={speech}
                />
              ))}
            </li>
          ))}
        </ol>
        {saved ? (
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
            criteria={SPEAKING_RUBRIC.map((key) => ({
              key,
              label: tSpeaking(`rubric.${key}`),
              hint: tSpeaking(`rubricHints.${part}.${key}`),
            }))}
            onSave={save}
          />
        )}
      </section>
    );
  }

  return (
    <section
      aria-label={t(`instructions.${part}`)}
      className="max-w-[68ch] space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold">
          {t(mode === "exam" ? "examMode" : "studyMode")}
          {turns.length > 1
            ? ` · ${t("turn", { current: state.turn + 1, total: turns.length })}`
            : ""}
        </p>
      </div>

      <h2 className="text-lg font-bold font-semi-expanded">
        {t(`instructions.${part}`)}
      </h2>

      {micNotice ? (
        <p role="status" className="rounded-control bg-sheet px-4 py-3">
          {micNotice}
        </p>
      ) : null}

      {pictures}
      {questionList(turn.questions, turns.length > 1 ? state.turn : 0)}

      {mode === "study" && state.phase === "ready" ? (
        <div className="space-y-3">
          <p className="rounded-control bg-sheet px-4 py-3 text-sm">
            <span className="font-semibold">{t("structureTitle")}:</span>{" "}
            {t(`structure.${part}`)}
          </p>
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
          <PhrasePanel phrases={phrases} initialRegister="all" />
        </div>
      ) : null}

      {state.phase === "reading" ? (
        <p role="status" className="font-semibold">
          {t("phase.reading")}
        </p>
      ) : null}

      {state.phase === "preparing" || state.phase === "answering" ? (
        <AnswerTimer
          key={state.phase}
          label={t(`phase.${state.phase}`)}
          remainingMs={remainingMs}
          totalMs={totalMs}
        />
      ) : null}

      {state.phase === "preparing" ? (
        <div className="space-y-2">
          <label htmlFor="speaking-notes" className="block font-semibold">
            {t("notes")}
          </label>
          <textarea
            id="speaking-notes"
            lang="en"
            rows={4}
            className="block w-full rounded-control border-[1.5px] border-line bg-paper p-3"
          />
        </div>
      ) : null}

      {state.phase === "answering" ? (
        <p className="flex items-center gap-2 font-semibold">
          {micStatus === "recording" ? (
            <>
              <span
                aria-hidden="true"
                className="size-3 rounded-full bg-refusal motion-safe:animate-pulse"
              />
              {t("recording")}
            </>
          ) : (
            t("notRecording")
          )}
        </p>
      ) : null}

      {mode === "study" && state.phase === "done" ? (
        <div className="space-y-4">
          <RecordingPlayer
            label={t("yourRecording")}
            name={turn.key.replace("#", "-")}
            recording={recordings[turn.key]}
          />
          {turn.questions.map((question, j) => (
            <SpeakingModels
              key={j}
              id={`${turn.key}-${j}`}
              question={question}
              speech={speech}
            />
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {mode === "study" && state.phase === "ready" ? (
          <>
            <Button
              variant="primary"
              onClick={() => dispatch({ type: "start", at: now() })}
            >
              {state.prepSeconds > 0 ? t("startPreparing") : t("startSpeaking")}
            </Button>
            {speech.supported ? (
              <Button
                variant="ghost"
                onClick={() =>
                  speech.play(turn.key, [
                    {
                      speaker: "woman",
                      text: turn.questions.map((q) => q.prompt).join(" "),
                    },
                  ])
                }
              >
                {t("listenQuestion")}
              </Button>
            ) : null}
          </>
        ) : null}
        {state.phase === "preparing" ? (
          <Button
            variant="primary"
            onClick={() => dispatch({ type: "stop", at: now() })}
          >
            {t("speakNow")}
          </Button>
        ) : null}
        {state.phase === "answering" ? (
          <Button
            variant="primary"
            onClick={() => dispatch({ type: "stop", at: now() })}
          >
            {t("stopSpeaking")}
          </Button>
        ) : null}
        {mode === "study" && state.phase === "done" ? (
          <>
            <Button
              variant="primary"
              onClick={() => dispatch({ type: "next" })}
            >
              {state.turn + 1 >= turns.length ? t("finish") : t("next")}
            </Button>
            <Button onClick={() => dispatch({ type: "retry" })}>
              {t("retry")}
            </Button>
          </>
        ) : null}
      </div>
    </section>
  );
}
