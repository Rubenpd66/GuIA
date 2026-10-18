@AGENTS.md

# Sello — Aptis ESOL General prep (unofficial)

Spanish-speaking B1/B2 learners aiming for C in Core, Reading, Listening, Writing and Speaking. Talk to the user in Spanish; code, identifiers and commits in English.

## Rules from the user (non-negotiable)

- Phased work: plan a phase, wait for approval, close it compiling, lint/type clean, tested, committed.
- Ask before installing packages, adding env vars, services or API keys. Never put keys in client code or the repo.
- All study content is ORIGINAL. Imitate the Aptis format, never copy British Council or commercial material. Books (`src/config/books.ts`) are only a coverage index and "Further study" references (book + unit). Extracted book text never enters the repo.
- Never invent official data (score thresholds, etc.).
- Unofficial site: visible non-affiliation notice, no British Council logo, name in branding or corporate colours.
- British English in all English content.
- The user wants no narration or screenshots: work quietly, verify with tests and the validator, report briefly.
- At the end of every phase or batch, add one line recommending the effort level for the next one (high: planning, hard debugging, phase 9 auth/keys; medium: routine code or content; low: mechanical edits).

## Status (update at each phase close)

- Phases 1 and 2 are done, committed and browser-checked. Phase 2 (Core) ran in batches 2a–2d: engine, trainers and progress tools; 65 grammar lessons with 336 questions (egu 143/145); 20 vocabulary groups with 276 entries and 300 Vocabulary items (75 per type); 120 functional phrases at `/functional-language`; 54 can-do statements B1–C1 shown in the syllabus and on linked lessons. Plans: `docs/superpowers/plans/2026-10-18-phase-2{a,b,c,d}-*.md`.
- Open: egu units 35 (probably "would", could go on `used-to-and-get-used-to`) and 41 (unassigned), and evu references for the vocabulary groups (the user chose none for now; evu coverage 2/101). Ask the user before adding references.
- Phase 3 (Reading) is in progress. The plan is approved: `docs/superpowers/plans/2026-10-18-phase-3-reading.md`.
  - Tasks 1–4 are done and committed: `src/lib/trainer/reading.ts`, `SortableList`, `HighlightableText` (+ `useHighlights`), and `ReadingTrainer` with `Reading1–4Task` wired into `/practice/[part]` (smoke-tested at 375 px in study mode for all four parts; the full Task 7 browser pass is still due).
  - Task 5 is done: 12/16/8/6 tasks in `content/exercises/reading-{1,2,3,4}/`, reviewed key by key and committed.
  - Task 6 is done: `/reading` shows the format, app exam times and strategies per part, with cohesion lessons linked from part 2.
  - **Resume at Task 7:** `format:check`, `build`, the full Playwright pass (375/1280, light/dark, ES/EN, keyboard and touch drag in part 2) and the phase close.
- Phases 3–9 follow the spec. Phase 8 still needs the owner's details for the legal notice and a favicon.ico.

## Commands

- `npm run check`: typegen + tsc, eslint, vitest, content validator. Run before every commit.
- `npm run validate:content`: Zod + cross-file checks on `content/`, prints book coverage and the Core bank size (warns below 5 questions per lesson).
- `npx vitest run <path>`: a single test file.
- Dev server: `.claude/launch.json` (`sello-dev`, port 3000).

## Map

- `content/`: JSON, one `kind` per file (`grammar-lessons`, `vocabulary-groups`, `vocabulary`, `exercises`, …). Schemas live in `src/lib/content/schemas/`. Authoring guide: skill `aptis-content`.
- `src/lib/content/`: `load.ts` (cached `getContent()`), `index.ts` (lookups), `validate.ts`, `markup.ts` (`**bold**`, `_italic_`, `==mark==`, gaps `___`), `localize.ts`.
- `src/lib/trainer/`: seeded RNG, session builders, scoring, reducer, exam timings (`config.ts`).
- `src/lib/progress/`: localStorage progress, mistakes bank, export/import.
- `src/app/[locale]/`: pages. `messages/{es,en}.json` must keep identical keys (tested).
- `docs/superpowers/`: spec (`specs/2026-10-18-sello-design.md`) and per-phase plans.

## Next 16 gotchas learned here

- `cacheComponents: true`: every dynamic route needs `generateStaticParams`. `dynamicParams` is unsupported, so read params inside `<Suspense>` and call `notFound()` for unknown ones.
- Server data uses `"use cache"` + `cacheLife("max")` (content only changes on deploy).
- `proxy.ts` replaces middleware. next-intl uses localized `pathnames`, `localeCookie: false`.
- `notFound()` inside `<Suspense>` returns status 200 with the not-found UI and `noindex` (documented streaming behaviour), not a 404.
- Content is cached with `cacheLife("max")`, so a running dev server keeps serving old content: restart it (`preview_stop` + `preview_start`) after adding content files, or new slugs show the generic title and not-found UI.
- Browser checks: the in-app browser pane pauses `requestAnimationFrame` while hidden, so Suspense content never reveals there. Use the Playwright tools (snapshots or `run_code`, no screenshots) and delete `.playwright-mcp/` afterwards.
- The next-themes "script tag" warning in dev comes from instant validation; it doesn't appear in production.
- Tailwind 4: tokens in `src/app/globals.css` (`@theme inline`, dark mode via `data-theme`). The contrast test parses that file.

## Environment

- Windows. This folder (`~/dev/sello-aptis`) is the working copy. `C:\Users\RUBEN\Documents\sello-aptis` is a mirror protected by Controlled Folder Access: sync it at phase close with PowerShell `git -C "C:\Users\RUBEN\Documents\sello-aptis" pull -q "C:\Users\RUBEN\dev\sello-aptis" main`.
- For bulk content drafting use the `content-writer` agent (Sonnet), then review and validate.
- Personal skills the user wants used (in `~/.claude/skills`):
  - `ponytail`: activate it at session start.
  - `tdd`, `diagnosing-bugs`, `ponytail-review` and `mp-code-review`.
  - `security-audit`: for phase 9.
  - `impeccable` and Emil Kowalski's skills (`emil-design-eng`, `review-animations`…): for UI polish. Impeccable's launcher downloads a binary on first run, so ask before running it.
  - These rules win over any skill.
- Code graph: `graphify update .` (local, no API cost) → `graphify-out/`; query with `graphify query "<question>"`.
