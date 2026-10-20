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

## Phase 10a (Levels and A2 content)

Committed, not deployed. Spec: `docs/superpowers/specs/2026-10-19-phase-10-tiers-design.md` (section 3). Plan: `docs/superpowers/plans/2026-10-19-phase-10a-levels.md`. No gating yet: that is 10b.

- Tiers: `src/lib/access/tiers.ts` (`TIERS` free/b1/b2/c1, `levelsFor`, `tierFor`, `canAccess`, display `PRICES` in cents; Stripe holds the charged prices from 10c).
- Every exercise already had `cefrLevel`; nothing was re-tagged. `TARGET_LEVELS` now starts at A2 (can-do and functional phrases).
- Validator report: `By level (A2 B1 B2 C1)` per part (questions for Core Grammar, items for Core Vocabulary, tasks otherwise) and `Mock gaps` (cumulative: a tier's mock draws from every unlocked level; needs in `MOCK_NEEDS`, `src/lib/trainer/config.ts`). Gaps are report lines, not warnings, so the fixture tests stay warning-free. Must read `none`.
- Placement: only exercises with `placement: true` reach the placement bank (`BANKS.placement`); 44 flagged (30 Core Grammar spread over levels and lessons, 3 Core Vocabulary, 3 Reading 1/3, 6 Listening 1, 2 Listening 2). `Placement gaps` must read `none`. In 10b these count as free for every tier.
- A2 content: 10 grammar lessons (orders 90–180) with 60 questions, 60 vocabulary entries (`content/vocabulary/a2-everyday.json`), 8 Core Vocabulary tasks, 18 can-do (`content/can-do/a2.json`), 20 functional phrases, and `a2.json` tasks in every Reading, Listening, Writing and Speaking part. No book references (user's OK needed).
- A2 Writing and Speaking tasks keep the schema's `b2` / `c` model labels (a plainer and a richer model).
- Gotcha: `a11y-behaviour.spec.ts` "the stamp only fades…" once timed out on `waitForLoadState` under the full suite; it passed 3/3 alone.

## Phase 10b (Access by tier)

Committed, not deployed. Plan: `docs/superpowers/plans/2026-10-19-phase-10b-access.md`. Spec section 4.

- Rule: `src/lib/access/rule.ts` (`tierFromRow` checks status and `current_period_end`, so access stops on time even if the webhook is late; `isVisible` / `visibleTo` for exercises, where `placement: true` is free; `entriesVisibleTo` for lessons, entries, phrases and flashcards; `lowestLevel` names the plan a lock notice offers).
- Data: `public.subscriptions` (migration `20261021120000_subscriptions.sql`, applied to `sello-dev` and `sello`): owner `select` only; no insert/update/delete for the Data API roles; the server writes it with the secret key (10c).
- Server: `getEntitlement()` (`src/lib/access/entitlement.ts`, React `cache()`, server-only) returns `free` without Supabase, a session or a readable row. Every caller sits inside `<Suspense>`.
- Client: `useTier()` and `<LockMark>` are cosmetic only. `<LockedNotice>` (with `compact` for lists) carries `data-paywall`, which the JSON-LD `hasPart` points to.
- Pages: grammar lessons render header and summary statically and the body through `GatedLessonBody` (A2 lessons in full, statically); vocabulary groups and functional language render A2 statically and the rest through `GatedEntries` / `GatedPhrases`, which load content themselves by slug. `/practice/[part]` filters exercises and phrases and adds a notice with the hidden count. `/banks/mock` and `/banks/flashcards` go through `bankFor` with `Cache-Control: private, no-store`; `/banks/placement` stays static.
- Offline and memory: `clearCachedPages()` drops `sello-pages-v1` on sign-out, account switch and account deletion; `useBank.ts` keeps its banks per session (`forgetBanks()`), and a `sessionWatcher` on `onUserChange` clears banks and cached pages whenever the user changes, however the session ends. Sign-in, sign-out and deletion end with a full page load (`window.location.assign`), so nothing filtered for the previous session stays in memory.
- A `placement` flag outside `PLACEMENT_PARTS` is a validator error (it would make a paid task free).
- `/plans` is a placeholder (prices from `PRICES`, noindex) until 10d.
- E2E: `e2e/access.spec.ts` checks whole responses (HTML and RSC data) for paid text. Gotcha: RSC data escapes quotes, so search for bare ids, never `"id"`. The signed-in B1 case skips without `SUPABASE_SECRET_KEY` (not in `.env.local`).
- Local testing as a subscriber: insert a row into `sello-dev`'s `subscriptions` for your user (`tier`, `interval`, `status: 'active'`, a future `current_period_end`) from the Supabase SQL editor.

## Phase 10c (Payments with Stripe)

Committed, not deployed. Plan: `docs/superpowers/plans/2026-10-19-phase-10c-stripe.md`. Spec section 5. The manual test-mode run (plan Task 9, step 2) is the user's.

- Stripe: package `stripe` 23.0.0 (exact). Hosted Checkout and Customer Portal only, so no Stripe.js and no card data; the CSP only gained `form-action` entries for `checkout.stripe.com` and `billing.stripe.com`.
- Catalogue (test mode, account `acct_1URsfkAutnhDsUep`): products Sello B1 `prod_VTK9ufkRQbds3B`, B2 `prod_VTK90S6EusWkBX`, C1 `prod_VTK9y6gEYoRVqw`; six EUR prices with `tax_behavior: inclusive` and lookup keys `sello_{b1,b2,c1}_{month,year}`; default Portal configuration `bpc_1USNVwAutnhDsUep1l8Oyeji` (upgrades immediate and prorated via `always_invoice`, downgrades and shorter intervals scheduled at period end, cancellation at period end). The code only knows lookup keys (`src/lib/stripe/plans.ts`).
- Flow: `startCheckout` / `openPortal` (`src/lib/stripe/actions.ts`) → Stripe; the return URL grants nothing. `POST /api/stripe/webhook` verifies the signature, re-reads the subscription and upserts `subscriptions` with the secret-key client (`src/lib/stripe/sync.ts` holds the pure logic: `rowFromSubscription`, `shouldReplace`, `subscriptionIdOf`, `isGoneUser`). Unknown subscriptions and deleted accounts answer 200; other failures 500 so Stripe retries.
- Gotcha: since API version Basil the billing period is on the item (`items.data[0].current_period_end`), not on the subscription.
- Decisions: Checkout gets `customer_email` (no customer is created before payment) unless the row already has `stripe_customer_id`; a late event of an older subscription never overwrites a newer live one; a learner with a live plan who clicks "Pay" is sent to the portal, not to a second Checkout.
- Account deletion (`deleteMyAccount`, `deleteUserAsAdmin`) calls `cancelStripeFor` first; if Stripe cannot be confirmed the account stays. The cancellation reads the `subscriptions` row, so a learner who paid seconds ago and whose webhook has not run yet would not be cancelled: rare, and the Stripe dashboard shows it.
- UI: `SubscribeButtons` on `/plans` (placeholder until 10d), `PlanSection` and `CheckoutNotice` on the account page. Admin shows subscribers per plan and an estimated monthly income. Terms have a "Plans and payments" section; privacy and `docs/legal/README.md` name Stripe.
- Local testing: put `STRIPE_SECRET_KEY` (test) in `.env.local`, run `stripe listen --forward-to localhost:3000/api/stripe/webhook` and put the printed `whsec_…` in `STRIPE_WEBHOOK_SECRET`; test card `4242 4242 4242 4242`.
- Production needs: live products with the same lookup keys, a live Portal configuration, a webhook endpoint at `https://<site>/api/stripe/webhook` with `checkout.session.completed` and `customer.subscription.created|updated|deleted`, `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in Vercel, and the owner's tax and legal steps (`docs/legal/README.md`).
- Final review (Opus, 2026-10-19): fixed an unreadable row in the webhook being treated as "no row" (now 500, Stripe retries), an unreadable row in the payment actions being treated as "no plan" (now `failed`, never a second Checkout), and the account-deletion text now warns that a paid plan is cancelled without refund. Deferred minors: read-then-upsert in the webhook is not atomic (a SQL function would make it so); a second live subscription from two tabs is only logged at info and `cancelStripeFor` would not cancel it (search Stripe by `metadata['user_id']`); `openPortal` does not validate `locale`; the account page does not show `cancel_at_period_end`, the end date or `past_due`, and past subscribers cannot reach old invoices (10d); `deleteUserAsAdmin` gives no feedback when the Stripe cancellation fails; for the lawyer: confirming the withdrawal waiver on a durable medium (arts. 98.7 / 99.2 TRLGDCU) and Stripe's role as independent controller for fraud and regulatory purposes.

## Phase 10d (Plans page)

Committed, not deployed. Plan: `docs/superpowers/plans/2026-10-19-phase-10d-plans-page.md`. Spec section 6. 10e restyles it.

- Page `/planes` / `/plans` (`src/app/[locale]/plans/page.tsx`): static catalogue plus small dynamic holes. Figures per plan come from the content (`planFigures`, `levelCatalogue`, `offersFor` in `src/lib/access/figures.ts`), so adding content changes the page without code edits.
- Cards (`PlanCards`, `PlanButton`): interval toggle made of native radios (default yearly), `?nivel=` marks one card (`parseLevelParam`, unknown values ignored). The button per situation is the pure `buttonFor` in `src/lib/access/plan-button.ts`: the A2 card always says "Start free"; a paid card says create account (visitor), subscribe (signed in without plan), current plan, included in your plan (lower than theirs) or change plan (portal). A learner whose plan has ended counts as free, because `useTier()` applies `tierFromRow`.
- Sign-in comes back: `SignInPanel` now accepts `?next=` (same-site only, via `safeNext`) for Google, sign-up, magic link and password sign-in; the plans page uses it so "Create account and subscribe" returns to `/plans`.
- `LevelCatalogue` (ARIA tabs A2–C1: lesson titles, vocabulary groups, tasks per part; titles and counts only, never paid text) and `PlansFaq` (native `<details>`). `Product` JSON-LD with a monthly and a yearly `Offer` per paid plan. The page is indexable; the sitemap already listed it.
- Links: top bar (hidden below 480 px) and footer.
- Account page: `useSubscriptionState()` shares one query with `useTier()` for the whole page load; `PlanSection` shows when a cancelled plan ends, a past-due warning, and "Past invoices" for former subscribers that have a Stripe customer.
- Ruling: the spec says the A2 card reads "Included in your plan" for a subscriber; the plan keeps "Start free" on A2 for everyone (it is a link into the app, still useful to a subscriber). `included` only appears if a lower paid card exists (B1 shows it to a B2 or C1 subscriber).
- E2E: `e2e/plans.spec.ts` (visitors, toggle, `?nivel=`, JSON-LD; the B1 subscriber case skips without `SUPABASE_SECRET_KEY`).
- Final review (Opus, 2026-10-19): fixed the shared subscription read (`createRowCache` in `src/lib/access/row-cache.ts`: a failed read is "unknown", is not kept, and reads expire after 30 s, so a plan bought a moment ago shows up without a reload), the plans lead now says all prices include VAT (it is also the Product description), and "Your current plan" / "Included in your plan" are text instead of disabled buttons so keyboard users reach them. Deferred minors: "20 %" in `Plans.saveNote` is typed, not derived from `PRICES`; Product JSON-LD lacks `image`, `priceValidUntil` and a billing period (`priceSpecification`) — for the 10e SEO pass; signing in from a plan card loses `?nivel=` and the chosen interval; `safeNext` has no length cap, so a crafted `next` over 200 characters ends in a generic form error; the level catalogue lists exam parts in content order, not exam order; the top-bar plans link hides below 480 px (the plan said 360 px; the footer has it).

## Phase 10e (Redesign, copy, SEO)

Plan `docs/superpowers/plans/2026-10-20-phase-10e-redesign.md`; context in `PRODUCT.md`, `DESIGN.md`, `.impeccable/` (direction round, surface brief, `design.json`), audit `docs/design/10e-audit.md`, SEO notes `docs/design/10e-seo.md`. Built and committed, not deployed.

- Product renamed to **GuIA** (`SITE.name`). Internal names kept on purpose so nothing breaks: `sello:*` storage keys, export marker `app: "sello"` (`not-sello` error), Stripe lookup keys `sello_*`, repo and URL. The Stripe test products still carry the old name until renamed (needs the user's OK); the user renames the URL and the Vercel and Supabase projects, then `SITE.url` changes.
- Direction: category standard on purpose (the user chose it over the rolled worlds), quality bar Busuu and Brilliant. Tokens in `globals.css` (canvas, surface, ink, accent, success, danger, reward, level-*), Figtree only, radius 12/16, rhythm via `SectionStack`/`Section`, `Card`, `ProgressBar`, `Wordmark`; living guide at `/design`.
- Motion (CSS only, no packages): `.pressable`, `.enter`, `.enter-stagger`, `.feedback-*`, `.progress-fill`, bottom `.sheet`, nav indicator, `<ViewTransition>` page swap and lesson title morph, `.achievement` reward. Every animation has a reduced-motion alternative.
- Passport components and `src/lib/passport` are gone; `Achievement` replaces the stamp (`AchievementLevel` lives in `src/components/progress/Achievement.tsx`). `Perforations` became `QuestionProgress`.
- Icons are generated by `npx tsx scripts/make-icons.tsx` (also `favicon.ico`, which the PWA e2e requires).
- SEO: canonical and hreflang on every indexable page (`src/lib/seo/alternates.ts`); keyword clusters and article proposals are in `docs/design/10e-seo.md` (no write-ups until the user chooses).
- Gotchas: the e2e reuses any server already on port 3100 (kill it first, or it tests an old build); tinted chips must be tested over `surface` (6 % tint); no Python in the Bash tool, use node scripts; long heredocs with quotes break, use the Write tool.
- Final Opus review: no critical findings; important ones fixed (reduced motion on view-transition groups, nav chrome given its own transition layer and `pointer-events: none` on the transition), plus minors (offline page colours, recording file name, `hover-fine` on the language switcher, badge contrast pairs).
- Deferred minors: old names inside code and message keys (`stampLabel`, `noStamp`, `passportTitle`, `PassportSlot`, tone names `entry`/`refusal` in `GapSentence`, "spine" comments, `importNotSello`); `alternates.ts` takes `string` instead of a typed pathname; `default="page-swap"` on the layout `ViewTransition` may also fire on Suspense reveals and action state (not checked in a browser).
- Not done: Lighthouse baseline and comparison (Lighthouse is not installed and `npx` would download it: ask first), a `break-ui` worst-case pass, and the user's visual check of lessons, trainers, dashboard and plans (checkpoints only covered `/design` and the home).

## Phase 10e.2 (Interactive passport, plans on the home page, 3D, speed)

Requested on 2026-10-20 while the user was away ("no me hagas ninguna consulta"); plan `docs/superpowers/plans/2026-10-20-phase-10e2-passport-3d.md`. Built and committed, not deployed.

- Home: title, lead, CTAs and the **3D language passport** (`src/components/passport/LevelPassport.tsx`, CSS `.passport*` in `globals.css`), then the plan cards (monthly first everywhere) and a link to `/plans`. The benefit cards, steps and the 18 parts left the home page (the parts stay on `/practica`).
- The passport: GuIA booklet in the accent colour; pointer tilt while closed; the cover turns on its spine (`rotateY(-112deg)` on phones, the full spread from 640 px, where the booklet slides right by 50 %). Inside: highest level (marked skills win; Writing/Speaking self-assessment counts only when nothing else has a level, and says so), level and percent per skill, last exam-mode attempt, link to the dashboard or the placement test. Data: `passportSummary` in `src/lib/estimate/passport.ts` (tested). Focus moves into the page on open and back to the cover on close; the closed inside page is `inert` and `visibility: hidden`. Reduced motion: crossfade.
- Dashboard: "Tu pasaporte de idiomas" section with the same passport, open by default when there is data.
- 3D elsewhere: `Tilt` (`src/components/ui/Tilt.tsx`) on plan, practice-part, syllabus and vocabulary cards (mouse only, motion-safe); flashcards turn over in 3D (both faces in one grid cell, the back fills in as it turns so screen readers announce it); the achievement badge turns like a coin.
- Speed: the Supabase client and the sync engine load on demand (`src/lib/supabase/lazy.ts`), and browser-side schemas use `zod/mini` with plain constants in `src/lib/content/levels.ts` (content schemas re-export them). Home initial JS went from about 1.04 MB to 731 KB (raw). Lighthouse still not run (not installed).
- Cleanup: `stampLabel`/`noStamp`/`passportTitle`/`passportLead` became `levelLabel`/`noLevel`/`achievementsTitle`/`achievementsLead`; `GapSentence` tones are `success`/`danger`; unused keys removed; `alternatesFor` throws on an unknown pathname.
- 10f: draft design in `docs/superpowers/specs/2026-10-20-phase-10f-ai-feedback-design.md`; nothing built (needs provider, key, caps and a migration OK).
- Review (Opus, fresh): fixed the clipped passport button, focus order/return, 48 px close, invisible focus under reduced motion, flashcard announcements, lazy-load failures (offline), self-assessed "highest" level, mirrored coin, tilt measuring.
- Deferred minors: on the dashboard the passport may open by itself when data arrives later (after sign-in sync); below 640 px only a sliver of the open cover shows; `Tilt` keeps its first measurement while the page scrolls under the pointer; the layout `ViewTransition` may also run on Suspense reveals and form actions.

## Phase 10f (AI feedback on Writing)

Plan `docs/superpowers/plans/2026-10-20-phase-10f-ai-feedback.md`; spec `docs/superpowers/specs/2026-10-20-phase-10f-ai-feedback-design.md`. Built and committed, not deployed. User decisions (2026-10-20): Claude Haiku 5.5, Writing only, caps B1 10 / B2 20 / C1 40 a month (no roll-over, UTC month), global spend cap 20 USD (`src/config/ai.ts`), cut off for everyone when reached.

- Server action `requestFeedback` (`src/lib/ai/actions.ts`) and `feedbackQuota`. Order: config, session, tier (`getEntitlement`), consent, input (task id looked up in `content/`, keys must belong to the task, 4,000 characters per text, task level must be within the plan), reserve one use, call the model with `messages.parse` + `zodOutputFormat`, settle tokens. Any failure (throw, refusal, `max_tokens`, unparsable output) releases the use. The Anthropic client is `src/lib/ai/server.ts` (`ANTHROPIC_API_KEY`, server only; without it the feature answers `unavailable`).
- Pure helpers in `src/lib/ai/feedback.ts` (schema, `tidy` limits, prompt, cost). Learner texts go in `<text key>` blocks and the system prompt says they are data. The result is rendered as plain text.
- Migration `20261022120000_ai_usage.sql`: `ai_usage` (counts and tokens only, RLS owner-read) plus `ai_reserve` / `ai_settle` / `ai_release`, executable only by `service_role`. The reserve is atomic (upsert with `where uses < cap`). **Applied to `sello-dev` only**; `sello` gets it at deploy time. Output columns of `ai_reserve` are `out_*` because `month`/`uses` clashed with table columns (found by the SQL check).
- UI: `src/components/writing/FeedbackPanel.tsx` on the review screen of the trainer (not in the mock exam). Signed out: sign-in link; free: plans link; paid: consent checkbox (remembered in `sello:ai-consent`), button, uses left, result (criteria, corrections, improved text). Copy under `Writing.feedback`, plan cards show the cap, privacy and terms have an AI section.
- Open for the user: create `ANTHROPIC_API_KEY` (`.env.local`, then Vercel) and run the manual test; **check the privacy wording against Anthropic's current terms** (retention, international transfer, data processing agreement: not written from memory, and the "contract with these providers" sentence does not cover Anthropic until confirmed); apply the migration to `sello`; confirm the Haiku 5.5 price on Anthropic's site (the figure comes from the API skill's table dated 2026-10-06).
- Shortcut: requests in flight are not counted against the budget, so it can overshoot by a few cents.
- Switched off without the key (user, 2026-10-20: no costs before income): `aiEnabled()` (`src/lib/ai/enabled.ts`) hides the panel, the plan-card line and the terms section when `ANTHROPIC_API_KEY` is not set at build time. Privacy keeps its AI section (it only applies if you ask). The e2e follows whether `.env.local` has the key.
- Review (Opus, 2026-10-20): no blocking findings. Minor, accepted: once the consent box is ticked it cannot be unticked in the UI (consent here is a notice, the legal basis is 6.1.b); `ai_usage` is not in the account data export.
- Preview deploy (user OK, 2026-10-20): https://sello-aptis-498btzpxl-rubenpd66-6093s-projects.vercel.app, behind Vercel Authentication; share it with the dashboard's Share link. Production unchanged.
