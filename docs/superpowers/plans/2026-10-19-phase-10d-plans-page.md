# Phase 10d: Plans Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/planes` and `/plans` become the shop window: four plan cards with real figures and the right button for the learner's situation, the content of each level, an FAQ, and `Product` structured data.

**Architecture:** A static catalogue (figures computed from content at build, level contents, FAQ, JSON-LD) with small dynamic holes for what depends on the visitor (the card buttons, the lock marks, the `?nivel=` highlight). The pure figures live in `src/lib/access/figures.ts`; the page only renders. The existing `startCheckout` / `openPortal` actions (10c) do all the paying; this phase adds no server logic and no packages.

**Tech Stack:** Next 16 (`cacheComponents`, `useSearchParams` and session-dependent UI inside `<Suspense>`), next-intl, Vitest, Playwright. Design system as it is today (10e restyles).

**Spec:** `docs/superpowers/specs/2026-10-19-phase-10-tiers-design.md` (section 6; prices in section 1; Stripe flow in section 5).

## Global Constraints

- Four plans: `free` (A2), `b1`, `b2`, `c1`; prices from `PRICES` and `formatPrice` in `src/lib/access/tiers.ts` (VAT included); yearly saving shown as "−20 %" and as the amount saved (`month * 12 - year`), never a typed number.
- Buttons by situation: A2 "Empezar gratis" / "Start free"; no session "Crear cuenta y suscribirme" / "Create account and subscribe" (goes to sign-in and comes back to `/plans`); session without plan "Suscribirme" / "Subscribe" (`startCheckout`); subscribed "Tu plan actual" (disabled, on the learner's own card) or "Cambiar de plan" / "Change plan" (`openPortal`, which handles upgrades and downgrades).
- The catalogue is static: nothing paid is gated here (titles and counts are the shop window). Lock state comes from `useTier()` (cosmetic).
- A session-dependent component sits inside `<Suspense>`; `useSearchParams` too.
- No invented official data. Non-affiliation notice stays in the footer. British English in English copy. `messages/es.json` and `messages/en.json` keep identical keys.
- No new packages or env vars. `npm run check` passes before every commit.

## Review Focus

1. A learner whose plan ended (period over) sees "Subscribe", not "Your current plan" or "Change plan": the buttons use `useTier()` (period-aware), never the raw row. Pinned by `buttonFor` tests (Task 2).
2. `?nivel=` with an unknown value (`?nivel=Z9`, `?nivel=`, repeated): ignored, no highlight, no crash. Pinned by `parseLevelParam` tests (Task 2).
3. A paid-tier learner opening a lower card: that card must not offer to "Subscribe" to a plan they already include; it reads "Included in your plan". Pinned by `buttonFor` tests (Task 2).
4. Figures must come from the content, not typed numbers: adding an exercise changes the page without code edits. Pinned by `planFigures` tests with a small fixture index (Task 1).
5. Mobile at 320 px: four cards, a toggle and tabs without sideways scroll. The existing reflow e2e covers `/plans` (Task 6).

---

### Task 1: Figures per plan

**Files:**
- Create: `src/lib/access/figures.ts`, `src/lib/access/figures.test.ts`

**Interfaces:**
- Consumes: `ContentIndex` (`src/lib/content/index.ts`), `levelsFor`, `Tier`, `entriesVisibleTo`/`visibleTo` from `rule.ts`, `PLACEMENT_PARTS` is not needed.
- Produces:
  - `type PlanFigures = { lessons: number; words: number; phrases: number; tasks: number; mockLevel: CefrLevel }`
  - `planFigures(index: ContentIndex, tier: Tier): PlanFigures`: counts of grammar lessons, vocabulary entries (words), functional phrases and exercises whose level the tier opens (`entriesVisibleTo` / `visibleTo` with `placement` ignored: count by level only, so the free card does not count placement items from higher levels); `mockLevel` = the highest level the tier opens (`TIER_LEVEL[tier]`).
  - `levelCatalogue(index: ContentIndex, level: CefrLevel): { lessons: { slug: string; title: string }[]; groups: string[]; tasksByPart: Partial<Record<ExamPart, number>> }`: titles and slugs only (the shop window), groups that have entries at that level, task counts per exam part.

- [ ] **Step 1: Write the failing tests** with a fixture index (two A2 lessons, one B1 lesson, three A2/B1 vocabulary entries, one C1 phrase, A2/B1/C1 exercises): `planFigures(index, "free")` counts only A2; `planFigures(index, "b1")` counts A2 + B1; `planFigures(index, "c1").mockLevel === "C1"`; an A2 exercise flagged `placement: true` and a C1 one flagged `placement: true` are counted by their own level only; `levelCatalogue(index, "B1")` returns the B1 lesson's slug and title and the count per part.
- [ ] **Step 2: Run** `npx vitest run src/lib/access/figures.test.ts` → fails (module missing).
- [ ] **Step 3: Implement** both functions (pure; read the real shape of the lesson `title` — it may be localised, use the same helper `localize.ts` offers and take the locale as a third parameter if so).
- [ ] **Step 4: Run** → pass.
- [ ] **Step 5: Commit** `feat(plans): figures per plan computed from the content`.

### Task 2: Buttons by situation and the `?nivel=` parameter

**Files:**
- Create: `src/lib/access/plan-button.ts`, `src/lib/access/plan-button.test.ts`

**Interfaces:**
- Consumes: `Tier`, `TIERS`, `levelsFor`, `CefrLevel`.
- Produces:
  - `type Viewer = { user: "unknown" } | { user: "signedOut" } | { user: "signedIn"; tier: Tier }`
  - `type PlanButton = "start" | "createAccount" | "subscribe" | "current" | "change" | "included"`
  - `buttonFor(card: Tier, viewer: Viewer): PlanButton | null`: `null` while the viewer is `unknown` (render nothing, avoids a flash). Card `free` → `"start"` for everyone. Paid card: signed out → `"createAccount"`; signed in with `free` tier → `"subscribe"`; signed in with the card's own tier → `"current"`; signed in with a higher tier → `"included"`; signed in with a lower paid tier → `"change"`.
  - `parseLevelParam(value: string | string[] | null | undefined): Tier | null`: `"A2"|"B1"|"B2"|"C1"` (case-insensitive, first value if repeated) → `tierFor(level)`; anything else → `null`.

- [ ] **Step 1: Write the failing tests**: the full matrix of `buttonFor` (4 cards × viewer states, including a signed-in `free` viewer on every paid card, a `b2` viewer on `b1` → `included`, on `c1` → `change`, on `b2` → `current`); `buttonFor("b1", { user: "unknown" })` → `null`; `parseLevelParam("B2")` → `"b2"`, `"b2"` → `"b2"`, `["C1", "A2"]` → `"c1"`, `"Z9"`, `""`, `null`, `undefined` → `null` (Review Focus 2).
- [ ] **Step 2: Run** → fails.
- [ ] **Step 3: Implement** (pure).
- [ ] **Step 4: Run** → pass.
- [ ] **Step 5: Commit** `feat(plans): which button each plan card shows`.

### Task 3: The plan cards with interval toggle

**Files:**
- Create: `src/components/plans/PlanCards.tsx` (`"use client"`), `src/components/plans/PlanButton.tsx` (`"use client"`)
- Modify: `src/components/plans/SubscribeButtons.tsx` (delete it: the card buttons replace it), `src/app/[locale]/plans/page.tsx`, `messages/es.json`, `messages/en.json`

**Interfaces:**
- Consumes: `planFigures` (Task 1, computed on the server and passed as serialisable props), `buttonFor`, `parseLevelParam` (Task 2), `useTier`, `useUser`, `startCheckout`, `openPortal`, `PRICES`, `formatPrice`.
- Produces:
  - `<PlanCards figures={Record<Tier, PlanFigures>} />`: a `role="radiogroup"` toggle "Mensual / Anual" (arrow-key accessible, 48 px targets) with the yearly saving text; four cards (`<article>` with the plan name, price for the chosen interval with "IVA incluido", the figures as a list, the button). The `?nivel=` card gets `aria-current="true"` and a visible ring. Reads `useSearchParams()`, so the component is rendered inside `<Suspense>` by the page.
  - `<PlanButton card={Tier} interval={BillingInterval} />`: renders the button from `buttonFor`: `start` → `ButtonLink` to `/syllabus`; `createAccount` → `ButtonLink` to `/sign-in?next=<plans path>`; `subscribe` → form calling `startCheckout(card, interval, locale)`; `change` → form calling `openPortal(locale)`; `current` / `included` → disabled `Button`. Errors from the actions in a `role="alert"` paragraph as in the old `SubscribeButtons`.
  - Page: static `PageHeader`, then `<Suspense fallback={<PlanCardsSkeleton />}><PlanCards … /></Suspense>`.

- [ ] **Step 1:** The logic is tested in Tasks 1–2; here the components have no branches of their own. Check how `SignInPanel` takes the `next` parameter (`src/components/account/SignInPanel.tsx`): if it only accepts same-site paths from a fixed list, add `/plans` and `/planes` to it with a test in `src/lib/auth/redirect.test.ts`; if it does not read a `next` from the query at all, add that, restricted to the same validator `redirect.ts` already provides.
- [ ] **Step 2: Implement** the components, the messages (`Plans.*`: toggle labels, "IVA incluido", "Ahorras {amount} al año", figures such as "{lessons} lecciones de gramática", button labels, `Plans.included`), and the page.
- [ ] **Step 3: Run `npm run check`** → pass.
- [ ] **Step 4: Commit** `feat(plans): plan cards with interval toggle and per-situation buttons`.

### Task 4: Content by level, FAQ and structured data

**Files:**
- Create: `src/components/plans/LevelCatalogue.tsx` (server for the data, `"use client"` tabs inside), `src/components/plans/PlansFaq.tsx`
- Modify: `src/app/[locale]/plans/page.tsx`, `src/app/[locale]/plans/` metadata, `messages/es.json`, `messages/en.json`

**Interfaces:**
- Consumes: `levelCatalogue` (Task 1), `LockMark`, `JsonLd`, `PRICES`.
- Produces:
  - `<LevelCatalogue catalogue={Record<CefrLevel, ReturnType<typeof levelCatalogue>>} />`: tabs A2–C1 (`role="tablist"`, arrows move focus), each panel lists lesson titles linking to their (public-preview) lesson page with a `LockMark` beside paid levels, the vocabulary groups, and the task counts per exam part using the part names already in the messages.
  - `<PlansFaq />`: native `<details>` elements, six questions from messages: VAT included; how to cancel; changing plan (upgrade immediate and prorated, downgrade at period end); what happens to progress when the plan ends (kept, higher levels lock again); withdrawal right (waived on immediate access, link to the terms); non-affiliation (Sello is not the British Council).
  - Page metadata: title and description, **indexable** (remove `robots: { index: false }`), canonical and `alternates` as other pages do. `Product` JSON-LD per paid plan with two `Offer`s (month, year): `priceCurrency: "EUR"`, `price` formatted with a dot (`(cents / 100).toFixed(2)`), `priceValidUntil` omitted, `availability: "https://schema.org/InStock"`, `url` the plans page.

- [ ] **Step 1: Write the failing test** in `src/lib/access/figures.test.ts`: `offersFor(tier: PaidTier)` returns `[{ interval: "month", price: "9.99" }, { interval: "year", price: "95.90" }]` for `b1` (add `offersFor` to `figures.ts`).
- [ ] **Step 2: Run** → fails. **Step 3:** implement `offersFor`, the components, the copy and the JSON-LD.
- [ ] **Step 4: Run `npm run check`** → pass.
- [ ] **Step 5: Commit** `feat(plans): level catalogue, FAQ and Product data`.

### Task 5: Links to the plans page

**Files:**
- Modify: `src/components/shell/SiteFooter.tsx`, `src/components/shell/TopBar.tsx` (or the desktop spine, whichever carries the account link), `src/config/sections.ts` if the shell reads section keys, `src/app/sitemap.ts`, `messages/es.json`, `messages/en.json`

- [ ] **Step 1:** A plans link in the footer and one in the top bar next to the account link (hidden below 360 px like it, since the footer has it too). Add `/plans` to the sitemap with its two languages. Check `src/components/shell/nav-items.test.ts` and any sitemap test still pass.
- [ ] **Step 2: Run `npm run check`** → pass. **Step 3: Commit** `feat(plans): link the plans page from the top bar, the footer and the sitemap`.

### Task 6: Account page shows the plan's state

**Files:**
- Modify: `src/lib/access/useTier.ts` (also expose the row), `src/components/account/PlanSection.tsx`, `messages/*.json`
- Test: `src/lib/access/rule.test.ts`

**Interfaces:**
- Produces: `describePlan(row: { cancel_at_period_end: boolean; status: string; current_period_end: string } | null, now: number): "none" | "active" | "ending" | "pastDue"` in `rule.ts` (`ending` = `cancel_at_period_end` and still live; `pastDue` = status `past_due`; `none` when `tierFromRow` would be `free`). `useTier` keeps returning `Tier | undefined`; add `useSubscriptionState()` returning `{ tier: Tier; state: ReturnType<typeof describePlan>; endsOn?: string } | undefined`, sharing the one query with `useTier` (deferred minor from 10b).
- `PlanSection` shows "Se cancela el {date}" / "Ends on {date}" for `ending`, "Hay un problema con el pago; actualízalo en el portal" / "There is a problem with your payment; update it in the portal" for `pastDue`, and for a learner whose plan ended it keeps "See plans" and adds a "Facturas anteriores" / "Past invoices" portal button only when a `stripe_customer_id` exists (read it in the same query).

- [ ] **Step 1: Write the failing tests** for `describePlan`: live + not cancelling → `active`; live + `cancel_at_period_end` → `ending`; `past_due` live → `pastDue`; `canceled` → `none`; period over → `none`.
- [ ] **Step 2: Run** → fails. **Step 3:** implement, wire the section.
- [ ] **Step 4: Run `npm run check`** → pass. **Step 5: Commit** `feat(account): show when a plan ends and when payment fails`.

### Task 7: E2E and close 10d

**Files:**
- Create: `e2e/plans.spec.ts`
- Modify: `docs/status.md`, `CLAUDE.md`

- [ ] **Step 1: Write the e2e** (signed-out cases always run; signed-in cases skip without `SUPABASE_SECRET_KEY`, like `access.spec.ts`): `/es/planes` shows four cards with their prices and the "Crear cuenta y suscribirme" buttons for B1–C1 and "Empezar gratis" on A2; the interval toggle changes the displayed prices to the yearly ones and back; `/es/planes?nivel=B2` marks only the B2 card with `aria-current`; `?nivel=Z9` marks none; the page response contains `application/ld+json` with `"@type":"Product"`; a throwaway signed-in B1 subscriber (as in `access.spec.ts`) sees "Tu plan actual" on B1, "Incluido en tu plan" on A2 and "Cambiar de plan" on B2.
- [ ] **Step 2: Run `npm run check`** and **`npm run e2e`** → pass (a11y and reflow already cover `/plans`).
- [ ] **Step 3: Status notes** in `docs/status.md` ("Phase 10d") and the `CLAUDE.md` status line (10d done, next 10e).
- [ ] **Step 4: Commit** `docs: phase 10d status`; sync the mirror.
