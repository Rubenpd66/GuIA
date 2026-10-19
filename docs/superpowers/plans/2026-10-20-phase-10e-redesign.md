# Phase 10e: Redesign, Copy and SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the passport look with the category standard at Busuu/Brilliant finish, rename the product to GuIA, give the app a coherent motion grammar (press, enter, page transitions, answer feedback, reward), then rewrite the interface copy and fix SEO.

**Architecture:** Tokens first (one `globals.css` rewrite plus a mechanical class rename), then motion and UI primitives shown on the existing `/design` page, then each page family restyled on those primitives. Motion uses only CSS (transitions, keyframes, `@starting-style`) and React 19.3's built-in `<ViewTransition>`: no animation library. The brand name already lives only in `SITE.name`; internal identifiers (`sello:` storage keys, the export marker `app: "sello"`, Stripe lookup keys `sello_<tier>_<interval>`) stay as they are so no learner loses data and no price is recreated.

**Tech Stack:** Next 16.4 (App Router, `cacheComponents`), React 19.3 (`ViewTransition`), Tailwind 4 (`@theme inline`, `data-theme` dark mode), next-intl, `next/font/google`, `next/og` `ImageResponse`, Vitest, Playwright with axe.

**Spec:** `docs/superpowers/specs/2026-10-19-phase-10-tiers-design.md` section 7 (steps 3–8). Product truth: `PRODUCT.md`. Direction contract: `.impeccable/surfaces/src-app-locale-page-tsx.md`. Chosen first viewport: `.impeccable/mocks/decision/canon.html`. Audit to close: `docs/design/10e-audit.md`.

## Global Constraints

- Invariants (spec §7): the AA contrast test, 48 px touch targets, reflow at 320 px without sideways scroll, every current e2e green, Core Web Vitals not worse than the Task 1 baseline, non-affiliation notice on every page, no British Council colours, logo or name.
- Motion: only `transform` and `opacity` (plus `color`/`background-color` for state), each animation with its own `prefers-reduced-motion` alternative (a short fade, never nothing where the change carries meaning). No animation on keyboard-initiated actions. Hover effects only under `@media (hover: hover) and (pointer: fine)`.
- No new packages, env vars or services. Fonts through `next/font/google` (self-hosted at build, CSP `font-src 'self'` unchanged).
- Name: "GuIA" exactly (capital G, lower-case u, capital IA). Copy never promises AI until 10f exists.
- Do not touch: storage keys `sello:*`, export marker `app: "sello"` and its `not-sello` error code, Stripe lookup keys, study content in `content/`.
- `messages/es.json` and `messages/en.json` keep identical keys. British English in English. Interface in Spanish uses "tú".
- `npm run check` passes before every commit; run `npm run e2e` at the end of Tasks 2, 6, 10 and 14 (kill any leftover `next start` on port 3100 first).
- Skills per task (the user asked for them): `impeccable` craft floor (`reference/craft-floor.md`) before any UI edit; `emil-design-eng` and `animate` for Tasks 3, 9 and 10; `apple-design` for the bottom sheet in Task 6; `break-ui` on the home, a lesson and a trainer at the end of Tasks 7–9 (worst-case labels, empty states); `humanizer` in Task 12; `searchfit-seo` in Task 13; `review-animations` in Task 14. If Lighthouse is not installed locally, ask before `npx` downloads it.
- Checkpoints: stop for the user's look after Task 4 (system on `/design`) and after Task 7 (home). The user does not want screenshots: tell them which URL to open on the dev server.

## Design values (decided here; DESIGN.md is generated from the built result in Task 14)

Colour tokens (replace every passport token; light / dark):

| Token | Light | Dark | Use |
|---|---|---|---|
| `canvas` | `#ffffff` | `#0f1115` | page background |
| `surface` | `#f5f7fa` | `#171a21` | cards, panels, inputs |
| `ink` | `#14161c` | `#eceef2` | text |
| `ink-soft` | `#4b5260` | `#a9afbb` | secondary text |
| `line` | `#6b7280` | `#7c8494` | control borders (3:1) |
| `hairline` | `#e5e7eb` | `#262b35` | dividers, card borders |
| `accent` | `#1f5fe0` | `#6b9bff` | primary actions, links, active nav |
| `on-accent` | `#ffffff` | `#0b1020` | text on accent |
| `success` | `#15803d` | `#4ade80` | correct, unlocked |
| `danger` | `#b91c1c` | `#f87171` | wrong, errors |
| `reward` | `#f5a524` | `#f5b942` | reward fills (never text on canvas) |
| `reward-ink` | `#8a5a00` | `#f5b942` | reward text |
| `focus` | `#1f5fe0` | `#6b9bff` | focus ring |
| `level-a2` | `#0e7c66` | `#5fd3b8` | CEFR chips |
| `level-b1` | `#1f5fe0` | `#6b9bff` | |
| `level-b2` | `#b45309` | `#f0a35e` | |
| `level-c1` | `#be185d` | `#f472b6` | |

Old → new class names (mechanical): `paper`→`canvas`, `sheet`→`surface`, `cover`→`accent`, `on-cover`→`on-accent`, `foil`→`reward`, `foil-ink`→`reward-ink`, `entry`→`success`, `refusal`→`danger`; `guilloche` is deleted with its component. `ink`, `ink-soft`, `line`, `hairline`, `focus` keep their names.

Type: Figtree (variable, `latin`, normal style only, `display: "swap"`) for everything, replacing Archivo and Literata; `.prose-reading` keeps `max-width: 68ch` and `line-height: 1.7` in Figtree. The current major-third scale on 17 px stays. Headings: weight 700 (h1 800), `letter-spacing: -0.015em` from `text-xl` up. `font-expanded` / `font-semi-expanded` utilities are deleted.

Shape: `--radius-card: 16px`, `--radius-control: 12px`, chips `9999px`. Card elevation light: `0 1px 2px rgb(16 24 40 / 0.06), 0 4px 12px rgb(16 24 40 / 0.05)`; dark: no shadow, `hairline` border.

Vertical rhythm (the "clear separation" goal): between page sections `gap-16` (64 px), `lg:gap-20`; section heading → lead `mt-2`; lead → content `mt-6`; between cards `gap-4`; list rows `min-h-12 py-3`. Encoded once in `Section` (Task 4); no page sets its own section spacing.

Motion tokens (CSS custom properties in `:root`):

| Token | Value |
|---|---|
| `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` |
| `--ease-in-out` | `cubic-bezier(0.77, 0, 0.175, 1)` |
| `--ease-drawer` | `cubic-bezier(0.32, 0.72, 0, 1)` |
| `--dur-press` | `140ms` |
| `--dur-fast` | `180ms` |
| `--dur-base` | `240ms` |
| `--dur-panel` | `320ms` |
| `--dur-reward` | `700ms` |

Motion grammar (one per purpose, nothing else animates):

1. Press: every pressable (`Button`, `ButtonLink`, `IconButton`, `OptionButton`, card links) `scale(0.97)` on `:active`, `transform var(--dur-press) var(--ease-out)`. Reduced: none.
2. Enter: `.enter` fades in and rises 8 px, `var(--dur-base) var(--ease-out)`; lists use `.enter-stagger` children with `animation-delay: calc(min(var(--i), 8) * 40ms)` (items after the 8th share the 8th delay). Reduced: opacity only, 150 ms.
3. Page: `<ViewTransition>` around the main content; old page fades out 120 ms, new page fades in and rises 6 px over `var(--dur-base)`. Reduced: crossfade 150 ms, no movement.
4. Answer feedback: correct option fills `success`, its check icon goes `scale(0.9)`→`1` over `var(--dur-fast)`; wrong option fills `danger` and shakes `translateX` 0, −4, 4, −2, 0 px over `var(--dur-base)`. Reduced: colour only.
5. Progress: bars fill with `transform: scaleX()` from the left, `400ms var(--ease-out)`. Reduced: instant.
6. Panels: the "More" dialog becomes a bottom sheet below `lg` (`translateY(100%)`→`0`, `var(--dur-panel) var(--ease-drawer)`; exit 200 ms), a centred dialog from `lg` (`scale(0.96)`+opacity, `var(--dur-fast)`). Reduced: fade.
7. Reward (rare): `Achievement` badge `scale(0.92)`→`1` with `linear()` overshoot over `var(--dur-reward)`, a ring behind it `scale(0.6)`→`1.4` while fading out, then the caption fades in 120 ms later. Reduced: badge and caption fade in 200 ms (class `achievement-fade`).

## Review Focus

1. A learner who used Sello before the rename opens GuIA: progress, flashcards, drafts and mock history still load, and an old export file still imports. Pinned by keeping the keys and by a test in Task 5.
2. Reduced motion: nothing moves, yet a correct/wrong answer and a reward are still visible (colour or fade). Pinned by the e2e in Task 3 and the updated reward test in Task 10.
3. Dark mode on the new chips, reward and locked previews: every pair passes AA. Pinned by the token pairs in Task 2.
4. Longest Spanish labels at 320 px in the new nav, cards and plan rows: no sideways scroll, no clipped label. The reflow e2e covers every route; Task 6 adds the bottom nav with the longest label.
5. Browsers without the View Transitions API: navigation works, nothing waits for an animation. `<ViewTransition>` degrades by itself; Task 6 checks no code awaits `document.startViewTransition`.

---

### Task 1: Baseline measurements

**Files:**
- Create: `docs/design/10e-baseline.md`

- [ ] **Step 1:** `npm run build`, then `npx next start -p 3100`; run Lighthouse (mobile) three times each on `/es`, one grammar lesson (`/es/gramatica/<first slug>`) and one practice part (`/es/practica/<first part>`). Record the median Performance score, LCP, CLS and TBT per page, plus total JS and font bytes of `/es`.
- [ ] **Step 2:** Stop the server and commit the file: `docs: phase 10e performance baseline`.

### Task 2: Colour and type tokens v2

**Files:**
- Modify: `src/app/globals.css`, `src/app/fonts.ts`, `src/app/[locale]/layout.tsx` (font variables), `src/lib/design/theme-tokens.test.ts`, every file under `src/` using a renamed class, `src/app/manifest.ts` (`background_color: "#ffffff"`, `theme_color: "#1f5fe0"`), `src/app/[locale]/opengraph-image.tsx` (hex values).

**Interfaces:**
- Produces: Tailwind colour utilities `canvas surface ink ink-soft line hairline accent on-accent success danger reward reward-ink focus level-a2 level-b1 level-b2 level-c1`; `--font-sans` from Figtree; radius tokens `rounded-card`, `rounded-control`.

- [ ] **Step 1: Write the failing test.** Replace `PAIRS` in `theme-tokens.test.ts` with: `ink/canvas 4.5`, `ink/surface 4.5`, `ink-soft/canvas 4.5`, `ink-soft/surface 4.5`, `on-accent/accent 4.5`, `accent/canvas 4.5`, `accent/surface 4.5`, `success/canvas 4.5`, `success/surface 4.5`, `danger/canvas 4.5`, `danger/surface 4.5`, `reward-ink/canvas 4.5`, `reward-ink/surface 4.5`, `level-a2/canvas 4.5`, `level-b1/canvas 4.5`, `level-b2/canvas 4.5`, `level-c1/canvas 4.5`, `line/canvas 3`, `line/surface 3`, `focus/canvas 3`, `ink/reward 4.5`. The `parseThemeTokens` test changes `--paper` to `--canvas`.
- [ ] **Step 2:** `npx vitest run src/lib/design/theme-tokens.test.ts`: FAIL (`--canvas is missing`).
- [ ] **Step 3:** Rewrite the token blocks of `globals.css` with the table above, the radius tokens and the elevation as `--shadow-card`; switch `fonts.ts` to one `Figtree` export (`variable: "--font-figtree"`); point `--font-sans` and `.prose-reading` at it; delete `--font-serif`, `font-expanded`, `font-semi-expanded`, `.on-cover` and the guilloche token. If a pair fails, adjust the light or dark value of that token only, then update the table in this plan.
- [ ] **Step 4:** Rename classes across `src/` with the old → new map (match whole token boundaries, e.g. `bg-paper`, `text-foil-ink`, `border-cover`, `[var(--paper)]`); remove `font-expanded`, `font-semi-expanded` and `font-serif` uses. `grep -rnE "paper|sheet|cover|foil|entry|refusal|guilloche|font-expanded|font-serif" src --include=*.tsx --include=*.ts --include=*.css` returns only unrelated words (check each hit, e.g. "discover").
- [ ] **Step 5:** `npm run check` passes; `npm run e2e` passes (axe contrast in both themes).
- [ ] **Step 6:** Commit `feat(design): v2 colour, type and shape tokens`.

### Task 3: Motion foundation

**Files:**
- Modify: `src/app/globals.css`, `src/components/ui/button-styles.ts`, `src/components/ui/IconButton.tsx`, `src/components/trainer/OptionButton.tsx`
- Test: `e2e/a11y-behaviour.spec.ts`

**Interfaces:**
- Produces: CSS classes `.pressable`, `.enter`, `.enter-stagger` (children read `--i`), `.feedback-correct`, `.feedback-wrong`, `.progress-fill` (reads `--value` 0–1); motion custom properties from the table.

- [ ] **Step 1: Write the failing e2e** `motion respects reduced motion`: on `/es` with `reducedMotion: "reduce"`, the first `.enter` element's computed `animation-name` is `enter-fade`; without it, `enter-rise`. On a button, computed `transition-property` includes `transform`.
- [ ] **Step 2:** Run it: FAIL (no `.enter`).
- [ ] **Step 3:** In `globals.css` add the motion tokens, keyframes `enter-rise`, `enter-fade`, `shake`, `pop`, the classes above and their reduced variants; delete the global `* { animation-duration: 0.01ms !important ... }` block (keep `scroll-behavior: auto` under reduced motion). Add `pressable` to `BASE` in `button-styles.ts` (`transition-property: color, background-color, border-color, transform`), to `IconButton` and `OptionButton`; gate every `hover:` colour change with a `@custom-variant hover-fine (@media (hover: hover) and (pointer: fine) { &:hover })` and use `hover-fine:` in place of `hover:` in these files. Add `.enter` to the home page's first section so the test has a target.
- [ ] **Step 4:** The new e2e passes; `npm run check` passes.
- [ ] **Step 5:** Commit `feat(design): motion tokens, press, enter and reduced-motion alternatives`.

### Task 4: UI primitives and the living style guide

**Files:**
- Create: `src/components/ui/Section.tsx`, `src/components/ui/Card.tsx`, `src/components/ui/ProgressBar.tsx`, `src/components/brand/Wordmark.tsx`
- Modify: `src/components/ui/Button.tsx` / `button-styles.ts` (radius, sizes unchanged `min-h-12` / `min-h-14`), `src/components/ui/PageHeader.tsx`, `src/components/ui/EmptyState.tsx`, `src/components/content/LevelBadge.tsx` (chip in `level-*` colours), `src/app/[locale]/design/page.tsx`

**Interfaces:**
- Produces:
  - `Section({ id, title, lead?, headingLevel = 2, children }: { id: string; title: ReactNode; lead?: ReactNode; headingLevel?: 2 | 3; children: ReactNode })`: `<section aria-labelledby>` with the rhythm values; consecutive `Section`s are spaced by their parent `flex flex-col gap-16 lg:gap-20` via the exported `SectionStack({ children })`.
  - `Card({ as = "div", href?, interactive?, className?, children })`: `rounded-card bg-surface p-5 sm:p-6` with `--shadow-card` in light; `href` renders a `Link` with `pressable` and a hover-fine lift (`translateY(-2px)`, `var(--dur-fast)`).
  - `ProgressBar({ value, label }: { value: number /* 0..1 */; label: string })`: track `bg-hairline rounded-full h-2`, fill `.progress-fill bg-accent`, `role="progressbar"` with `aria-valuenow` in percent.
  - `Wordmark({ className? })`: text "Gu" + "IA" with "IA" in `text-accent`, weight 800, `aria-label` from `SITE.name`.
- [ ] **Step 1: Write the failing test** `src/components/ui/progress.test.ts` for the pure helper `progressPercent(value: number): number` exported from `ProgressBar.tsx`: `progressPercent(0.456) === 46`, `progressPercent(-1) === 0`, `progressPercent(2) === 100`, `progressPercent(NaN) === 0`.
- [ ] **Step 2:** Run: FAIL.
- [ ] **Step 3:** Implement the primitives; rebuild `/design` to show tokens (both themes via the existing toggle), type scale, buttons in all variants and states, `Card`, `Section`, `ProgressBar`, `LevelBadge` per level, option feedback (correct, wrong), the enter stagger and the `Achievement` placeholder slot (filled in Task 10). Remove the passport demos from `/design`.
- [ ] **Step 4:** `npm run check` passes.
- [ ] **Step 5:** Commit `feat(design): Section, Card, ProgressBar, Wordmark and the /design guide`.
- [ ] **Step 6: Checkpoint.** Ask the user to open `http://localhost:3000/es/design` in light and dark and approve before Task 5.

### Task 5: Rename to GuIA

**Files:**
- Modify: `src/config/site.ts` (`name: "GuIA"`), `messages/es.json`, `messages/en.json`, `src/app/manifest.ts`, `src/app/icon.svg`, `src/app/[locale]/opengraph-image.tsx`, `e2e/pwa.spec.ts`, `docs/legal/README.md`
- Create: `src/app/apple-icon.tsx`, `src/app/icons/[size]/route.tsx` or equivalent `ImageResponse` routes for 192, 512 and maskable 512 (replacing the PNGs in `public/icons/` and `src/app/apple-icon.png`, `src/app/favicon.ico` regenerated from the SVG or removed in favour of `icon.svg`)
- Test: `src/lib/brand.test.ts`, `src/lib/progress/progress.test.ts`

- [ ] **Step 1: Write the failing tests.** `brand.test.ts`: walking every string value of both messages files, zero values match `/\bsellos?\b/i` (the brand and the old "stamp" wording both go) and `SITE.name === "GuIA"`. `progress.test.ts`: an export produced by `exportProgress` still carries `app: "sello"` and `importProgress` of a pre-rename file succeeds.
- [ ] **Step 2:** Run: `brand.test.ts` FAILS, `progress.test.ts` passes (it guards).
- [ ] **Step 3:** Replace the brand in every message value by `GuIA`, adjusting grammar (GuIA is feminine: "la app", but avoid articles before the name); rewrite `stampLabel`, `stamps` and other stamp strings as achievement wording ("Logro {level}: {part}", "Logros"; en "Achievement {level}: {part}", "Achievements"). Draw `icon.svg` as a 512 rounded square in `accent` with "G" in `on-accent` weight 800; generate the PNG sizes with `ImageResponse` from the same drawing; manifest `short_name: "GuIA"`; update `e2e/pwa.spec.ts`. The export file name becomes `guia-progress-<date>.json`; the marker stays.
- [ ] **Step 4:** `npm run check` passes; `npx playwright test e2e/pwa.spec.ts` passes (with the build).
- [ ] **Step 5:** Commit `feat(brand): rename the product to GuIA (internal keys unchanged)`.
- [ ] **Step 6: Manual, with the user's OK:** rename the three Stripe test products to "GuIA B1/B2/C1" (`stripe products update <id> --name ...`, ids in `docs/status.md` "Phase 10c"); the user renames the Vercel and Supabase projects and the URL themselves, then `SITE.url` changes in one line.

### Task 6: Shell and page transitions

**Files:**
- Modify: `src/components/shell/AppShell.tsx`, `TopBar.tsx`, `SpineNav.tsx` (rename to `SideNav.tsx`, update imports), `BottomNav.tsx`, `MoreDialog.tsx`, `SiteFooter.tsx`, `src/app/globals.css` (view-transition rules)
- Test: `e2e/a11y-behaviour.spec.ts`

- [ ] **Step 1: Write the failing e2e** `bottom nav marks the current page`: at 390 px on `/es/panel`, the bottom nav link for the dashboard has `aria-current="page"` and the active indicator element (`[data-nav-indicator]`) is visible; at 320 px the nav has no horizontal overflow (`scrollWidth <= clientWidth`).
- [ ] **Step 2:** Run: FAIL (no indicator).
- [ ] **Step 3:** Restyle: top bar `canvas` with `hairline` bottom border and `Wordmark`; side nav (≥ `lg`) as a list with an `accent`-tinted pill on the current item; bottom nav with icon + label and one indicator that moves with `transform` (`var(--dur-fast) var(--ease-out)`); `MoreDialog` as bottom sheet / centred dialog per motion rule 6, keeping focus trap and Escape; footer keeps the non-affiliation notice. Wrap `{children}` in `AppShell` with `<ViewTransition>` (import from `react`) and add the page rules (`::view-transition-old(root)`, `::view-transition-new(root)` or a named class) with their reduced variant. No code calls or awaits `document.startViewTransition`.
- [ ] **Step 4:** New e2e passes; `npm run check` passes; full `npm run e2e` passes.
- [ ] **Step 5:** Commit `feat(shell): new navigation, bottom sheet and page transitions`.

### Task 7: Home

**Files:**
- Modify: `src/app/[locale]/page.tsx`, `src/components/sections/PartsList.tsx`, `messages/{es,en}.json` (`Home` keys only)

- [ ] **Step 1:** Build the first viewport to match `.impeccable/mocks/decision/canon.html` and the FIRST VIEWPORT line of the surface brief: headline, one support line, primary `ButtonLink` to `/placement-test` (full width below `sm`), secondary to `/plans`, three benefit `Card`s (real format of the 18 parts, explained in Spanish, estimated level and next step). Below, in a `SectionStack`: "Cómo funciona" (three numbered steps: test de nivel → plan → práctica diaria), the 18 parts grouped by skill in `Card`s with `.enter-stagger`, a plans teaser (A2 free without account, link to `/plans`, prices from `PRICES`/`formatPrice`), and a closing CTA. Remove `PassportCover` and the levels row. Fix `structuredDescription` (A2 free, not "gratuita" for the whole site). No testimonials, numbers of learners or AI claims.
- [ ] **Step 2:** Add an e2e `home sections are clearly separated`: at 390 px, for each pair of consecutive `main section` elements, the gap between one's bottom and the next one's top is ≥ 48 px.
- [ ] **Step 3:** `npm run check` and the new e2e pass.
- [ ] **Step 4:** Commit `feat(home): category-standard home on the v2 system`.
- [ ] **Step 5: Checkpoint.** Ask the user to open `http://localhost:3000/es` (mobile width and desktop) and approve before the remaining families.

### Task 8: Syllabus and lessons

**Files:**
- Modify: `src/app/[locale]/syllabus/page.tsx`, `src/app/[locale]/grammar/**`, `vocabulary/**`, `functional-language/**`, `reading/**`, `listening/**`, `writing/**`, `speaking/**` (section index pages), `src/components/lessons/*`, `src/components/access/LockedNotice.tsx`, `LockMark.tsx`

- [ ] **Step 1:** Syllabus: one column of skill `Section`s on mobile; on `lg` a two-column grid where each skill is its own card so columns balance (closes the audit's column imbalance). Lesson rows `min-h-12 py-3` (closes the `py-1` finding). Lesson pages: `PageHeader` with level chip, `.prose-reading` body, `FurtherStudy`/`CanDoList` as `Card`s, practice block as a `Section`. Locked previews: `surface` card with `LockMark` and the plan link, readable in both themes.
- [ ] **Step 2:** Shared element: lesson row title and lesson `h1` share `<ViewTransition name={\`lesson-${slug}\`} share="morph" default="none">`.
- [ ] **Step 3:** Extend the section-gap e2e from Task 7 to `/es/temario` and one grammar lesson.
- [ ] **Step 4:** `npm run check` and the e2e pass. Commit `feat(lessons): syllabus and lessons on the v2 system`.

### Task 9: Trainers, placement test and mock exam

**Files:**
- Modify: `src/components/trainer/*` (delete `Perforations.tsx`), `src/components/reading/*`, `listening/*`, `writing/*`, `speaking/*`, `flashcards/FlashcardTrainer.tsx`, `assessment/*`, `src/app/[locale]/practice/**`, `mock-exam/**`, `placement-test/**`

- [ ] **Step 1:** `SessionHeader` shows a `ProgressBar` (question n of total) and the timer; `OptionButton` uses `feedback-correct` / `feedback-wrong` from Task 3 after answering; `ResultsView` shows score in a `Card` with a `ProgressBar` per section. `WritingTrainer.tsx:212` `border-l-4` → a `Card` (audit P3); `SortableList.tsx:30` `size-11` → `size-12` (audit P3). Every row `min-h-12 py-3`.
- [ ] **Step 2:** Add an e2e `answer feedback shows without motion`: in the grammar trainer with reduced motion, after choosing a wrong option it has class `feedback-wrong` and computed `animation-name` `none`, and its background is the `danger` colour.
- [ ] **Step 3:** `npm run check` and the e2e pass. Commit `feat(trainers): trainers and exams on the v2 system`.

### Task 10: Dashboard and the reward moment

**Files:**
- Create: `src/components/progress/Achievement.tsx`
- Modify: `src/components/dashboard/Dashboard.tsx`, `LevelUpNotice.tsx`, `MistakesBank.tsx`, `assessment/PlacementTest.tsx`, `assessment/MockExam.tsx`, `src/lib/estimate/level.ts` (move `StampLevel` → `AchievementLevel` in `src/components/progress/Achievement.tsx` or a types file), `src/app/[locale]/design/page.tsx`, `e2e/a11y-behaviour.spec.ts`
- Delete: `src/components/passport/` (all five files)

**Interfaces:**
- Produces: `Achievement({ level, caption, animate = false }: { level: AchievementLevel; caption: string; animate?: boolean })`, `type AchievementLevel = "A2" | "B1" | "B2" | "C"` (same members as `StampLevel`).

- [ ] **Step 1: Update the failing e2e.** `the stamp only fades when less motion is asked for` becomes `the achievement only fades when less motion is asked for`: locator `.achievement` (was `svg.stamp-drop`), expected `animation-name` `achievement-fade` under reduced motion and `achievement-pop` without.
- [ ] **Step 2:** Run: FAIL.
- [ ] **Step 3:** Build `Achievement` per motion rule 7 (badge in the level colour, level text in `on-accent`-equivalent contrast, caption below); replace every `Stamp` use; dashboard order: next step card first (the product principle), then level per skill with `ProgressBar`s, streak and time, weak points, exam countdown. Delete `src/components/passport/` and the stamp keyframes.
- [ ] **Step 4:** `npm run check` and full `npm run e2e` pass. Commit `feat(dashboard): achievements replace stamps; dashboard on the v2 system`.

### Task 11: Account, plans, settings and legal pages

**Files:**
- Modify: `src/components/account/*`, `src/components/plans/*`, `src/components/settings/*`, `src/components/legal/LegalSections.tsx`, `src/app/[locale]/{account,sign-in,plans,settings,privacy,terms,cookies,legal-notice,exam-guide,flashcards,mistakes}/**`

- [ ] **Step 1:** Restyle on the primitives: plan cards as `Card`s with the current plan marked by an `accent` border, `LevelCatalogue` rows `min-h-12 py-3` (audit P2), forms with `rounded-control` inputs on `surface`, legal pages as `.prose-reading` with `Section`s.
- [ ] **Step 2:** `npm run check` and `npx playwright test e2e/plans.spec.ts e2e/accounts.spec.ts` pass. Commit `feat(design): account, plans, settings and legal on the v2 system`.

### Task 12: Interface and marketing copy

**Files:**
- Modify: `messages/es.json`, `messages/en.json`

- [ ] **Step 1:** Load the `humanizer` skill. Rewrite every value namespace by namespace (not `content/`): Spanish with "tú", close and direct; English in British English; no AI promise, no invented claims, estimates still called estimates, the non-affiliation wording keeps its legal meaning. Keys stay identical.
- [ ] **Step 2:** `npm run check` (keys test, brand test) and full `npm run e2e` pass (fix e2e selectors that match on text only where the rewrite changed a label). Commit `copy: rewrite interface and marketing copy`.

### Task 13: SEO

**Files:**
- Modify: metadata in `src/app/[locale]/**/page.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`, `src/components/seo/JsonLd.tsx` uses
- Create: `docs/design/10e-seo.md`

- [ ] **Step 1:** Load `searchfit-seo:seo-audit` (technical + on-page) and `searchfit-seo:keyword-clustering` (Spanish clusters around "Aptis", "preparar Aptis", "examen Aptis B1/B2/C1", per skill). Ask before anything that uses the network. Fix titles, descriptions, canonical/hreflang, headings and internal links between home, syllabus, lessons, practice and plans.
- [ ] **Step 2:** Write `docs/design/10e-seo.md` with the findings, the fixes and a list of proposed guides or articles; ask the user to choose before writing any new content.
- [ ] **Step 3:** `npm run check` passes. Commit `feat(seo): metadata, internal links and keyword plan`.

### Task 14: Final review, DESIGN.md and close

**Files:**
- Create: `DESIGN.md`, `.impeccable/design.json`
- Modify: `docs/status.md`, `CLAUDE.md` (Status), `HANDOFF.md` (delete or refresh)

- [ ] **Step 1:** Run `impeccable detect --json` on the built pages (same 12 URLs as the audit); fix mechanical findings. Load `review-animations` and review every animation against the motion grammar.
- [ ] **Step 2:** Lighthouse three runs on the Task 1 pages; each median not worse than the baseline by more than the measured noise (±9 points); LCP and CLS not worse.
- [ ] **Step 3:** Spawn `impeccable-finish-reviewer` with this plan, the direction contract, `canon.html` as the critique reference and the detector output; apply its fixes once. Then spawn `impeccable-documenter` to write `DESIGN.md` and `.impeccable/design.json` from the built system.
- [ ] **Step 4:** Full `npm run check` and `npm run e2e` pass. Update `docs/status.md` (phase 10e section: files, decisions, deferred minors) and the `CLAUDE.md` status line; sync the mirror (`git -C "C:\Users\RUBEN\Documents\sello-aptis" pull -q "C:\Users\RUBEN\dev\sello-aptis" main` from PowerShell). Commit `docs: phase 10e close`. No deploy.
