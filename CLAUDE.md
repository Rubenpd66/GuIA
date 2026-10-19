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
- At the end of every phase or batch, add one line with the model and effort for the next one (see "Model and effort").

## Status (update at each phase close)

- Phases 1–8 are done, committed and deployed at https://sello-aptis.vercel.app (Vercel project `sello-aptis`, account rubenpd66-6093, no Git connection). Detail per phase, with the files, app decisions and gotchas, is in `docs/status.md`: read the phase you are touching before changing it. Plans: `docs/superpowers/plans/`.
- Open from phase 2: egu units 35 (probably "would", could go on `used-to-and-get-used-to`) and 41 (unassigned), and evu references for vocabulary groups (the user chose none for now; evu coverage 2/101). Ask before adding references.
- **Phase 9 (Supabase accounts, admin, security, GDPR) is approved and in progress.** Plan: `docs/superpowers/plans/2026-10-20-phase-9-accounts-security.md`, batches 9a–9d. AI feedback and payments are phase 10; redesign and content SEO come at its end.
  - Done and committed: 9a (Supabase clients, session proxy, `user_data` table with RLS in `sello` and `sello-dev`, sync merge rules).
  - In 9b the auth server actions, callback route and `useUser` exist. Still to do: `/acceso` and `/cuenta` pages, nav link, sync engine, es/en messages, then the user setup guide (Auth URLs, Google OAuth, `SUPABASE_SECRET_KEY` in Vercel only).
  - Then 9c (admin) and 9d (headers/CSP, legal pages, audit, E2E). For the 9d audit use the Strix skills and ask before running a scan.

## Model and effort

Default: `opusplan` + effort medium (Opus plans, Sonnet executes). The model and effort are changed by the user (`/model`, `/effort`), so name the change in one line when it matters.

- Opus + high: planning a phase, `grilling`, auth/keys/RLS/CSP/audit (9c, 9d), hard debugging, final review of a phase.
- Sonnet + medium: routine code, pages, messages, tests, content review.
- Sonnet/Haiku + low: mechanical edits, mirror sync, commits.
- Save tokens: `graphify query` before reading files, `Explore` for wide searches, bulk content to `content-writer`, `handoff` when closing a long session.

## Commands

- `npm run check`: typegen + tsc, eslint, vitest, content validator. Run before every commit.
- `npm run validate:content`: Zod + cross-file checks on `content/`, prints book coverage, the Core bank size and the Listening task counts (warns below 5 questions per lesson).
- `npx vitest run <path>`: a single test file.
- `npm run e2e`: Playwright against a production build on port 3100; not part of `check`.
- Dev server: `.claude/launch.json` (`sello-dev`, port 3000).

## Map

- `content/`: JSON, one `kind` per file (`grammar-lessons`, `vocabulary-groups`, `vocabulary`, `exercises`, …). Schemas live in `src/lib/content/schemas/`. Authoring guide: skill `aptis-content`.
- `src/lib/content/`: `load.ts` (cached `getContent()`), `index.ts` (lookups), `validate.ts`, `markup.ts` (`**bold**`, `_italic_`, `==mark==`, gaps `___`), `localize.ts`.
- `src/lib/trainer/`: seeded RNG, session builders, scoring, reducer, exam timings (`config.ts`).
- `src/lib/progress/`: localStorage progress, mistakes bank, export/import.
- `src/app/[locale]/`: pages. `messages/{es,en}.json` must keep identical keys (tested).
- `docs/superpowers/`: spec (`specs/2026-10-18-sello-design.md`) and per-phase plans. `docs/status.md`: phase history.

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
- In PowerShell use `npx.cmd` (the execution policy blocks `npx.ps1`).
- For bulk content drafting use the `content-writer` agent (Sonnet), then review and validate.
- Personal skills the user wants used (in `~/.claude/skills`; unrelated or duplicate ones were moved to `~/.claude/skills-archive`, restore from there if needed; the claude-mem plugin is disabled in `~/.claude/settings.json`):
  - `ponytail`: activate it at session start.
  - `tdd`, `diagnosing-bugs`, `ponytail-review` and `mp-code-review`.
  - `security-audit`: for phase 9.
  - `impeccable` and Emil Kowalski's skills (`emil-design-eng`, `review-animations`…): for UI polish. Impeccable's launcher downloads a binary on first run, so ask before running it.
  - These rules win over any skill.
- Skill per task:
  - Plans: superpowers (`brainstorming`, `writing-plans`, `executing-plans`); `grilling` to stress-test them.
  - Code: `ponytail` always, plus `tdd`; `source-driven-development` for Next 16 (docs in `node_modules/next/dist/docs`).
  - Bugs: `diagnosing-bugs`. Review: `ponytail-review`, `mp-code-review`; `thermos` for branch reviews.
  - UI: `impeccable`, `ui-ux-pro-max` (run its search script, ask before running anything that needs network) and Emil's skills.
  - Content: `aptis-content` and the `content-writer` agent; `humanizer` for marketing copy. SEO: `searchfit-seo`.
  - Security and law: `security-audit`, `gdpr-data-handling`, `auth-implementation-patterns`; Strix skills for scans (ask first). Data: `postgresql-table-design` and Supabase's skills.
  - Payments: `stripe-integration`, `billing-automation`.
  - Closing a long session: `handoff`.
- Code graph: `graphify update .` (local, no API cost) → `graphify-out/`; query with `graphify query "<question>"`.
- Headroom (Python CLI/proxy) is not installed; needs the user's OK.
