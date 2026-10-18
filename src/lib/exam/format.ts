/**
 * Aptis ESOL General test format: the single source of truth for every count,
 * time limit and word range used by the content validator, the trainers and the
 * mock exam. Values come from the official "Test format overview". Values the
 * official document does not fix are marked `app decision`.
 */

export const EXAM_PARTS = [
  "core-grammar",
  "core-vocabulary",
  "reading-1",
  "reading-2",
  "reading-3",
  "reading-4",
  "listening-1",
  "listening-2",
  "listening-3",
  "listening-4",
  "writing-1",
  "writing-2",
  "writing-3",
  "writing-4",
  "speaking-1",
  "speaking-2",
  "speaking-3",
  "speaking-4",
] as const;

export type ExamPart = (typeof EXAM_PARTS)[number];

export const SKILLS = [
  "core",
  "reading",
  "listening",
  "writing",
  "speaking",
] as const;

export type Skill = (typeof SKILLS)[number];

export const SKILL_OF_PART: Record<ExamPart, Skill> = {
  "core-grammar": "core",
  "core-vocabulary": "core",
  "reading-1": "reading",
  "reading-2": "reading",
  "reading-3": "reading",
  "reading-4": "reading",
  "listening-1": "listening",
  "listening-2": "listening",
  "listening-3": "listening",
  "listening-4": "listening",
  "writing-1": "writing",
  "writing-2": "writing",
  "writing-3": "writing",
  "writing-4": "writing",
  "speaking-1": "speaking",
  "speaking-2": "speaking",
  "speaking-3": "speaking",
  "speaking-4": "speaking",
};

const EXAM_PART_SET: ReadonlySet<string> = new Set(EXAM_PARTS);

export function isExamPart(value: string): value is ExamPart {
  return EXAM_PART_SET.has(value);
}

export const EXAM_FORMAT = {
  core: {
    minutes: 25,
    grammarQuestions: 25,
    grammarOptions: 3,
    vocabularyQuestions: 25,
    // app decision: size of the word bank shared by the items of a vocabulary task
    vocabularyBank: { min: 5, max: 12 },
  },
  reading: {
    minutes: 35,
    part1: { sentences: 5, options: 3 },
    part2: { tasks: 2, sentences: 6 },
    part3: { people: 4, statements: 7 },
    part4: {
      // app decision: tolerance around the official "about 750 words"
      words: { target: 750, min: 700, max: 800 },
      headings: 8,
      paragraphs: 7,
    },
  },
  listening: {
    minutes: 40,
    maxPlays: 2,
    // app decision: options per question in parts 1 and 4
    part1: { options: 3 },
    part2: { speakers: 4, options: 6 },
    part3: { statements: 4 },
    part4: { questions: 2, options: 3 },
  },
  writing: {
    minutes: 50,
    // app decision: maxWords for a word-level answer
    part1: { messages: 5, maxWords: 5, recommendedMinutes: 3 },
    part2: { words: [20, 30], recommendedMinutes: 7 },
    part3: { questions: 3, words: [30, 40], recommendedMinutes: 10 },
    part4: {
      informalWords: [40, 50],
      formalWords: [120, 150],
      recommendedMinutes: 30,
    },
  },
  speaking: {
    minutes: 12,
    part1: { questions: 3, answerSeconds: 30 },
    part2: { questions: 3, answerSeconds: 45 },
    part3: { images: 2, questions: 3, answerSeconds: 45 },
    part4: { questions: 3, prepSeconds: 60, answerSeconds: 120 },
  },
  scores: { skillMax: 50, grammarVocabularyMax: 50, skillsTotalMax: 200 },
} as const;

export type WordRange = readonly [min: number, max: number];
