# Phase 10b: Access by Tier Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Content above A2 reaches a browser only when the signed-in learner's subscription unlocks its level; everyone else sees a preview and a lock that points to the plans.

**Architecture:** One pure rule (`tierFromRow`, `visibleTo`) decides access, shared by the server (`getEntitlement()`, reads the session and the learner's `subscriptions` row) and the browser (`useTier()`, cosmetic lock marks only). Pages keep their static shell (titles, levels, previews, A2 content); everything above A2 renders inside a `<Suspense>` hole that reads the session and loads the content itself by slug, so paid text is never in prerendered HTML. Trainers, banks and phrase lists are filtered on the server with the same rule.

**Tech Stack:** Next 16 (`cacheComponents`, session reads behind `<Suspense>`, see `node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md`), Supabase (`@supabase/ssr`, RLS), next-intl, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-19-phase-10-tiers-design.md` (section 4; tiers from section 1).

## Global Constraints

- Tiers: `free` = A2 (no account needed), `b1`, `b2`, `c1`; each unlocks its level and every level below (`levelsFor` in `src/lib/access/tiers.ts`).
- Exercises with `placement: true` are free for every tier.
- Active states: `active`, `trialing`, `past_due` with `current_period_end` in the future → the row's tier; anything else (no session, no row, other status, period over) → `free`.
- `subscriptions` is readable only by its owner (RLS `select` for `authenticated`), never writable by the Data API roles; only the server with the secret key writes it (10c).
- Paid content is never passed as `children` or props from the static part into the gated part: the gated component loads it itself.
- A session read (`cookies()`, `getClaims`) always sits inside `<Suspense>` (a build error otherwise) and never inside plain `"use cache"`.
- Gated responses (`/banks/mock`, `/banks/flashcards`) send `Cache-Control: private, no-store`.
- Ask the user before applying migrations to `sello-dev` or `sello` (Supabase MCP `apply_migration`).
- No new packages or env vars. `messages/es.json` and `messages/en.json` keep identical keys. British English.
- `npm run check` passes before every commit.

## Review Focus

1. A learner whose subscription just ended (period over, status still `active` in the row because 10c's webhook has not run yet): access must drop at `current_period_end`, not wait for the webhook. Pinned by a `tierFromRow` test (Task 2).
2. Paid text leaking through the RSC payload rather than the HTML (a prop serialised from the static part): the e2e checks the whole response body of a B1 lesson and of `/banks/mock`, including the flight data (Tasks 6 and 9).
3. Supabase not configured (no env vars, e.g. a local build): everything above A2 stays locked and nothing throws. Pinned by a `getEntitlement` guard and the e2e run without keys (Tasks 4 and 11).
4. Mistakes bank links into `/practice/[part]?…` with item keys of locked tasks after a downgrade: the trainer must show only unlocked items and the lock notice, not crash. Pinned by a `visibleTo` test with `onlyKeys`-style input and the trainer's existing empty state (Task 8).
5. A shared browser after sign-out still holding paid pages in the service worker cache: sign-out and an account switch clear the pages cache (Task 10).

---

### Task 1: Placement pool fixes (deferred from 10a)

**Files:**
- Modify: `src/lib/content/validate.ts` (warning), `src/lib/content/validate.test.ts`
- Modify: `src/lib/content/banks.test.ts`
- Modify: `content/exercises/core-vocabulary/a2.json`, `content/exercises/reading-1/a2.json`, `content/exercises/listening-2/a2.json` (add `"placement": true` to `cv-a2-usage-1`, `r1-a2-1`, `l2-a2-1`)

**Interfaces:**
- Produces: `PLACEMENT_PARTS: readonly ExamPart[]` = `["core-grammar", "core-vocabulary", "reading-1", "reading-3", "listening-1", "listening-2"]` exported from `src/lib/content/banks.ts`; a warning `"placement" has no effect on <part>; it would only make the task free` for flagged exercises of any other part.

- [ ] **Step 1: Write the failing tests**: in `validate.test.ts`, `"warns about a placement flag on a part the placement test never uses"` (a writing-2 fixture with `placement: true` → one warning whose message contains `writing-2`); in `banks.test.ts`, extend the test so a flagged and an unflagged `listening-1` fixture give `BANKS.placement(index).listening1` with only the flagged id.
- [ ] **Step 2: Run** `npx vitest run src/lib/content` → the two tests fail.
- [ ] **Step 3: Implement** `PLACEMENT_PARTS`, use it in `placementOf`'s callers, add the warning; flag the three A2 exercises.
- [ ] **Step 4: Run `npm run check`** → pass; validator `Placement gaps: none`, 0 warnings.
- [ ] **Step 5: Commit** `fix(placement): warn on flags the test never uses; A2 items in the pool`.

### Task 2: The access rule

**Files:**
- Create: `src/lib/access/rule.ts`, `src/lib/access/rule.test.ts`

**Interfaces:**
- Consumes: `Tier`, `levelsFor` from `tiers.ts`; `CefrLevel`.
- Produces:
  - `type SubscriptionRow = { tier: "b1" | "b2" | "c1"; status: string; current_period_end: string }`
  - `tierFromRow(row: SubscriptionRow | null, now: number): Tier`
  - `isVisible(tier: Tier, item: { cefrLevel: CefrLevel; placement?: true }): boolean`
  - `visibleTo<T extends { cefrLevel: CefrLevel; placement?: true }>(tier: Tier, items: readonly T[]): T[]`
  - `entriesVisibleTo<T extends { level: CefrLevel }>(tier: Tier, items: readonly T[]): T[]` (lessons, vocabulary, phrases, flashcards)

- [ ] **Step 1: Write the failing tests**:
  - `tierFromRow(null, now)` → `"free"`.
  - `{ tier: "b2", status: "active", current_period_end: <now + 1 day> }` → `"b2"`; same with `"trialing"` and `"past_due"` → `"b2"`.
  - `status: "canceled"`, `"unpaid"`, `"incomplete"` → `"free"`.
  - `status: "active"` with `current_period_end` 1 s in the past → `"free"` (Review Focus 1).
  - An unparseable `current_period_end` → `"free"`.
  - `visibleTo("free", [A2 item, B1 item, B1 item with placement: true])` keeps the A2 and the placement one; `visibleTo("b1", …)` keeps all three; `entriesVisibleTo("b1", [A2, B1, B2])` keeps A2 and B1.
- [ ] **Step 2: Run** `npx vitest run src/lib/access/rule.test.ts` → fails (module missing).
- [ ] **Step 3: Implement** `rule.ts` (pure, no imports from Supabase).
- [ ] **Step 4: Run** the test → pass.
- [ ] **Step 5: Commit** `feat(access): one rule for tiers, subscription rows and visibility`.

### Task 3: `subscriptions` table

**Files:**
- Create: `supabase/migrations/20261021120000_subscriptions.sql`

**Interfaces:**
- Produces: `public.subscriptions` exactly as spec section 4 lists (`user_id uuid primary key references auth.users on delete cascade`, `tier` check `b1|b2|c1`, `interval` check `month|year`, `status text not null`, `current_period_end timestamptz not null`, `cancel_at_period_end boolean not null default false`, `stripe_customer_id text unique`, `stripe_subscription_id text unique`, `updated_at timestamptz not null default now()`); RLS on; `revoke all … from anon, authenticated`; `grant select … to authenticated`; one policy `"Owners read their subscription"` for select using `(select auth.uid()) = user_id`. Comment on the table as in `user_data`'s migration.

- [ ] **Step 1: Write the migration** following `20261020120000_user_data.sql`'s style.
- [ ] **Step 2: Ask the user**, then apply to `sello-dev` with the Supabase MCP `apply_migration` (name `subscriptions`).
- [ ] **Step 3: Verify RLS** on `sello-dev` with `execute_sql`, inside a transaction that ends in `rollback`: as role `authenticated` with `request.jwt.claims` set to a random `sub`, an `insert into public.subscriptions …` fails with a permission error, and a `select` returns 0 rows. Then `get_advisors` (security): no new findings except the known ones.
- [ ] **Step 4: Apply to `sello`** (production DB) after the user's OK, same check.
- [ ] **Step 5: Commit** `feat(db): subscriptions table, owner-read only`.

### Task 4: `getEntitlement()` and `useTier()`

**Files:**
- Create: `src/lib/access/entitlement.ts` (server), `src/lib/access/useTier.ts` (client)

**Interfaces:**
- Consumes: `tierFromRow`, `SubscriptionRow` (Task 2); `supabaseServer`, `supabaseBrowser`, `supabaseConfigured`; `useUser`.
- Produces:
  - `getEntitlement(): Promise<Tier>`: `import "server-only"`, wrapped in React `cache()`. Returns `"free"` when `!supabaseConfigured`, when `getClaims()` has no claims, or when the select errors (log one `console.warn`). Otherwise selects `tier, status, current_period_end` for `claims.sub` with `.maybeSingle()` and returns `tierFromRow(row, Date.now())`.
  - `useTier(): Tier | undefined` (`"use client"`): `undefined` while the user is unknown, `"free"` signed out; otherwise reads the row once per user id with the browser client and applies `tierFromRow`. Cosmetic only: it decides lock icons, never content.

- [ ] **Step 1:** No unit test for the I/O wrappers (their logic is `tierFromRow`, tested in Task 2); they are covered by the e2e in Tasks 6, 9 and 11. Write both files.
- [ ] **Step 2: Run `npm run check`** → pass.
- [ ] **Step 3: Commit** `feat(access): server entitlement and client tier hook`.

### Task 5: Lock notice, lock mark and the plans placeholder

**Files:**
- Create: `src/components/access/LockedNotice.tsx` (server-safe, no hooks), `src/components/access/LockMark.tsx` (`"use client"`, uses `useTier`)
- Create: `src/app/[locale]/plans/page.tsx` (placeholder until 10d)
- Modify: `src/i18n/routing.ts` (`"/plans": { es: "/planes", en: "/plans" }`), `messages/es.json`, `messages/en.json`

**Interfaces:**
- Produces:
  - `<LockedNotice level={CefrLevel} count?={number} />`: a bordered box: title `Locked.title` ("Disponible desde el plan {plan}" / "Available from the {plan} plan", `plan` = `TIER_LEVEL[tierFor(level)]`), `Locked.more` when `count` is given ("{count} elementos más en planes superiores" / "{count} more items in higher plans"), a `ButtonLink` to `/plans?nivel=<level>` ("Ver planes" / "See plans") and a link to `/sign-in` ("Ya tengo cuenta" / "I already have an account"). Wrapper has `data-paywall` (the JSON-LD `hasPart` selector).
  - `<LockMark level={CefrLevel} />`: an `Icon` lock with an sr-only "Bloqueado" / "Locked" when `useTier()` is defined and `!canAccess(tier, level)`; renders nothing otherwise.
  - `/plans` placeholder: `PageHeader` + one line per paid tier with the `PRICES` month and year price (formatted `es-ES` / `en-GB`, EUR) and the non-affiliation footer that every page has. `robots: { index: false }` until 10d.
- [ ] **Step 1: Write the failing test** in `src/lib/access/tiers.test.ts` for `formatPrice(cents: number, locale: "es" | "en"): string` (exported from `tiers.ts`): `formatPrice(999, "es")` → `"9,99 €"`, `formatPrice(9590, "en")` → `"€95.90"`. Copy lives in messages, already covered by the messages-parity test. Run → fails.
- [ ] **Step 2: Implement** `formatPrice` (`Intl.NumberFormat`), the two components, the page and the messages.
- [ ] **Step 3: Run `npm run check`** → pass (messages parity included).
- [ ] **Step 4: Commit** `feat(access): lock notice, lock mark and plans placeholder`.

### Task 6: Gated grammar lessons

**Files:**
- Modify: `src/app/[locale]/grammar/[slug]/page.tsx`
- Create: `src/components/lessons/GatedLessonBody.tsx` (server)
- Modify: `src/app/[locale]/grammar/page.tsx` (add `<LockMark level>` next to each lesson's `LevelBadge`)
- Test: `e2e/access.spec.ts` (create)

**Interfaces:**
- Consumes: `getEntitlement`, `canAccess`, `LockedNotice`, `LockMark`.
- Produces: `GatedLessonBody({ slug }: { slug: string })`: loads the lesson with `getContent()` + `lessonBySlug`, calls `getEntitlement()`, and renders either the body sections (form, uses, mistakes, examples, practice, further study: everything after the summary today) or `<LockedNotice level={lesson.level} />`.

- [ ] **Step 1: Write the failing e2e** `e2e/access.spec.ts`:
  - `"a B1 lesson ships its summary but not its body to visitors"`: `request.get("/es/gramatica/present-simple-vs-continuous")`, read the whole response text (HTML plus inline flight data). It must **not** contain the text of the lesson's first `mistakes[].wrong` sentence (read it from `content/grammar/present-simple-vs-continuous.json` with `fs`), and it **does** contain `data-paywall`.
  - `"an A2 lesson is complete for visitors"`: same for `there-and-it`: contains its first `mistakes[].wrong` sentence, no `data-paywall`.
- [ ] **Step 2: Run** `npx playwright test e2e/access.spec.ts` → the B1 case fails.
- [ ] **Step 3: Implement**: the page keeps header + summary (and the Spanish note) in the static part; for `lesson.level === "A2"` it renders the body directly (shared body component, e.g. `LessonBody({ lesson })`), otherwise `<Suspense fallback={…}><GatedLessonBody slug={slug} /></Suspense>`. JSON-LD: `isAccessibleForFree: lesson.level === "A2"`, and for non-A2 add `hasPart: { "@type": "WebPageElement", isAccessibleForFree: false, cssSelector: "[data-paywall]" }`. Grammar index: `LockMark` beside each level badge.
- [ ] **Step 4: Run** the e2e → pass; `npm run check` → pass.
- [ ] **Step 5: Commit** `feat(access): gated grammar lessons with a static preview`.

### Task 7: Gated vocabulary groups and functional language

**Files:**
- Modify: `src/app/[locale]/vocabulary/[slug]/page.tsx`, `src/app/[locale]/vocabulary/page.tsx` (LockMark only if it lists levels), `src/app/[locale]/functional-language/page.tsx`
- Create: `src/components/lessons/VocabEntry.tsx` (the current `<li>` markup moved out), `src/components/lessons/GatedEntries.tsx`, `src/components/lessons/GatedPhrases.tsx`
- Test: `e2e/access.spec.ts`

**Interfaces:**
- Produces:
  - `GatedEntries({ group }: { group: string })`: entries of the group above A2; unlocked ones as `VocabEntry`, locked ones counted into one `<LockedNotice level={lowest locked level} count={n} />`; their headwords listed with level badges (headword + level only: the preview).
  - `GatedPhrases()`: the same split for functional phrases above A2, grouped by function as today.
- The static part renders A2 entries / phrases in full.

- [ ] **Step 1: Write the failing e2e**: `"a vocabulary group hides definitions above A2 from visitors"`: `/es/vocabulario/travel` does not contain the `definition` of a known B1+ travel entry and does contain the `definition` of `v-a2-passport`.
- [ ] **Step 2: Run** → fails.
- [ ] **Step 3: Implement** as above; JSON-LD as in Task 6 (`isAccessibleForFree: false` + `hasPart`) when the page has locked entries.
- [ ] **Step 4: Run** e2e + `npm run check` → pass.
- [ ] **Step 5: Commit** `feat(access): gated vocabulary entries and functional phrases`.

### Task 8: Gated trainers

**Files:**
- Modify: `src/app/[locale]/practice/[part]/page.tsx`

**Interfaces:**
- Consumes: `getEntitlement`, `visibleTo`, `entriesVisibleTo`, `LockedNotice`.
- Each branch passes `visibleTo(tier, exercisesOfPart(content, part))` to its trainer and `entriesVisibleTo(tier, phrases)` to Writing/Speaking; when some exercises of the part were filtered out, render `<LockedNotice level={lowest hidden level} count={hidden count} />` under the trainer. `PracticePart` is already inside `<Suspense>`, so reading the session there is allowed.

- [ ] **Step 1: Write the failing tests**: Vitest in `rule.test.ts`: `"a downgrade leaves only unlocked items for a mistakes-bank session"`: `visibleTo("free", [B1 item])` → `[]` (the trainer's `onlyKeys` then finds nothing and shows its existing empty state). E2E in `access.spec.ts`: `"a visitor's Core Grammar trainer holds only free questions"`: the response body of `/es/practica/core-grammar` contains an A2 question id (`cg-there-and-it-…`, read one from content) and no id of a C1 question without `placement`.
- [ ] **Step 2: Run** → e2e fails.
- [ ] **Step 3: Implement** the filter and the notice in every branch.
- [ ] **Step 4: Run** e2e + `npm run check` → pass.
- [ ] **Step 5: Commit** `feat(access): trainers only receive unlocked tasks`.

### Task 9: Gated banks

**Files:**
- Modify: `src/app/banks/[name]/route.ts`, `src/lib/content/banks.ts`
- Test: `src/lib/content/banks.test.ts`, `e2e/access.spec.ts`

**Interfaces:**
- Produces: `bankFor<K extends keyof Banks>(name: K, content: ContentIndex, tier: Tier): Banks[K]`: `placement` unchanged (already public); `mock` with every list through `visibleTo(tier, …)`; `flashcards` through `entriesVisibleTo(tier, …)`.
- Route: `placement` keeps the cached static response; `mock` and `flashcards` call `getEntitlement()` and return `bankFor(...)` with `Cache-Control: private, no-store`.

- [ ] **Step 1: Write the failing tests**: `banks.test.ts` `"the mock bank for the free tier holds only A2 and placement exercises"` and `"flashcards follow the tier's levels"`; e2e `"a visitor's mock bank has no paid tasks"` (`request.get("/banks/mock")`: every exercise has `cefrLevel` A2 or `placement: true`; header `cache-control` contains `private`).
- [ ] **Step 2: Run** → fail.
- [ ] **Step 3: Implement** `bankFor` and the route change.
- [ ] **Step 4: Run** Vitest + e2e + `npm run check` → pass. Also run the existing mock-exam and flashcards flows in `e2e/flows.spec.ts` (they must work on A2 material).
- [ ] **Step 5: Commit** `feat(access): mock and flashcard banks follow the tier`.

### Task 10: Clear cached pages on sign-out and account switch

**Files:**
- Create: `src/lib/access/offline.ts`, `src/lib/access/offline.test.ts`
- Modify: `src/components/account/AccountPanel.tsx` (after `signOut()`), `src/lib/sync/engine.ts` (where `claimOwner` returns true)

**Interfaces:**
- Produces: `clearCachedPages(store?: Pick<CacheStorage, "delete">): Promise<void>`: deletes the service worker's `sello-pages-v1` cache (pages, RSC data and banks); no-op when `caches` is unavailable; never throws. The cache name is the one in `public/sw.js`: add a comment there pointing to `offline.ts` so the two stay in step.

- [ ] **Step 1: Write the failing tests**: with a fake `{ delete: vi.fn() }` it calls `delete("sello-pages-v1")`; with a store whose `delete` rejects it resolves.
- [ ] **Step 2: Run** → fail.
- [ ] **Step 3: Implement** and call it in both places.
- [ ] **Step 4: Run `npm run check`** → pass.
- [ ] **Step 5: Commit** `feat(access): signed-out browsers drop cached paid pages`.

### Task 11: E2E pass and close 10b

**Files:**
- Modify: e2e specs that relied on content above A2 for visitors (point them at A2 content), `e2e/access.spec.ts` (signed-in case)
- Modify: `docs/status.md`, `CLAUDE.md`

- [ ] **Step 1: Run `npm run e2e`**; fix specs that assumed visitors see B1+ content by moving them to A2 content, never by weakening the gate.
- [ ] **Step 2: Add the signed-in e2e** (skips without `SUPABASE_SECRET_KEY` and `NEXT_PUBLIC_SUPABASE_URL`, like `accounts.spec.ts`): create a throwaway user, insert a `b1` row with the secret key (`status: "active"`, period end in 30 days), sign in, and check that a B1 lesson shows its body and a B2 lesson shows the lock; delete the user at the end.
- [ ] **Step 3: Run `npm run check`** and **`npm run e2e`** → all pass (the signed-in case may skip without keys; say so in the status notes).
- [ ] **Step 4: Status notes** in `docs/status.md` (new "Phase 10b" section: rule, entitlement, gated pages and banks, offline cache, how to give yourself a tier in `sello-dev` for local testing) and the `CLAUDE.md` status line (10b done, next 10c).
- [ ] **Step 5: Commit** `docs: phase 10b status` and sync the mirror.
