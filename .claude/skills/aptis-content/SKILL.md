---
name: aptis-content
description: How to write Sello study content (grammar lessons, vocabulary groups and entries, Core grammar/vocabulary exercises, functional phrases, can-do statements) as JSON in content/. Use before drafting, reviewing or fixing any file under content/.
---

# Writing Sello content

## Non-negotiables

- **Original only.** Imitate the Aptis format, never copy sentences, passages, items or explanations from British Council material, Cambridge books or any other source. The books in `src/config/books.ts` are only used to list units as `references` (book id + unit number) and to check coverage.
- **British English** spelling and usage (colour, realise, flat, queue, at the weekend). Spanish (`es`) is neutral peninsular Spanish, short and helpful, aimed at Spanish speakers' typical mistakes.
- Learners are B1/B2 aiming for C. Sentences should be natural, adult and everyday (work, studies, travel, city life, health, media…), never childish or culturally narrow.
- Every distractor must be clearly wrong for one reason a learner can understand. Only one option may be correct, including in informal speech.

## Source of truth

The Zod schemas are the contract; read them instead of guessing fields:

- `src/lib/content/schemas/lessons.ts`: `GrammarLesson`, `VocabularyEntry`, `VocabularyGroup`, `CanDo`, `FunctionalPhrase`, plus `GRAMMAR_CATEGORIES`, `VOCAB_SETS` and `Reference`.
- `src/lib/content/schemas/core.ts`: `CoreGrammarExercise` (3 options, `optionNotes` in the same order) and `CoreVocabularyExercise` (a shared word bank; each word answers at most one item; `usage` items have exactly one `___`).
- `src/lib/content/schemas/common.ts`: `TOPICS`, `CEFR_LEVELS`, `LocalizedText` (`en` required, `es` optional) and the gap rule (exactly one `___`).

Model files to copy the shape from:

- Lesson: `content/grammar/inversion.json`
- Grammar questions: `content/exercises/core-grammar/inversion.json`
- Vocabulary group, entries and tasks: `content/vocabulary/groups.json`, `content/vocabulary/work.json`, `content/exercises/core-vocabulary/work.json`

## Conventions

- One file per lesson or topic. The file name is the slug. Each file has a top-level `kind` and an `items` array.
- Ids follow the slug: grammar questions use `cg-<short>-NN` and vocabulary tasks `cv-<topic>-<type>s-NN`. Ids are unique across all files (the validator checks).
- Lessons: `order` in steps of 10 within a level. Set `category`, and add `references` only when the book unit really covers the point.
- Inline markup: `**bold**` for form, `_italic_` for examples inside prose, `==mark==` for highlighting. A gap is `___`.
- Grammar questions: aim for 9 per lesson at mixed difficulty (1–5), with a mix of `written` and `spoken` register and varied topics. Write `explanation.en` for every question; add `es` when it helps with a Spanish-speaker trap.
- Vocabulary: one task per `vocabType` before repeating a type; word banks with distractors from the same field.

## Workflow

1. Draft files (use the `content-writer` agent for batches; one agent per category or topic, never two on the same file).
2. `npm run validate:content`. Fix every error and warning, and look at the coverage line.
3. Review: correct answer key, a single correct option, British English, originality, natural Spanish.
4. `npm run check` before committing.
