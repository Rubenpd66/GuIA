# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Adult Spanish speakers at B1/B2 who are sitting the Aptis ESOL General and want the top grade (C) in all five components: Core (Grammar & Vocabulary), Reading, Listening, Writing and Speaking. They need the certificate for very different reasons, all confirmed: university (graduation, master's, Erasmus), work (an employer or a hiring process), emigration (residence or work visas) and public exams (teachers and candidates who must prove B1, B2 or C1). They study a little every day, mostly on their phone, and need to know where they stand and what to do next.

## Product Purpose

An installable web app (PWA, no store apps) for Aptis ESOL General preparation. Success means the learner always knows their estimated level per skill, what is missing to reach C, and what to practise next, and that every exercise matches the real exam format.

## Positioning

All four are confirmed and should drive design and copy:

- **Exam-identical format:** all 18 parts with their real format and timings, plus a full timed mock exam.
- **Built for Spanish speakers:** explanations in Spanish and the typical mistakes Spanish speakers make.
- **Estimated level and the gap to C:** an estimated level per skill and a clear next step.
- **Pay per level:** learners pay only up to the level they need. A2 is free and needs no account; B1 9,99 €, B2 14,99 €, C1 19,99 € a month, VAT included, with yearly billing 20 % off. Each plan unlocks its level and every level below.

## Operating Context

- Daily practice on mobile; works offline as a PWA; light, dark and system themes.
- Interface in Spanish and English (`messages/es.json`, `messages/en.json`, identical keys); all English study content in British English.
- Sections: home, placement test (~20 min), dashboard (level per skill, streak, time, weak points, next task, exam countdown), syllabus (lessons, strategies, exercises per skill), practice by part (18 trainers), full mock exam with report, spaced-repetition flashcards, mistakes bank, exam guide, settings (language, listening voice and speed, theme, exam date, export/import), account, plans page.
- Optional accounts (Supabase) sync progress across devices; paid plans require one. Payments through Stripe only.

## Capabilities and Constraints

- Exam format numbers live in `src/lib/exam/format.ts`; app decisions the official format does not fix are labelled as such in the UI.
- Locked content shows as a preview with a lock, never hidden; paid content is protected on the server.
- All study content is original: it imitates the Aptis format and never copies British Council or commercial material.
- No invented official data: any score → CEFR mapping is presented as the app's estimate.
- Unofficial site: a visible non-affiliation notice on every page; no British Council logo, name or corporate colours in the branding. "Aptis ESOL General" appears only descriptively.
- **Open decision: the product name.** The user wants the current name ("Sello") and its passport-with-stamps concept replaced by something more original. The new name is chosen together with the visual direction (phase 10e step 2). It must not use "Aptis" or any British Council name as branding. Renaming later touches the site URL, the Vercel and Supabase projects, Stripe product names, legal pages, metadata and copy.

## Brand Commitments

- Voice: informal "tú", close and direct, like a good private tutor: clear and encouraging without talking down.
- No binding name, logo or visual identity: the current one is being replaced.

## Evidence on Hand

None yet: no testimonials, learner numbers, results or press. Do not show or invent any until the user provides them.

## Product Principles

1. The real exam is the reference: format, timings and task types match it, and anything the app decides on its own is labelled.
2. Always show where the learner stands and the next step to C.
3. Speak to Spanish speakers in their language and about their real mistakes.
4. Honest and transparent: unofficial, no invented data or claims, locked content shown openly with its price.
5. Short daily sessions on a phone come first.

## Accessibility & Inclusion

WCAG AA contrast (enforced by a test that parses `src/app/globals.css`), 48 px touch targets, reflow down to 320 px, motion limited to `transform`/`opacity` and respecting `prefers-reduced-motion`.
