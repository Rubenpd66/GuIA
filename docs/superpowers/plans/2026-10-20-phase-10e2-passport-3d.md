# Phase 10e.2: Interactive passport, plans on the home page, 3D and speed

Requested by the user on 2026-10-20 before leaving the session ("no me hagas ninguna consulta"), so every decision below is an executor ruling recorded in `docs/status.md`.

**Request (summary):** the home page shows the purchase plans (monthly by default), drops the level stamps and the 18 exam parts, keeps the title and a passport drawing that opens on click and shows the highest level reached in the tests; the dashboard shows the same progress content; dynamic, interactive, responsive 3D design across the site; finish every phase that does not need the user; then reduce loading times between sections, debug and improve the project.

**Global constraints (unchanged):** no new packages, env vars, services or keys; no deploy; AA contrast test, 48 px targets, reflow at 320 px, current e2e green, reduced-motion alternative for every animation, `transform`/`opacity` only for motion, non-affiliation notice, no British Council colours or name, British English in English copy, identical message keys.

## Tasks

1. **Passport summary (pure, tested).** `src/lib/estimate/passport.ts`: `passportSummary(progress): PassportSummary` with the highest estimated level across the five skills, each skill's level and percent, the date of the latest exam-mode attempt and `hasData`. Tests in `passport.test.ts`.
2. **`LevelPassport` (3D, client).** `src/components/passport/LevelPassport.tsx`: a GuIA language passport in the accent colour. The cover is a button (`aria-expanded`); clicking opens it in 3D (`perspective`, `preserve-3d`, cover `rotateY` about the spine, `backface-visibility: hidden`) to reveal the inside page with the highest level as an animated `Achievement`, the per-skill levels and a link to the placement test or the dashboard. Pointer-following tilt while closed (fine pointers, motion-safe). Reduced motion: crossfade, no rotation. No horizontal overflow at 320 px.
3. **Home.** Title, lead, CTAs and the passport in the hero; the plan cards (monthly first) with figures from the content; a short closing CTA. The benefit cards, steps and 18 parts move out (the parts stay on `/practica`).
4. **Plans default to monthly** everywhere (`PlanCards`), e2e updated.
5. **Dashboard** shows the same passport (opened by default when there is data).
6. **3D across the site.** `Tilt` client wrapper for interactive cards (plans, practice parts, syllabus cards); 3D flip for flashcards; the achievement badge turns like a coin; depth on page transitions. All with reduced-motion fallbacks and pointer-fine gating.
7. **Speed.** Measure the client JS per route from the build; lazy-load what every page pays for but rarely uses (Supabase client in the shell), keep navigation prefetch, shorten transition durations if they delay content.
8. **Cleanup.** Rename internal leftovers (`stampLabel`, `noStamp`, `passportTitle`, `PassportSlot`, `entry`/`refusal` tones, "spine"), type `alternatesFor` with real pathnames, remove dead code and unused message keys.
9. **10f groundwork without the user.** Design spec for AI feedback with the decisions that need the user listed as open (provider, key, cost cap); no code that needs a key.
10. **Review and close.** `npm run check`, full e2e, impeccable detector, a fresh review, docs, mirror sync. No deploy.
