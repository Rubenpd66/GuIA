import type { CefrLevel, LocalizedText } from "@/lib/content/schemas/common";
import type {
  CoreGrammarExercise,
  CoreVocabularyExercise,
} from "@/lib/content/schemas/core";
import { shuffle, type Rng } from "./random";

export type ChoiceQuestion = {
  key: string;
  exerciseId: string;
  grammarPoint: string;
  level: CefrLevel;
  register: CoreGrammarExercise["register"];
  prompt: string;
  options: string[];
  answer: number;
  optionNotes: LocalizedText[];
  explanation: LocalizedText;
};

export type VocabularyItem = {
  key: string;
  itemId: string;
  prompt: string;
  answer: number;
  explanation: LocalizedText;
};

export type VocabularyTask = {
  exerciseId: string;
  vocabType: CoreVocabularyExercise["vocabType"];
  level: CefrLevel;
  instructions?: string;
  options: string[];
  items: VocabularyItem[];
};

export const VOCAB_TYPE_ORDER: readonly CoreVocabularyExercise["vocabType"][] =
  ["synonym", "definition", "usage", "collocation"];

/** Shuffles the options and moves the answer index and per-option notes with them. */
export function shuffleChoice<N>(
  choice: {
    options: readonly string[];
    answer: number;
    optionNotes?: readonly N[];
  },
  rng: Rng,
): { options: string[]; answer: number; optionNotes: N[] } {
  const order = shuffle(
    choice.options.map((_, i) => i),
    rng,
  );
  return {
    options: order.map((i) => choice.options[i]!),
    answer: order.indexOf(choice.answer),
    optionNotes: choice.optionNotes
      ? order.map((i) => choice.optionNotes![i]!)
      : [],
  };
}

type GrammarSessionOptions = {
  exercises: readonly CoreGrammarExercise[];
  count: number;
  rng: Rng;
  levels?: readonly CefrLevel[];
  grammarPoint?: string;
  /** Practise only these exercise ids (e.g. the mistakes bank). */
  onlyKeys?: readonly string[];
};

export function buildGrammarSession({
  exercises,
  count,
  rng,
  levels,
  grammarPoint,
  onlyKeys,
}: GrammarSessionOptions): ChoiceQuestion[] {
  const keys = onlyKeys ? new Set(onlyKeys) : undefined;
  const pool = exercises.filter(
    (q) =>
      (!levels || levels.includes(q.cefrLevel)) &&
      (!grammarPoint || q.grammarPoint === grammarPoint) &&
      (!keys || keys.has(q.id)),
  );
  return shuffle(pool, rng)
    .slice(0, count)
    .map((q) => ({
      key: q.id,
      exerciseId: q.id,
      grammarPoint: q.grammarPoint,
      level: q.cefrLevel,
      register: q.register,
      prompt: q.prompt,
      explanation: q.explanation,
      ...shuffleChoice(q, rng),
    }));
}

export const vocabularyKey = (exerciseId: string, itemId: string) =>
  `${exerciseId}#${itemId}`;

type VocabularySessionOptions = {
  tasks: readonly CoreVocabularyExercise[];
  count: number;
  rng: Rng;
  levels?: readonly CefrLevel[];
  onlyKeys?: readonly string[];
};

/**
 * Whole tasks (they share a word bank) until `count` items, trimming the last one.
 * One task of each question type goes in first when the bank has them, like the exam.
 */
export function buildVocabularySession({
  tasks,
  count,
  rng,
  levels,
  onlyKeys,
}: VocabularySessionOptions): VocabularyTask[] {
  const keys = onlyKeys ? new Set(onlyKeys) : undefined;
  const pool = shuffle(
    tasks
      .filter((task) => !levels || levels.includes(task.cefrLevel))
      .map((task) => ({
        task,
        items: task.items.filter(
          (item) => !keys || keys.has(vocabularyKey(task.id, item.id)),
        ),
      }))
      .filter(({ items }) => items.length > 0),
    rng,
  );

  const firstOfEachType = VOCAB_TYPE_ORDER.flatMap((type) => {
    const match = pool.find(({ task }) => task.vocabType === type);
    return match ? [match] : [];
  });
  const ordered = [
    ...firstOfEachType,
    ...pool.filter((entry) => !firstOfEachType.includes(entry)),
  ];

  const session: VocabularyTask[] = [];
  let total = 0;
  for (const { task, items } of ordered) {
    if (total >= count) break;
    const taken = items.slice(0, count - total);
    total += taken.length;
    const bank = shuffleChoice({ options: task.options, answer: 0 }, rng);
    const order = bank.options.map((word) => task.options.indexOf(word));
    session.push({
      exerciseId: task.id,
      vocabType: task.vocabType,
      level: task.cefrLevel,
      instructions: task.instructions,
      options: bank.options,
      items: taken.map((item) => ({
        key: vocabularyKey(task.id, item.id),
        itemId: item.id,
        prompt: item.prompt,
        answer: order.indexOf(item.answer),
        explanation: item.explanation,
      })),
    });
  }
  return session.sort(
    (a, b) =>
      VOCAB_TYPE_ORDER.indexOf(a.vocabType) -
      VOCAB_TYPE_ORDER.indexOf(b.vocabType),
  );
}
