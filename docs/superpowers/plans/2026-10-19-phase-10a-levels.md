# Phase 10a: Levels and A2 Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Sello a single source of truth for the four subscription tiers, open A2 to can-do statements and functional phrases, report content per level (and what each level's mock exam is missing), fence the placement test to a fixed public pool, and write the A2 content the free tier needs.

**Architecture:** Every exercise already carries `cefrLevel` (in `exerciseBase`) and the trainers already filter by it, so no exercise is re-tagged. New code is small and pure: `src/lib/access/tiers.ts`, a per-level count plus gap report in the content validator, and a `placement` flag read by the placement bank. The bulk of the phase is original A2 content drafted by the `content-writer` agent and reviewed key by key. No gating happens yet (that is 10b).

**Tech Stack:** Next 16, TypeScript, Zod 4, Vitest, the content validator (`npm run validate:content`).

**Spec:** `docs/superpowers/specs/2026-10-19-phase-10-tiers-design.md` (section 3, as corrected on 2026-10-19).

## Global Constraints

- Tiers and prices (display only; Stripe is the source of truth from 10c): `free` = A2, `b1` = 9,99 €/month or 95,90 €/year, `b2` = 14,99 € or 143,90 €, `c1` = 19,99 € or 191,90 €. Each tier unlocks its level and every level below.
- All study content is original, imitates the Aptis format and never copies British Council or commercial material. British English. Spanish text short and natural.
- Book references (`references`) only with the user's OK: new lessons ship with `"references": []`.
- Levels shown to learners are the app's estimate, never official data.
- No new packages, env vars or services in this phase.
- `messages/es.json` and `messages/en.json` keep identical keys.
- `npm run check` passes before every commit; content tasks also review the agent's output key by key before committing.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` (or the model that ran the task).

## Review Focus

1. A tier name or level string outside the known sets (e.g. `"a2"`, `"C2"`) reaching `levelsFor` / `tierFor`: TypeScript must reject it at compile time; no runtime fallback is added.
2. The A2 mock exam is built from A2 tasks only: every exam part needs at least its exam count at A2, or the A2 mock silently drops that part. The validator's "Mock gaps" line must read `none` at phase close (Task 9).
3. The placement test after the `placement` flag: with too few flagged items it would silently shrink. The "Placement gaps" line must read `none` (Task 4), and the placement unit test pins that unflagged items never reach the bank.
4. Adding A2 to `TARGET_LEVELS` shows an A2 can-do row on the syllabus page; until Task 7 it reads "0". Task 7 closes it; the e2e run in Task 9 catches layout breaks at 320 px.
5. Duplicate headwords: A2 vocabulary entries must not repeat a headword that already exists at another level (Task 6 step checks it).

---

### Task 1: Tiers module

**Files:**
- Create: `src/lib/access/tiers.ts`
- Test: `src/lib/access/tiers.test.ts`

**Interfaces:**
- Consumes: `CEFR_LEVELS`, `CefrLevel` from `src/lib/content/schemas/common.ts`.
- Produces (used by 10b–10d):
  - `TIERS: readonly ["free", "b1", "b2", "c1"]`, `type Tier`, `type PaidTier = Exclude<Tier, "free">`
  - `TIER_LEVEL: Record<Tier, CefrLevel>` (`free` → `"A2"`, `b1` → `"B1"`, `b2` → `"B2"`, `c1` → `"C1"`)
  - `levelsFor(tier: Tier): CefrLevel[]` (cumulative, easiest first)
  - `tierFor(level: CefrLevel): Tier` (the cheapest tier that opens it)
  - `canAccess(tier: Tier, level: CefrLevel): boolean`
  - `PRICES: Record<PaidTier, { month: number; year: number }>` in euro cents, VAT included

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { PRICES, TIERS, canAccess, levelsFor, tierFor } from "./tiers";

describe("tiers", () => {
  it("unlocks a tier's level and every level below", () => {
    expect(levelsFor("free")).toEqual(["A2"]);
    expect(levelsFor("b1")).toEqual(["A2", "B1"]);
    expect(levelsFor("b2")).toEqual(["A2", "B1", "B2"]);
    expect(levelsFor("c1")).toEqual(["A2", "B1", "B2", "C1"]);
  });

  it("names the cheapest tier for each level", () => {
    expect(tierFor("A2")).toBe("free");
    expect(tierFor("B1")).toBe("b1");
    expect(tierFor("C1")).toBe("c1");
    for (const tier of TIERS) expect(tierFor(levelsFor(tier).at(-1)!)).toBe(tier);
  });

  it("answers access questions", () => {
    expect(canAccess("b1", "A2")).toBe(true);
    expect(canAccess("b1", "B2")).toBe(false);
    expect(canAccess("c1", "C1")).toBe(true);
  });

  it("prices the year at 20 % off twelve months, in cents", () => {
    expect(PRICES).toEqual({
      b1: { month: 999, year: 9590 },
      b2: { month: 1499, year: 14390 },
      c1: { month: 1999, year: 19190 },
    });
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `npx vitest run src/lib/access/tiers.test.ts`
Expected: FAIL, cannot find module `./tiers`.

- [ ] **Step 3: Implement `src/lib/access/tiers.ts`**

`levelsFor` slices `CEFR_LEVELS` up to the tier's level; `tierFor` finds the tier whose `TIER_LEVEL` matches. One-line comment on `PRICES`: display only, Stripe holds the charged prices from 10c.

- [ ] **Step 4: Run it and see it pass**

Run: `npx vitest run src/lib/access/tiers.test.ts`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/access/tiers.ts src/lib/access/tiers.test.ts
git commit -m "feat(access): tiers, cumulative levels and display prices"
```

### Task 2: A2 as a target level

**Files:**
- Modify: `src/lib/content/schemas/lessons.ts:154` (`TARGET_LEVELS`)
- Modify: `src/lib/content/schemas/lessons.test.ts:91-100`
- Check (no change expected): `src/lib/content/index.ts:127-155`, `src/app/[locale]/syllabus/page.tsx:126`

**Interfaces:**
- Produces: `TARGET_LEVELS = ["A2", "B1", "B2", "C1"]`, so `CanDo.level` and `FunctionalPhrase.level` accept A2 and `canDoByLevel` returns an `A2` key.

- [ ] **Step 1: Change the test**

In `lessons.test.ts`, the case that expects `FunctionalPhrase` with `level: "A2"` to fail now expects it to pass; add one case that `level: "A1"` still fails. In `src/lib/content/index.test.ts`, assert `Object.keys(canDoByLevel(index))` equals `["A2", "B1", "B2", "C1"]`.

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run src/lib/content/schemas/lessons.test.ts src/lib/content/index.test.ts`
Expected: the A2 phrase case and the keys case fail.

- [ ] **Step 3: Set `TARGET_LEVELS` to `["A2", "B1", "B2", "C1"]`** and update its doc comment ("every level the app teaches").

- [ ] **Step 4: Run `npm run check`**

Expected: all tests pass, validator 0 errors.

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(content): accept A2 in can-do and functional schemas"
```

### Task 3: Content per level and mock gaps in the validator report

**Files:**
- Modify: `src/lib/trainer/config.ts` (add `MOCK_NEEDS`)
- Modify: `src/lib/content/validate.ts` (`ValidationReport.bank.byLevel`, `mockGaps`, `formatReport`)
- Test: `src/lib/content/validate.test.ts`

**Interfaces:**
- Produces:
  - `MOCK_NEEDS: Record<ExamPart, number>`: what one mock exam takes from each part. Core Grammar `CORE_PART_EXAM.grammar.count` questions; Core Vocabulary `CORE_PART_EXAM.vocabulary.count` items; Reading parts `READING_PART_EXAM[part].tasks`; Listening parts `LISTENING_PART_EXAM[part].tasks`; every Writing and Speaking part 1.
  - `ValidationReport.bank.byLevel: Record<ExamPart, Record<CefrLevel, number>>`: questions for `core-grammar`, items for `core-vocabulary`, tasks for every other part.
  - `mockGaps(byLevel): { level: CefrLevel; part: ExamPart; have: number; need: number }[]`: for each level L and part P, `have` counts units at L **or below** (a tier's mock uses every unlocked level); a gap is `have < MOCK_NEEDS[P]`.
- Gaps are report lines, **not warnings**: existing tests assert the fixture set has no warnings, and gaps are expected while A2 content is being written.

- [ ] **Step 1: Write the failing tests** in `validate.test.ts`:
  - `"counts each exam part per level"`: for `validSet()`, `report.bank.byLevel["core-grammar"]` equals the fixture's per-level question counts (read the fixture's `cefrLevel` to set the expected numbers).
  - `"finds the parts a level's mock exam cannot fill, counting lower levels too"`: `mockGaps` on a hand-built `byLevel` where `reading-4` has `{ A2: 0, B1: 1, B2: 0, C1: 0 }` returns a gap `{ level: "A2", part: "reading-4", have: 0, need: 1 }` and no `reading-4` gap for B1, B2 or C1.
  - `"prints the level table and the mock gaps"`: `formatReport` output contains a line starting `By level (A2 B1 B2 C1):` and a line starting `Mock gaps:`; with no gaps it reads `Mock gaps: none`.

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run src/lib/content/validate.test.ts`
Expected: the three new tests fail.

- [ ] **Step 3: Implement** `MOCK_NEEDS` in `config.ts`, the `byLevel` count in `validateContentSet`, exported `mockGaps`, and two `formatReport` lines:
  - `By level (A2 B1 B2 C1): core-grammar 40/126/107/63 · core-vocabulary …` (one line, parts in `EXAM_PARTS` order)
  - `Mock gaps: A2 reading-1 0/1, A2 reading-2 0/2, …` or `Mock gaps: none`

- [ ] **Step 4: Run `npm run check`**

Expected: tests pass; the validator prints the level table and a non-empty A2 "Mock gaps" line (that is the to-do list for Tasks 6 and 8).

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(content): per-level counts and mock exam gaps in the validator report"
```

### Task 4: Fixed public pool for the placement test

**Files:**
- Modify: `src/lib/content/schemas/common.ts:77-82` (`exerciseBase`)
- Modify: `src/components/assessment/placement.ts` (export `GRAMMAR_BY_LEVEL`; add `placementGaps`)
- Modify: `src/lib/content/banks.ts` (placement bank)
- Modify: `src/lib/content/validate.ts` (`Placement gaps:` line)
- Modify: existing exercise files under `content/exercises/{core-grammar,core-vocabulary,reading-1,reading-3,listening-1,listening-2}/` (add `"placement": true`)
- Test: `src/lib/content/banks.test.ts` (create), `src/components/assessment/placement.test.ts`

**Interfaces:**
- Produces: `exerciseBase.placement: z.literal(true).optional()`; the `placement` bank only contains exercises with `placement: true`. 10b treats these as free for every tier.
- Produces: `placementGaps(bank: PlacementBank): string[]`: empty when the pool covers one test, otherwise one message per shortfall (grammar per level from `GRAMMAR_BY_LEVEL`, `PLACEMENT.vocabularyItems` vocabulary items, 1 reading task, `PLACEMENT.listening1Tasks`, `PLACEMENT.listening2Tasks`).

- [ ] **Step 1: Write the failing tests**
  - `banks.test.ts`, `"the placement bank holds only flagged exercises"`: build a `ContentIndex` with two `core-grammar` fixture questions, one with `placement: true`; `BANKS.placement(index).grammar` has length 1 and that id.
  - `placement.test.ts`, `"reports what a placement pool lacks"`: an empty bank gives a non-empty `placementGaps`; a bank with 3/4/4/4 grammar questions at A2/B1/B2/C1, 10 vocabulary items, 1 reading, 3 listening-1 and 1 listening-2 task gives `[]`.

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run src/lib/content/banks.test.ts src/components/assessment/placement.test.ts`

- [ ] **Step 3: Implement** the schema field, the bank filter (`.filter((e) => e.placement)` on each placement list), `placementGaps`, and the report line `Placement gaps: none` / `Placement gaps: <messages joined by ", ">`.

- [ ] **Step 4: Flag the pool** in existing content, about twice what one test uses so retakes vary: 6 A2, 8 B1, 8 B2 and 8 C1 Core Grammar questions (spread over different lessons); 3 Core Vocabulary tasks (about 15 items, mixed levels and types); 3 tasks across Reading 1 and 3 (one each of B1, B2, C1); 6 Listening 1 tasks (mixed levels); 2 Listening 2 tasks.

- [ ] **Step 5: Run `npm run check`**

Expected: tests pass; validator shows `Placement gaps: none`. Then `npx playwright test e2e/flows.spec.ts -g "placement"` passes (the test still runs to a result).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(placement): fixed public pool of flagged exercises"
```

### Task 5: Ten A2 grammar lessons with Core Grammar questions

**Files:**
- Create: `content/grammar/<slug>.json` and `content/exercises/core-grammar/<slug>.json` for each lesson below.

Dispatch the `content-writer` agent with this table (all `level: "A2"`, `"references": []`, 6 Core Grammar questions each with `cefrLevel: "A2"`, `grammarPoint` = the slug, ids `cg-<slug>-01`…`06`). The lessons must not repeat the B1 lessons that cover the contrast (`present-simple-vs-continuous`, `past-simple-vs-continuous`, `future-forms`): A2 teaches the form and basic use only.

| slug | category | order |
|---|---|---|
| `present-simple-routines` | tenses | 90 |
| `present-continuous-now` | tenses | 100 |
| `past-of-be-was-were` | tenses | 110 |
| `past-simple-regular-irregular` | tenses | 120 |
| `going-to-plans` | future | 130 |
| `imperatives-and-lets` | verb-patterns | 140 |
| `like-want-would-like` | verb-patterns | 150 |
| `object-pronouns-this-that` | pronouns-determiners | 160 |
| `question-words-and-order` | questions | 170 |
| `and-but-so-because` | linking | 180 |

- [ ] **Step 1: Dispatch the agent** with the table, the rules above and the instruction to run `npm run validate:content`.
- [ ] **Step 2: Review key by key**: originality, British spelling, one unambiguous answer per question, `optionNotes` match `options` order, Spanish natural.
- [ ] **Step 3: Run `npm run check`**. Expected: 0 errors; validator lists 75 lessons; `core-grammar` A2 count in the level table is 100.
- [ ] **Step 4: Commit** `feat(content): ten A2 grammar lessons with Core Grammar questions`.

### Task 6: A2 vocabulary and Core Vocabulary tasks

**Files:**
- Create: `content/vocabulary/a2-everyday.json`
- Create: `content/exercises/core-vocabulary/a2.json`

- [ ] **Step 1: Dispatch the agent**:
  - 60 entries at `level: "A2"`, ids `v-a2-<headword-slug>`, `topics` spread over work, education, travel, city, shopping-consumption, health-sport, relationships and culture-leisure (7–8 each), everyday words a Spanish speaker at A2 needs, with examples and `falseFriend` where it really applies.
  - 8 Core Vocabulary tasks with `cefrLevel: "A2"`, 2 per `vocabType` (synonym, definition, usage, collocation), 5 items each, ids `cv-a2-<type>-1|2`, word banks drawn from the new entries.
- [ ] **Step 2: Check headwords are new**: no headword in `a2-everyday.json` may already exist in another vocabulary file (case-insensitive). Run a one-off check with Grep or a short `tsx` snippet in the scratchpad; fix duplicates.
- [ ] **Step 3: Review key by key** (each answer in a word bank answers exactly one item; definitions at A2 wording).
- [ ] **Step 4: Run `npm run check`**. Expected: 0 errors; `core-vocabulary` A2 = 40 items; no `core-vocabulary` A2 mock gap.
- [ ] **Step 5: Commit** `feat(content): A2 vocabulary and Core Vocabulary tasks`.

### Task 7: A2 functional phrases and can-do statements

**Files:**
- Create: `content/can-do/a2.json`
- Modify: the ten files in `content/functional/` (two A2 phrases appended to each)

- [ ] **Step 1: Dispatch the agent**: 18 can-do statements (`cd-a2-<skill>-1..3`, 3 per skill in `CAN_DO_SKILLS`, `links` only to A2 lessons and existing parts); 20 functional phrases (`fl-<function>-a2-1|2`, the simplest natural phrase for each function, e.g. "I think…", "Wait a moment…").
- [ ] **Step 2: Review key by key.**
- [ ] **Step 3: Run `npm run check`**, then start the dev server and confirm the syllabus page shows the A2 can-do row with 18 items and the functional-language page lists A2 phrases (Playwright snapshot, no screenshots; delete `.playwright-mcp/` afterwards).
- [ ] **Step 4: Commit** `feat(content): A2 can-do statements and functional phrases`.

### Task 8: A2 exam tasks for Reading, Listening, Writing and Speaking

**Files:**
- Create: `content/exercises/<part>/a2.json` for each part below.

Counts (new A2 tasks; the existing ones stay): Reading 1: 2, Reading 2: 3, Reading 3: 2, Reading 4: 2; Listening 1: 7, Listening 2: 2, Listening 3: 2, Listening 4: 2; Writing 1: 1, Writing 2: 2, Writing 3: 2, Writing 4: 2; Speaking 1: 1, Speaking 2: 2, Speaking 3: 2, Speaking 4: 2. All `cefrLevel: "A2"`, ids `<part-prefix>-a2-<n>` following each part's existing prefix. Each part keeps its exam format (word ranges, option counts); A2 shows in simpler language, familiar topics and clearer distractors, not in a shorter format.

- [ ] **Step 1: Dispatch the agent twice** (Reading + Listening, then Writing + Speaking) so each run stays reviewable.
- [ ] **Step 2: Review key by key** after each run: one defensible answer per item, Listening clue phrases present in the scripts, model answers inside word ranges, British spelling.
- [ ] **Step 3: Run `npm run check`**. Expected: 0 errors, 0 warnings, and `Mock gaps: none`.
- [ ] **Step 4: Commit** after each run: `feat(content): A2 Reading and Listening tasks`, `feat(content): A2 Writing and Speaking tasks`.

### Task 9: Close phase 10a

**Files:**
- Modify: `docs/status.md` (new "Phase 10a" section: files, decisions, gotchas)
- Modify: `CLAUDE.md` (status line: 10a done, next 10b)

- [ ] **Step 1: Run `npm run check`**. Expected: all pass; `Mock gaps: none`; `Placement gaps: none`.
- [ ] **Step 2: Run `npm run e2e`**. Expected: all pass (the Supabase round trip may skip without keys).
- [ ] **Step 3: Write the status notes** (no gating yet; `placement: true` means free in 10b; `MOCK_NEEDS` is the mock's per-part draw).
- [ ] **Step 4: Commit and sync the mirror**

```bash
git commit -am "docs: phase 10a status"
```

Then in PowerShell: `git -C "C:\Users\RUBEN\Documents\sello-aptis" pull -q "C:\Users\RUBEN\dev\sello-aptis" main`.
