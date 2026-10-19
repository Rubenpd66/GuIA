# Sello — phase history (1–8)

Moved out of `CLAUDE.md` to keep the always-loaded context small. Read the relevant phase when you touch that area. Current work (phase 9) is tracked in `CLAUDE.md`.

## Phases 1 and 2

- Phases 1 and 2 are done, committed and browser-checked. Phase 2 (Core) ran in batches 2a–2d: engine, trainers and progress tools; 65 grammar lessons with 336 questions (egu 143/145); 20 vocabulary groups with 276 entries and 300 Vocabulary items (75 per type); 120 functional phrases at `/functional-language`; 54 can-do statements B1–C1 shown in the syllabus and on linked lessons. Plans: `docs/superpowers/plans/2026-10-18-phase-2{a,b,c,d}-*.md`.
- Open: egu units 35 (probably "would", could go on `used-to-and-get-used-to`) and 41 (unassigned), and evu references for the vocabulary groups (the user chose none for now; evu coverage 2/101). Ask the user before adding references.

## Phase 3 (Reading)

Done, committed and browser-checked (375/1280, light/dark, ES/EN, keyboard and touch drag). Plan: `docs/superpowers/plans/2026-10-18-phase-3-reading.md`.

- Logic in `src/lib/trainer/reading.ts`; `ReadingTrainer` and `Reading1–4Task` in `src/components/reading/`, mounted at `/practice/reading-1…4`; `/reading` has the format, app exam times (4/8/8/15 min, an app decision) and strategies.
- Bank: 12/16/8/6 tasks in `content/exercises/reading-{1,2,3,4}/`, reviewed key by key.
- `SortableList` drags listen on `window` (touch events stop reaching the handle once the row moves in the DOM); keep that if you touch it.

## Phase 4 (Listening)

Done, committed and browser-checked (stubbed `speechSynthesis`, 375/1280, light/dark, ES/EN, no-API fallback). Plan: `docs/superpowers/plans/2026-10-19-phase-4-listening.md`.

- Audio is the browser's `speechSynthesis` (no service, no keys): `src/lib/audio/` (`plan.ts` splits scripts and picks man/woman voices by name heuristic, `useSpeech.ts`, `settings.ts` stores speed and voices in `sello:listening-voice`, not in progress/export). `audio.src` stays in the schema but playing files is not implemented.
- Logic in `src/lib/trainer/listening.ts`; `ListeningTrainer`, `Listening1–4Task`, `AudioPlayer`, `Transcript` in `src/components/listening/`, mounted at `/practice/listening-1…4`; `/listening` has the format and strategies; voice settings in `/settings`.
- App decisions: exam mode allows 2 plays per recording, no countdown, 5 tasks in part 1; study mode has no limit. A play counts when it starts.
- Bank: 16/6/8/6 tasks in `content/exercises/listening-{1,2,3,4}/`, reviewed key by key (part 4 options were shuffled after drafting: agents put every answer at index 0). The validator warns on script length and errors when a part 4 `cue` is not in the script.
- Check agent drafts for answer position: they tend to put the right option first.

## Phase 5 (Writing)

Done, committed and browser-checked (375/1280, light/dark, ES/EN, keyboard, fake-clock time-up, blocked storage). Plan: `docs/superpowers/plans/2026-10-19-phase-5-writing.md`.

- Logic in `src/lib/trainer/writing.ts` (`wordStatus`, `writingItems`, `annotatedSegments`, `RUBRIC_CRITERIA`, `buildWritingSession` resumes a task with a draft); drafts in `src/lib/writing/drafts.ts` (`sello:writing-drafts`, max 60, cleared when the self-assessment is saved); `recordAttempt` in progress saves an attempt without touching mistakes.
- UI in `src/components/writing/` (`WritingTrainer` holds the four parts in one component, `WritingEditor`, `ModelAnswers`, `Checklist`, `PhrasePanel`); `/writing` page; `/practice/writing-1…4`.
- App decisions: own 4-criterion rubric (not official), exam = one task in the recommended minutes and the editor locks at zero, study has tips, useful phrases and an optional stopwatch, no spellcheck in the editor.
- Bank: 8/10/8/6 tasks in `content/exercises/writing-{1,2,3,4}/`, reviewed one by one; the validator prints Writing task counts.

## Phase 6 (Speaking)

Done, committed and browser-checked (simulated microphone via an AudioContext oscillator, refused microphone, fake clock, 375/1280, light/dark, ES/EN, keyboard). Plan: `docs/superpowers/plans/2026-10-19-phase-6-speaking.md`.

- Logic in `src/lib/trainer/speaking.ts`: `speakingTurns` (part 4 is one turn for its three questions), the turn reducer (reading → ready (study) → preparing (part 4) → answering → done), `modelWordRange` (2.2 words/s, an app decision; the validator warns), `SPEAKING_RUBRIC`. Timings in `SPEAKING_PART_EXAM`.
- Recording: `src/lib/speaking/recorder.ts` (MediaRecorder, one in-memory recording per turn, object URLs revoked, mic asked at session start via `prepare()`, a refusal is final, `stop()` during the prompt cancels the take) and `useRecorder`. Nothing is uploaded or stored; Download is the only way out.
- Scenes: ids and descriptions in `src/lib/speaking/scenes.ts` (the schema only accepts these ids); drawings in `src/components/speaking/scenes/` (`parts.tsx` primitives in theme tokens). 16 scenes; only their geometry was checked by script, not their look.
- UI: `SpeakingTrainer` (all four parts), `AnswerTimer`, `RecordingPlayer`, `SpeakingModels` (listen with `useSpeech`, which now takes an `onEnd`), `MicCheck`; `/speaking` page; `Checklist` now lives in `src/components/trainer/` and is shared with Writing.
- App decisions: own 4-criterion rubric, exam reads the question with the synthetic voice (5 s silent reading without a voice, and a cap if the voice never ends), recording and time start and stop on their own, no retries; study waits for the learner, allows retries and shows structure, tips, phrases and models.
- Bank: 10/6/5/5 tasks in `content/exercises/speaking-{1,2,3,4}/`, reviewed one by one.

## Phase 7 (Mock exam, dashboard)

Done, committed and browser-checked in batches 7a–7d (375/1280, light/dark, ES/EN, keyboard, fake clock, reload mid-section). Plan: `docs/superpowers/plans/2026-10-19-phase-7-mock-dashboard.md`.

- Estimates in `src/lib/estimate/`: `level.ts` (app bands C ≥ 85 %, B2 ≥ 70 %, B1 ≥ 55 %, A2 ≥ 40 %; last 10 attempts, recent and exam weigh more; enough data = 2 attempts, one exam attempt or 10 Core items), `activity.ts` (local days, streak, minutes this week), `next.ts` (suggestions: mock when the exam is ≤ 14 days away, untried part, weakest part, mistakes), `levelUps.ts` (new-stamp notice, held during placement/mock and on import).
- Stores via `src/lib/storage/localStore.ts`: `sello:exam-date`, `sello:flashcards`, `sello:mock`. All three travel in export/import (`src/lib/progress/extras.ts`; damaged extras are dropped, old files still import). Days use the `LocalDay` schema.
- Pages: `/dashboard` (passport of 18 stamps, skill levels, pace, weak points, next task, countdown), `/mistakes`, `/flashcards` (SM-2 in `src/lib/flashcards/`, vocabulary + functional phrases, new cards per day in Settings), `/placement-test`, `/mock-exam`.
- Placement and mock reuse the trainers' exported sessions (`GrammarSession`, `VocabularySession`, `ReadingSession`, `ListeningSession`, `WritingSession`/`SpeakingSession` with `onSaved`) through `src/components/assessment/AssessmentRunner.tsx` and `steps.ts`. Mock state is rebuilt from its seed; a reload keeps the section clock but restarts its answers and Listening plays (marked `shortcut:`).
- Stamp animation: `Stamp animate` (CSS `stamp-drop` in `globals.css`, a fade with reduced motion).
- Fixed in passing: `useSpeech` read speech support during render, which broke hydration on Settings.

## Phase 8 (Polish, deploy)

Done and deployed: https://sello-aptis.vercel.app (Vercel project `sello-aptis`, account rubenpd66-6093, no Git connection). Plan: `docs/superpowers/plans/2026-10-19-phase-8-polish-deploy.md`.

- E2E: `npm run e2e` (Playwright against `next build && next start -p 3100`, projects mobile + desktop): axe on every route in light/dark, interactive states, reflow at 320 px, focus and reduced motion (`e2e/a11y*.spec.ts`), PWA (`e2e/pwa.spec.ts`) and main flows (`e2e/flows.spec.ts`). Not part of `npm run check`. Stop any server on port 3100 first, or Playwright reuses an old build.
- Performance: production Lighthouse mobile 90–97, a11y/best practices/SEO 100. Banks for the mock exam, placement test and flashcards are static JSON at `/banks/<name>` (`src/app/banks/[name]/route.ts`, `src/lib/content/banks.ts`, `useBank`/`loadBank`), excluded from the locale proxy; the mock and placement only fetch them when a run starts. Fonts: latin subset; Literata upright only (`display: optional`, no preload). Client-only views sit in a `min-h` box to avoid layout shift. Guilloche paths use one decimal.
- SEO: `SITE.url` in `src/config/site.ts`; `metadataBase` and Open Graph defaults in the locale layout; `src/app/sitemap.ts` (hreflang pairs via `src/lib/seo/sitemap.ts`), `robots.ts`, `[locale]/opengraph-image.tsx`, JSON-LD (`components/seo/JsonLd`) on home and lessons.
- Legal: owner details in `SITE.owner` (name, NIF, address, email, published at the user's request); privacy page lists local storage, microphone and Vercel logs.
- PWA: `src/app/manifest.ts`, `public/sw.js` (network first for pages, RSC and banks; cache first for `/_next/static`; inline offline page), `ServiceWorker` registers it in production and offers a reload on update. Icons from `scripts/make-icons.ts`.
- Deploy: `npx vercel deploy --prod --yes` from this folder (in PowerShell use `npx.cmd`: the execution policy blocks `npx.ps1`). `vercel link` wrote a token to `.env.local` (ignored by git).

## Phase 9 (Accounts, admin, security, legal)

Committed, not deployed (the user audits it first). Plan: `docs/superpowers/plans/2026-10-20-phase-9-accounts-security.md`.

- Supabase projects: `sello` (production) and `sello-dev` (local and tests), both eu-central-1. Migrations in `supabase/migrations/`: `user_data` (owner-only RLS, size check), `rls_auto_enable` lock, `admin_log` (RLS on, no policy, no grants; the advisor's "RLS enabled, no policy" INFO on it is intended).
- Auth: server actions in `src/lib/auth/actions.ts` (answers never reveal whether an email exists; password minimum 10; sign-up needs the 14+/privacy/terms box), callback route `src/app/auth/callback/route.ts` with `safeNext` against open redirects, `useUser` store, session refresh in `src/proxy.ts` (only when a session cookie exists; `/admin` skips next-intl).
- UI: `src/components/account/` (`SignInPanel`, `AccountPanel`, `AuthForm`, `AccountLink`, `SyncRunner`).
- Sync: `src/lib/sync/engine.ts` pushes 2 s after a change and pulls on sign-in, on tab focus and when back online; per-store last-change time in `sello:sync-meta`; status in `status.ts`. Merge rules in `merge.ts` are unit-tested; the engine itself is not. `owner.ts` records which account the browser's data belongs to (`sello:sync-owner`): a different account signing in on the same browser first clears the local study data and writing drafts, so a shared device never mixes two learners; deleting an account releases the owner (security review, 2026-10-19).
- Admin: `/admin` outside the locale tree, noindex, `requireAdmin()` on every page and action (`getClaims` plus `app_metadata.role`), aggregates only, user list with search and deletion; deletions logged in `admin_log` (ids only).
- Security: headers and CSP in `next.config.ts` (HSTS, nosniff, referrer policy, microphone self only, `frame-ancestors 'none'`). `npm audit --omit=dev` found 0 vulnerabilities and the secret key is not in the client bundle (checked in `.next/static`).
- Legal: privacy (account-aware), terms and cookies pages in es/en; `docs/legal/README.md` holds the processing register and the owner's to-do (accept the DPAs, professional review).
- E2E: `e2e/accounts.spec.ts` (admin hidden, headers, sign-in form; round trip with a throwaway user when `SUPABASE_SECRET_KEY` is exported).
