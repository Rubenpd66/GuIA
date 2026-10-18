export type Answers = Record<string, number | undefined>;

export type ItemResult = {
  key: string;
  correct: boolean;
  chosen: number | undefined;
};

/** Marks every item; an unanswered item counts as wrong. */
export function scoreItems(
  items: readonly { key: string; answer: number }[],
  answers: Answers,
): { correct: number; total: number; results: ItemResult[] } {
  const results = items.map((item) => ({
    key: item.key,
    correct: answers[item.key] === item.answer,
    chosen: answers[item.key],
  }));
  return {
    correct: results.filter((result) => result.correct).length,
    total: items.length,
    results,
  };
}
