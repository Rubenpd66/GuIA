"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import type {
  CefrLevel,
  LocalizedText,
  Topic,
} from "@/lib/content/schemas/common";
import type { FunctionalPhrase } from "@/lib/content/schemas/lessons";
import { localized } from "@/lib/content/localize";
import { useToday } from "@/lib/estimate/useToday";
import { shiftDay } from "@/lib/estimate/activity";
import {
  buildFlashcardSession,
  dueCount,
  gapExample,
  newLeftToday,
  recordReview,
  type DeckCard,
} from "@/lib/flashcards/deck";
import { GRADES, isDue, review, type Grade } from "@/lib/flashcards/sm2";
import { flashcardsStore } from "@/lib/flashcards/store";

export type FlashcardData = DeckCard &
  (
    | {
        deck: "vocabulary";
        headword: string;
        pos: string;
        definition: string;
        example: string;
        collocations: string[];
        falseFriend?: { spanish: string; trap: LocalizedText };
      }
    | {
        deck: "phrases";
        function: FunctionalPhrase["function"];
        register: FunctionalPhrase["register"];
        phrase: string;
        example: string;
        note?: LocalizedText;
      }
  );

type DeckFilter = "all" | DeckCard["deck"];
const GRADE_ORDER = Object.keys(GRADES) as Grade[];

export function FlashcardTrainer({ cards }: { cards: FlashcardData[] }) {
  const t = useTranslations("Flashcards");
  const today = useToday();
  const state = flashcardsStore.useValue();
  const [deck, setDeck] = useState<DeckFilter>("all");
  const [level, setLevel] = useState<CefrLevel | "all">("all");
  const [topic, setTopic] = useState<Topic | "all">("all");
  const [queue, setQueue] = useState<FlashcardData[] | null>(null);

  if (today === null) return null;
  const pool = cards.filter(
    (card) =>
      (deck === "all" || card.deck === deck) &&
      (level === "all" || card.level === level) &&
      (topic === "all" || card.topics.includes(topic)),
  );
  const session = buildFlashcardSession(pool, state, today);
  const dueHere = session.filter((card) => state.cards[card.id]).length;
  const levels = [...new Set(cards.map((card) => card.level))].sort();
  const topics = [
    ...new Set(cards.flatMap((card) => card.topics)),
  ].sort() as Topic[];

  if (queue)
    return (
      <FlashcardSession
        key={queue.map((card) => card.id).join()}
        queue={queue}
        today={today}
        onDone={() => setQueue(null)}
      />
    );

  return (
    <section
      aria-labelledby="flashcards-setup"
      className="max-w-[68ch] space-y-6"
    >
      <h2
        id="flashcards-setup"
        className="text-xl font-bold font-semi-expanded"
      >
        {t("setupTitle")}
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <Filter
          id="fc-deck"
          label={t("deck")}
          value={deck}
          onChange={(value) => setDeck(value as DeckFilter)}
          options={[
            ["all", t("allDecks")],
            ["vocabulary", t("vocabulary")],
            ["phrases", t("phrases")],
          ]}
        />
        <Filter
          id="fc-level"
          label={t("level")}
          value={level}
          onChange={(value) => setLevel(value as CefrLevel | "all")}
          options={[
            ["all", t("allLevels")],
            ...levels.map((l) => [l, l] as [string, string]),
          ]}
        />
        <Filter
          id="fc-topic"
          label={t("topic")}
          value={topic}
          onChange={(value) => setTopic(value as Topic | "all")}
          options={[
            ["all", t("allTopics")],
            ...topics.map((tp) => [tp, t(`topics.${tp}`)] as [string, string]),
          ]}
        />
      </div>
      <p>
        {t("todayCounts", {
          due: dueHere,
          fresh: session.length - dueHere,
          left: newLeftToday(state, today),
        })}
      </p>
      {session.length === 0 ? (
        <p role="status" className="rounded-control bg-sheet px-4 py-3">
          {t("nothingToday", {
            tomorrow: Object.values(state.cards).filter((card) =>
              isDue(card, shiftDay(today, 1)),
            ).length,
          })}
        </p>
      ) : (
        <Button variant="primary" size="lg" onClick={() => setQueue(session)}>
          {t("start", { count: session.length })}
        </Button>
      )}
      <p className="text-sm text-ink-soft">
        {t("settingsNote", { count: state.newPerDay })}{" "}
        <Link href="/settings" className="underline underline-offset-4">
          {t("settingsLink")}
        </Link>
      </p>
      <p className="text-sm text-ink-soft">
        {t("totalDue", { count: dueCount(state, today) })}
      </p>
    </section>
  );
}

function Filter({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <div>
      <label htmlFor={id} className="block font-semibold">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-12 w-full rounded-control border-[1.5px] border-line bg-paper px-3"
      >
        {options.map(([optionValue, text]) => (
          <option key={optionValue} value={optionValue}>
            {text}
          </option>
        ))}
      </select>
    </div>
  );
}

function FlashcardSession({
  queue: initial,
  today,
  onDone,
}: {
  queue: FlashcardData[];
  today: string;
  onDone: () => void;
}) {
  const t = useTranslations("Flashcards");
  const [queue, setQueue] = useState(initial);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [tally, setTally] = useState({ reviewed: 0, again: 0 });
  // A card failed in this session comes back once at the end.
  const [requeued, setRequeued] = useState<Set<string>>(() => new Set());
  const card = queue[index];

  const grade = (g: Grade) => {
    if (!card) return;
    const current = flashcardsStore.read();
    const next = review(current.cards[card.id], g, today);
    flashcardsStore.save(recordReview(current, card.id, next, today));
    setTally((tl) => ({
      reviewed: tl.reviewed + 1,
      again: tl.again + (g === "again" ? 1 : 0),
    }));
    if (g === "again" && !requeued.has(card.id)) {
      setRequeued((set) => new Set(set).add(card.id));
      setQueue((q) => [...q, card]);
    }
    setFlipped(false);
    setIndex((i) => i + 1);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, select, textarea, button, a")) return;
      if ((event.key === " " || event.key === "Enter") && !flipped) {
        event.preventDefault();
        setFlipped(true);
      } else if (flipped && ["1", "2", "3", "4"].includes(event.key)) {
        grade(GRADE_ORDER[Number(event.key) - 1]!);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!card)
    return (
      <section aria-labelledby="fc-done" className="max-w-[68ch] space-y-4">
        <h2 id="fc-done" className="text-xl font-bold font-semi-expanded">
          {t("doneTitle")}
        </h2>
        <p>{t("doneBody", tally)}</p>
        <Button variant="primary" onClick={onDone}>
          {t("back")}
        </Button>
      </section>
    );

  return (
    <section
      aria-label={t("progress", { current: index + 1, total: queue.length })}
      className="max-w-[68ch] space-y-6"
    >
      <p className="font-semibold tabular-nums">
        {t("progress", { current: index + 1, total: queue.length })}
      </p>
      <CardFace card={card} flipped={flipped} />
      {flipped ? (
        <div className="space-y-2">
          <p className="text-sm text-ink-soft">{t("gradeHint")}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {GRADE_ORDER.map((g, i) => (
              <Button
                key={g}
                variant={g === "good" ? "primary" : "secondary"}
                onClick={() => grade(g)}
              >
                {t(`grades.${g}`)}
                <span aria-hidden="true" className="text-xs opacity-70">
                  {i + 1}
                </span>
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <Button variant="primary" size="lg" onClick={() => setFlipped(true)}>
          {t("flip")}
        </Button>
      )}
      <p className="text-sm text-ink-soft">{t("keyboard")}</p>
      <Button variant="ghost" onClick={onDone}>
        {t("stop")}
      </Button>
    </section>
  );
}

function CardFace({
  card,
  flipped,
}: {
  card: FlashcardData;
  flipped: boolean;
}) {
  const t = useTranslations("Flashcards");
  const tAll = useTranslations();
  const locale = useLocale();
  return (
    <div
      aria-live="polite"
      className="space-y-4 rounded-page border-[1.5px] border-line bg-sheet p-6"
    >
      {card.deck === "vocabulary" ? (
        <>
          <p className="flex flex-wrap items-baseline gap-x-3">
            <span lang="en" className="text-3xl font-bold">
              {card.headword}
            </span>
            <span className="text-sm text-ink-soft">
              {card.pos} · {card.level}
            </span>
          </p>
          {!flipped ? (
            gapExample(card.example, card.headword) ? (
              <p lang="en" className="prose-reading text-lg">
                {gapExample(card.example, card.headword)}
              </p>
            ) : (
              <p className="text-ink-soft">{t("vocabularyPrompt")}</p>
            )
          ) : (
            <div className="space-y-2">
              <p lang="en" className="prose-reading text-lg font-semibold">
                {card.definition}
              </p>
              <p lang="en" className="prose-reading">
                {card.example}
              </p>
              {card.collocations.length > 0 ? (
                <p lang="en" className="text-sm">
                  <span className="font-semibold">{t("collocations")}</span>{" "}
                  {card.collocations.join(" · ")}
                </p>
              ) : null}
              {card.falseFriend ? (
                <p className="text-sm">
                  <span className="font-semibold">
                    {t("falseFriend", { word: card.falseFriend.spanish })}
                  </span>{" "}
                  {localized(card.falseFriend.trap, locale)}
                </p>
              ) : null}
            </div>
          )}
        </>
      ) : (
        <>
          <p className="text-sm text-ink-soft">
            {tAll(`Functional.${card.function}`)} · {card.level}
            {card.register !== "neutral"
              ? ` · ${tAll(`Vocab.${card.register}`)}`
              : ""}
          </p>
          {!flipped ? (
            <p className="text-lg">
              {t("phrasePrompt", {
                function: tAll(`Functional.${card.function}`),
              })}
              {card.note ? (
                <span className="mt-2 block text-sm text-ink-soft">
                  {localized(card.note, locale)}
                </span>
              ) : null}
            </p>
          ) : (
            <div className="space-y-2">
              <p lang="en" className="text-2xl font-bold">
                {card.phrase}
              </p>
              <p lang="en" className="prose-reading">
                {card.example}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
