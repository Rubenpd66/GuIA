# Fase 1: Fundamentos — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** dejar un proyecto Next.js que compila, con el sistema de diseño del pasaporte, navegación ES/EN con URLs traducidas, tema claro/oscuro, los esquemas de contenido de las 18 partes y un validador que rompe el build si el contenido es incorrecto.

**Architecture:** App Router con un único segmento `[locale]` como layout raíz (next-intl, locale vía `next/root-params`). Tokens de diseño como variables CSS expuestas a Tailwind con `@theme inline`. Contenido en JSON validado por esquemas Zod puros (`src/lib/content`), sin dependencias de React; la misma librería la usa el script `validate:content` y, desde la fase 2, el cargador de contenido.

**Tech Stack:** Node 24, Next.js 16.4, React 19.3, TypeScript estricto, Tailwind 4.3, next-intl 4.14, next-themes 0.4, Zod 4.6, Vitest 5, tsx, Prettier.

**Spec:** `docs/superpowers/specs/2026-10-18-sello-design.md`

## Global Constraints

- Node ≥ 22.12 (`"engines"` en package.json); se desarrolla con Node 24 LTS.
- Dependencias permitidas en esta fase: next, react, react-dom, typescript, tailwindcss, @tailwindcss/postcss, eslint, eslint-config-next, @types/*, next-intl, zod, next-themes, vitest, tsx, prettier, prettier-plugin-tailwindcss. Ninguna más.
- Sin servicios externos, sin variables de entorno, sin cookies (`localeCookie: false`), sin analítica.
- Contenido en inglés británico; el validador avisa de ortografía americana.
- Copia de interfaz en sentence case, sin mayúsculas en etiquetas (solo dentro de los sellos), sin «Aptis» ni «British Council» en la marca. Nombre de marca en un solo sitio: `src/config/site.ts`.
- Aviso de no afiliación visible en todas las páginas.
- Contraste: los pares de la spec §6 deben pasar (lo pinea el test de contraste).
- Objetivos táctiles ≥ 48 px (controles) y ≥ 56 px (opciones de respuesta). Foco siempre visible.
- `prefers-reduced-motion` respetado en cualquier transición.
- Los números del examen solo viven en `src/lib/exam/format.ts`; las decisiones de la app que el documento oficial no fija se comentan como `// app decision`.

## Review Focus

1. **Cambiar de idioma en una ruta dinámica** (`/es/practica/reading-2` → `/en/practice/reading-2`) debe conservar página y parámetro. Pinea: test de `pathnames` (mismos nombres de parámetro en ambos idiomas) en la Task 5 y comprobación en navegador en la Task 8.
2. **Rutas desconocidas** (`/es/practica/reading-9`, `/fr`, `/es/no-existe`) deben dar un 404 en el idioma correcto o el 404 global bilingüe, nunca un error. Pinea: test de `isExamPart` en la Task 1, `dynamicParams = false` y comprobación en navegador en la Task 8.
3. **JSON guardado en Windows** (BOM UTF-8, saltos CRLF) debe validar igual. Pinea: test de integración del validador con BOM en la Task 3.
4. **Traducciones incompletas** (clave que falta o vacía en un idioma) no deben llegar a producción. Pinea: test de paridad de mensajes en la Task 5.
5. **Tema**: sin destello al cargar, sin avisos de hidratación, respeta el tema del sistema y se recuerda. Pinea: comprobación en navegador y consola limpia en la Task 8.

---

## File Structure

```
package.json, tsconfig.json, next.config.ts, eslint.config.mjs, postcss.config.mjs
.prettierrc.json, .prettierignore, vitest.config.ts, .claude/launch.json, README.md
messages/es.json, messages/en.json
content/README.md                      convenciones del contenido (se llena desde la fase 2)
scripts/validate-content.ts            CLI: lee content/**/*.json y ejecuta validateContentSet
tests/fixtures/content.ts              un ejemplo válido por examPart + lecciones, como objetos
src/proxy.ts                           next-intl middleware
src/global.d.ts                        AppConfig de next-intl
src/config/site.ts                     nombre de marca y URLs
src/config/sections.ts                 secciones, ruta interna y fase en la que llegan
src/i18n/routing.ts | navigation.ts | request.ts
src/lib/exam/format.ts                 EXAM_PARTS, SKILL_OF_PART, EXAM_FORMAT
src/lib/content/text.ts                countWords, countGaps, stripBom, findAmericanSpellings
src/lib/content/schemas/common.ts | core.ts | reading.ts | listening.ts | writing.ts | speaking.ts
src/lib/content/schemas/exercise.ts    unión discriminada por examPart
src/lib/content/schemas/lessons.ts     GrammarLesson, VocabularyEntry, CanDo, FunctionalPhrase
src/lib/content/schemas/content-file.ts unión discriminada por kind
src/lib/content/validate.ts            validateContentSet, formatReport
src/lib/design/contrast.ts             contrastRatio
src/lib/design/css-tokens.ts           parseThemeTokens
src/lib/passport/guilloche.ts          geometría del patrón (hipotrocoide)
src/app/globals.css | fonts.ts | global-not-found.tsx
src/app/[locale]/layout.tsx | page.tsx | not-found.tsx | [...rest]/page.tsx
src/app/[locale]/<sección>/page.tsx    una por ruta de la spec §7 (salvo [slug], fase 2)
src/app/[locale]/practice/[part]/page.tsx
src/app/[locale]/design/page.tsx
src/components/ui/                      button-styles.ts, Button.tsx, ButtonLink.tsx, IconButton.tsx, PageHeader.tsx, EmptyState.tsx, SkipLink.tsx
src/components/icons/Icon.tsx
src/components/theme/ThemeProvider.tsx | ThemeToggle.tsx | ThemeChoice.tsx
src/components/i18n/LocaleSwitcher.tsx
src/components/shell/nav-items.ts | AppShell.tsx | TopBar.tsx | SpineNav.tsx | BottomNav.tsx | MoreDialog.tsx | SiteFooter.tsx
src/components/passport/Guilloche.tsx | Stamp.tsx | PassportCover.tsx
src/components/sections/ComingSoon.tsx  página de sección pendiente (título + fase)
```

Los tests van junto al código (`*.test.ts`), salvo los fixtures.

---

### Task 1: Proyecto base y formato del examen

**Files:**
- Create: proyecto con `create-next-app@16.4.2` (TS, Tailwind, ESLint, App Router, `src/`, alias `@/*`, npm, sin React Compiler)
- Create: `src/lib/exam/format.ts`, `vitest.config.ts`, `.prettierrc.json`, `.prettierignore`, `README.md`
- Modify: `package.json`, `tsconfig.json`
- Test: `src/lib/exam/format.test.ts`

**Interfaces:**
- Produces:
  - `EXAM_PARTS: readonly ['core-grammar','core-vocabulary','reading-1'…'reading-4','listening-1'…'listening-4','writing-1'…'writing-4','speaking-1'…'speaking-4']`
  - `type ExamPart`, `type Skill = 'core'|'reading'|'listening'|'writing'|'speaking'`
  - `SKILL_OF_PART: Record<ExamPart, Skill>`, `isExamPart(value: string): value is ExamPart`
  - `EXAM_FORMAT` (`as const`) con: `core {minutes:25, grammarQuestions:25, grammarOptions:3, vocabularyQuestions:25, vocabularyBank:{min:5,max:12}}`, `reading {minutes:35, part1:{sentences:5,options:3}, part2:{tasks:2,sentences:6}, part3:{people:4,statements:7}, part4:{words:{target:750,min:700,max:800}, headings:8, paragraphs:7}}`, `listening {minutes:40, maxPlays:2, part1:{options:3}, part2:{speakers:4,options:6}, part3:{statements:4}, part4:{questions:2,options:3}}`, `writing {minutes:50, part1:{messages:5,maxWords:5,recommendedMinutes:3}, part2:{words:[20,30],recommendedMinutes:7}, part3:{questions:3,words:[30,40],recommendedMinutes:10}, part4:{informalWords:[40,50],formalWords:[120,150],recommendedMinutes:30}}`, `speaking {minutes:12, part1:{questions:3,answerSeconds:30}, part2:{questions:3,answerSeconds:45}, part3:{images:2,questions:3,answerSeconds:45}, part4:{questions:3,prepSeconds:60,answerSeconds:120}}`, `scores {skillMax:50, grammarVocabularyMax:50, skillsTotalMax:200}`.
  - Comentar `// app decision` en: `vocabularyBank`, `part4.words.min/max` de reading, `listening.part1.options`, `listening.part4.options`, `writing.part1.maxWords`.

- [ ] **Step 1:** scaffold y dependencias aprobadas: `npm i next-intl zod next-themes` y `npm i -D vitest tsx prettier prettier-plugin-tailwindcss`.
- [ ] **Step 2:** `tsconfig.json`: añadir `"noUncheckedIndexedAccess": true`, `"noImplicitOverride": true`. `package.json`: `"engines": {"node": ">=22.12"}` y scripts `typecheck` (`tsc --noEmit`), `lint` (`eslint`), `test` (`vitest run`), `test:watch`, `format`, `format:check`, `validate:content` (`tsx scripts/validate-content.ts content`), `prebuild` (`npm run validate:content`), `check` (typecheck + lint + test + validate:content). `vitest.config.ts` con `resolve.alias` `@` → `./src` e `include: ['src/**/*.test.ts','scripts/**/*.test.ts']`. Prettier con `prettier-plugin-tailwindcss` y `tailwindStylesheet: "./src/app/globals.css"`.
- [ ] **Step 3: test que falla** — `format.test.ts`:

```ts
expect(EXAM_PARTS).toHaveLength(18)
expect(EXAM_FORMAT.core).toMatchObject({ minutes: 25, grammarQuestions: 25, grammarOptions: 3, vocabularyQuestions: 25 })
expect(EXAM_FORMAT.reading.part2).toEqual({ tasks: 2, sentences: 6 })
expect(EXAM_FORMAT.reading.part4).toMatchObject({ headings: 8, paragraphs: 7 })
expect(EXAM_FORMAT.listening).toMatchObject({ minutes: 40, maxPlays: 2 })
expect(EXAM_FORMAT.writing.part4).toMatchObject({ informalWords: [40, 50], formalWords: [120, 150] })
expect(EXAM_FORMAT.speaking.part4).toMatchObject({ prepSeconds: 60, answerSeconds: 120 })
expect(Object.values(SKILL_OF_PART).filter((s) => s === 'reading')).toHaveLength(4)
expect(isExamPart('reading-2')).toBe(true)
expect(isExamPart('reading-9')).toBe(false)
```

- [ ] **Step 4:** `npm test` → FAIL (módulo no existe). Implementar `format.ts`. `npm test` → PASS.
- [ ] **Step 5:** `npm run typecheck && npm run lint && npm run build` → sin errores (el `prebuild` aún no existe hasta la Task 3: crear `scripts/validate-content.ts` mínimo que imprime «0 files» y sale con 0).
- [ ] **Step 6: Commit** `chore: scaffold Next.js 16 project and exam format constants`.

### Task 2: Utilidades de texto

**Files:** Create `src/lib/content/text.ts`; Test `src/lib/content/text.test.ts`

**Interfaces:**
- Produces: `countWords(text: string): number`, `countGaps(text: string): number` (huecos = `/_{3,}/g`), `stripBom(text: string): string`, `findAmericanSpellings(text: string): { word: string; british: string; index: number }[]`.
- `countWords` cuenta secuencias `/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu`.
- `findAmericanSpellings` usa un mapa de formas exactas (minúsculas, con flexiones: color/colors/colored, favorite/favorites, organize/organized/organizes/organizing/organization, realize/…, recognize/…, apologize/…, analyze/…, center/centers, theater/theaters, behavior/behaviors, neighbor/neighbors/neighborhood, honor, labor, humor, flavor, traveled/traveling/traveler, canceled/canceling, gray, defense, offense, catalog, fulfill, enroll, jewelry, mom, skeptical, aluminum, airplane), con límites de palabra, sin distinguir mayúsculas y conservando la mayúscula inicial en la sugerencia.

- [ ] **Step 1: test que falla:**

```ts
expect(countWords("It's a well-known fact — honestly.")).toBe(5)
expect(countWords('')).toBe(0)
expect(countWords('  Hello,\r\n\r\nworld!  ')).toBe(2)
expect(countWords('I paid £30-odd for it')).toBe(5)
expect(countWords('don’t')).toBe(1)
expect(countGaps('Hardly ___ we arrived when ______ left.')).toBe(2)
expect(stripBom('﻿{"a":1}')).toBe('{"a":1}')
expect(findAmericanSpellings('My favorite Color')).toEqual([
  { word: 'favorite', british: 'favourite', index: 3 },
  { word: 'Color', british: 'Colour', index: 12 },
])
expect(findAmericanSpellings('A colourful neighbourhood')).toEqual([])
```

- [ ] **Step 2:** `npx vitest run src/lib/content/text.test.ts` → FAIL. Implementar. → PASS.
- [ ] **Step 3: Commit** `feat(content): text utilities for word counts, gaps and British spelling`.

### Task 3: Esquemas de contenido y validador

**Files:**
- Create: `src/lib/content/schemas/{common,core,reading,listening,writing,speaking,exercise,lessons,content-file}.ts`, `src/lib/content/validate.ts`, `tests/fixtures/content.ts`, `scripts/validate-content.ts`, `content/README.md`
- Test: `src/lib/content/schemas/exercise.test.ts`, `src/lib/content/schemas/lessons.test.ts`, `src/lib/content/validate.test.ts`, `scripts/validate-content.test.ts`

**Interfaces:**
- Consumes: `EXAM_FORMAT`, `EXAM_PARTS` (Task 1); `countWords`, `countGaps`, `stripBom`, `findAmericanSpellings` (Task 2).
- Produces (todos exportan el esquema y su tipo `z.infer` con el mismo nombre):
  - `common.ts`: `CefrLevel` (`A2|B1|B2|C1`), `Topic` (work, education, technology, environment, health-sport, travel, city, culture-leisure, relationships, shopping-consumption, media, general), `Difficulty` (entero 1–5), `LocalizedText` (`{ en: string≥1; es?: string≥1 }`), `Slug` (`/^[a-z0-9]+(?:-[a-z0-9]+)*$/`), `uniqueOptions(n: number)` (array de n strings no vacíos y distintos), `exerciseBase` (`id: Slug, cefrLevel, topic, difficulty`).
  - `core.ts`: `CoreGrammarExercise` = base + `examPart:'core-grammar'`, `register: 'written'|'spoken'`, `grammarPoint: Slug`, `prompt` (exactamente 1 hueco), `options: uniqueOptions(3)`, `answer: 0|1|2`, `explanation: LocalizedText`, `optionNotes: [LocalizedText ×3]` (por qué cada opción es correcta o no). `CoreVocabularyExercise` = base + `examPart:'core-vocabulary'`, `vocabType: 'synonym'|'definition'|'usage'|'collocation'`, `instructions?: string`, `options` (banco único de 5–12), `items` (1–10) de `{ id: Slug, prompt, answer: índice del banco, explanation }`; respuestas distintas entre ítems; en `usage` cada `prompt` lleva exactamente 1 hueco.
  - `reading.ts`: `Reading1Exercise` (`context?`, `items` = exactamente 5 de `{prompt con 1 hueco, options: uniqueOptions(3), answer 0–2, explanation}`), `Reading2Exercise` (una tarea; `title?`, `sentences` = 6 strings distintos en el orden correcto, el primero fijo; `explanation`; `cohesionHints?: {sentence: 1–5, phrase: string, refersTo: 0–5}[]`, `phrase` debe aparecer en esa frase), `Reading3Exercise` (`question`, `people` = 4 `{name, text}`, `statements` = 7 `{text, answer: 0–3, explanation}`), `Reading4Exercise` (`title`, `paragraphs` = 7, `headings` = 8 distintos, `answers` = 7 índices distintos 0–7, `explanations` = 7 `LocalizedText`; total de palabras de `paragraphs` entre 700 y 800).
  - `listening.ts`: `ScriptLine` (`{speaker: 'man'|'woman'|'narrator', text}`), `Script` (≥ 1 línea), `AudioSource` (`{ src: string }` opcional en cada ejercicio como `audio?`), `Listening1Exercise` (`context`, `script`, `question`, `options: uniqueOptions(3)`, `answer`, `explanation`), `Listening2Exercise` (`question`, `options` = 6 únicos, `speakers` = 4 `{script, answer}` con respuestas distintas, `explanation`), `Listening3Exercise` (`question`, `script` con al menos una línea de `man` y una de `woman`, `statements` = 4 `{text, answer:'man'|'woman'|'both', explanation}`), `Listening4Exercise` (`script`, `questions` = 2 `{prompt, options: uniqueOptions(3), answer, explanation, cues: string[]≥1}`).
  - `writing.ts`: `AnnotatedText` (`{text, annotations: {quote, kind: 'connector'|'advanced-structure'|'register'|'vocabulary', note: LocalizedText}[]}`; cada `quote` aparece en `text`), `ModelPair` (`{b2: AnnotatedText, c: AnnotatedText}`), `Writing1Exercise` (`context`, `messages` = 5 `{prompt, sampleAnswers: string[]≥1}` con 1–5 palabras cada respuesta), `Writing2Exercise` (`context`, `prompt`, `models` en 20–30 palabras), `Writing3Exercise` (`context`, `questions` = 3 `{prompt, models}` en 30–40), `Writing4Exercise` (`context`, `situation`, `informal: {prompt, models}` en 40–50, `formal: {prompt, recipient, models}` en 120–150).
  - `speaking.ts`: `SceneImage` (`{ sceneId: Slug, alt: LocalizedText }`), `StructuredAnswer` (`{ segments: {role:'intro'|'development'|'example'|'speculation'|'conclusion', text}[]≥1 }`), `SpeakingQuestion` (`{prompt, models: {b2: StructuredAnswer, c: StructuredAnswer}}`), `Speaking1Exercise` (3 preguntas), `Speaking2Exercise` (`image`, 3 preguntas), `Speaking3Exercise` (`images` = 2, 3 preguntas), `Speaking4Exercise` (`image`, 3 preguntas).
  - `exercise.ts`: `Exercise = z.discriminatedUnion('examPart', [...18])`. En Zod 4 los `.superRefine` no envuelven el objeto, así que los miembros siguen siendo válidos para la unión.
  - `lessons.ts`: `GrammarLesson` (`slug`, `level`, `title`, `summary`, `form: string[]≥1`, `uses: {text, note?: LocalizedText}[]≥1`, `mistakes: {wrong, right, why: LocalizedText}[]≥1`, `examples: {en, es?}[]` de 8 a 12, `practice` = ≥ 3 `{prompt con 1 hueco, options: uniqueOptions(3), answer, explanation}`, `canDo: Slug[]`), `VocabularyEntry` (`id`, `headword`, `pos`, `level`, `topics: Topic[]≥1`, `definition`, `examples: string[]≥1`, `collocations?`, `synonyms?`, `register?: 'formal'|'informal'|'neutral'`, `falseFriend?: {spanish, trap: LocalizedText}`), `CanDo` (`id`, `level: B1|B2|C1`, `skill: 'spoken-interaction'|'spoken-production'|'listening'|'reading'|'writing'|'strategies'`, `text: LocalizedText`, `links: {lessons: Slug[], parts: ExamPart[]}`), `FunctionalPhrase` (`id`, `function: 'opinion'|'hedging'|'contrast'|'addition'|'conclusion'|'speculation'|'comparison'|'buying-time'|'interrupting'|'returning'`, `register`, `phrase`, `example`).
  - `content-file.ts`: `ContentFile = z.discriminatedUnion('kind', [{kind:'exercises', items: Exercise[]}, {kind:'grammar-lessons', items: GrammarLesson[]}, {kind:'vocabulary', items: VocabularyEntry[]}, {kind:'can-do', items: CanDo[]}, {kind:'functional-language', items: FunctionalPhrase[]}])`.
  - `validate.ts`: `type ContentSource = { path: string; raw: string }`, `type ContentIssue = { path: string; pointer: string; message: string }`, `type ValidationReport = { errors: ContentIssue[]; warnings: ContentIssue[]; files: number; items: Record<ContentFile['kind'], number> }`, `validateContentSet(sources: ContentSource[]): ValidationReport`, `formatReport(report: ValidationReport): string`.
  - `scripts/validate-content.ts`: `readContentDir(dir: string): Promise<ContentSource[]>` (recursivo, `*.json`, ignora `README.md`) y ejecución que imprime `formatReport` y sale con código 1 si hay errores.
  - `tests/fixtures/content.ts`: `validExercises: Record<ExamPart, unknown>`, `validLessons: { grammar, vocabulary, canDo, functional }`, helper `words(n: number): string`. Contenido original y breve; el texto de Reading 4 se genera con `words()`.

Reglas de `validateContentSet`: quitar BOM → `JSON.parse` (error = issue con puntero `/`) → `ContentFile.safeParse` (puntero = `issue.path.join('/')`) → IDs duplicados (error; espacio único para ids de ejercicios e ítems de vocabulary, otro para slugs de lecciones, vocabulario, can-do y frases) → referencias (error): `grammarPoint` y `CanDo.links.lessons` deben existir entre los slugs de lecciones de gramática; `GrammarLesson.canDo` entre los ids de can-do → ortografía americana en cualquier string fuera de claves `es` (warning).

- [ ] **Step 1: tests que fallan** — `exercise.test.ts`: cada fixture válido pasa (`it.each(EXAM_PARTS)`), y `it.each` de mutaciones que deben fallar, cada una sobre un `structuredClone` del fixture:

| Parte | Mutación |
|---|---|
| core-grammar | 2 opciones; `answer: 3`; prompt sin hueco; prompt con 2 huecos; opciones duplicadas; 2 `optionNotes` |
| core-vocabulary | `answer` fuera del banco; dos ítems con la misma respuesta; ítem `usage` sin hueco; banco de 4 |
| reading-1 | 4 ítems |
| reading-2 | 5 frases; frase duplicada; `cohesionHints.phrase` que no está en la frase |
| reading-3 | 3 personas; `answer: 4`; 6 afirmaciones |
| reading-4 | párrafos con 690 palabras; con 810; `answers` con un encabezado repetido; 6 párrafos |
| listening-1 | 2 opciones |
| listening-2 | 5 opciones; dos hablantes con la misma respuesta |
| listening-3 | guion solo con `man`; `answer: 'nobody'` |
| listening-4 | pregunta sin `cues` |
| writing-1 | 4 mensajes; respuesta de 6 palabras |
| writing-2 | modelo C de 31 palabras |
| writing-3 | modelo B2 de 41 palabras |
| writing-4 | formal C de 119 palabras; informal de 51; anotación cuyo `quote` no está en el texto |
| speaking-1 | 2 preguntas |
| speaking-3 | 1 imagen |
| speaking-4 | 2 preguntas |

  `lessons.test.ts`: fixtures válidos pasan; lección con 7 ejemplos falla; con 13 falla; slug `"present perfect"` falla; `CanDo` con parte `'reading-9'` falla.
  `validate.test.ts`: conjunto válido → 0 errores; id repetido entre dos ficheros → error que nombra ambos; `grammarPoint` inexistente → error; JSON roto → error con puntero `/`; texto con `color` → 1 warning y 0 errores; texto con `color` dentro de `es` → 0 warnings.
  `validate-content.test.ts`: escribe los fixtures en un directorio temporal (`fs.mkdtemp`), uno de ellos con BOM y CRLF, y comprueba que `readContentDir` + `validateContentSet` dan 0 errores.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** implementar esquemas, `validate.ts`, fixtures y CLI. `content/README.md` explica el formato `{kind, items}`, el marcado en línea y `npm run validate:content`.
- [ ] **Step 4:** `npm test` → PASS. `npm run validate:content` → «0 files, 0 errors» y código 0.
- [ ] **Step 5: Commit** `feat(content): Zod schemas for the 18 exam parts and content validator`.

### Task 4: Tokens de diseño, fuentes y test de contraste

**Files:**
- Create: `src/app/fonts.ts`, `src/lib/design/contrast.ts`, `src/lib/design/css-tokens.ts`
- Modify: `src/app/globals.css`
- Test: `src/lib/design/contrast.test.ts`, `src/lib/design/theme-tokens.test.ts`

**Interfaces:**
- Produces:
  - `contrastRatio(foreground: string, background: string): number` (fórmula WCAG 2.1, hex `#RRGGBB`).
  - `parseThemeTokens(css: string): { light: Record<string, string>; dark: Record<string, string> }` — lee `--nombre: #hex;` dentro de `:root { … }` y de `[data-theme="dark"] { … }`.
  - Variables CSS (valores de la spec §6): `--paper --sheet --ink --ink-soft --line --hairline --cover --on-cover --foil --entry --refusal --guilloche --focus`.
  - Tailwind: `@theme { --color-*: initial; }` y `@theme inline` que mapea `--color-<token>: var(--<token>)`; fuentes `--font-sans: var(--font-archivo)`, `--font-serif: var(--font-literata)`; escala `--text-xs` 0.75rem, `--text-sm` 0.85rem, `--text-base` 1.0625rem, `--text-lg` 1.328rem, `--text-xl` 1.66rem, `--text-2xl` 2.075rem, `--text-3xl` 2.594rem, `--text-4xl` 3.242rem; radios `--radius-page: 10px`, `--radius-control: 6px`; `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *))`.
  - Base: `body` con `bg-paper text-ink font-sans`; `:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px }`; clase `.on-cover` que redefine `--focus: var(--foil)`; `.prose-reading` (Literata, interlineado 1.65, `max-width: 68ch`); bloque `@media (prefers-reduced-motion: reduce)` que reduce animaciones y transiciones a 0.01ms.
  - `fonts.ts`: `archivo` (`Archivo`, `axes: ['wdth']`, `variable: '--font-archivo'`) y `literata` (`Literata`, `axes: ['opsz']`, `style: ['normal','italic']`, `variable: '--font-literata'`), `subsets: ['latin','latin-ext']`, `display: 'swap'`. Antes, comprobar en `node_modules/next/dist/compiled/@next/font/dist/google/font-data.json` que ambos ejes existen.

- [ ] **Step 1: tests que fallan:**

```ts
// contrast.test.ts
expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1)
expect(contrastRatio('#1A2332', '#EEF2EF')).toBeCloseTo(13.97, 1)

// theme-tokens.test.ts: lee src/app/globals.css
const PAIRS = [
  ['ink','paper',4.5], ['ink','sheet',4.5], ['ink-soft','paper',4.5], ['ink-soft','sheet',4.5],
  ['on-cover','cover',4.5], ['foil','cover',4.5],
  ['entry','paper',4.5], ['entry','sheet',4.5], ['refusal','paper',4.5], ['refusal','sheet',4.5],
  ['line','paper',3], ['line','sheet',3], ['focus','paper',3],
] as const
// it.each sobre light y dark: contrastRatio(tokens[t][fg], tokens[t][bg]) >= min
// y además: ambos temas definen exactamente el mismo conjunto de tokens
```

- [ ] **Step 2:** FAIL → implementar → PASS.
- [ ] **Step 3: Commit** `feat(design): passport tokens, fonts and contrast guard`.

### Task 5: Internacionalización y rutas traducidas

**Files:**
- Create: `src/i18n/routing.ts`, `src/i18n/navigation.ts`, `src/i18n/request.ts`, `src/proxy.ts`, `src/global.d.ts`, `src/config/site.ts`, `src/config/sections.ts`, `messages/es.json`, `messages/en.json`
- Modify: `next.config.ts`
- Test: `src/i18n/routing.test.ts`, `src/i18n/messages.test.ts`

**Interfaces:**
- Produces:
  - `routing = defineRouting({ locales: ['es','en'], defaultLocale: 'es', localePrefix: 'always', localeCookie: false, pathnames })` con la tabla de la spec §7, incluidos `/grammar/[slug]`, `/vocabulary/[slug]` y `/practice/[part]`.
  - `type Locale = (typeof routing.locales)[number]`, `type Pathname = keyof typeof routing.pathnames`.
  - `navigation.ts`: `Link, redirect, usePathname, useRouter, getPathname` de `createNavigation(routing)`.
  - `request.ts`: `getRequestConfig` que lee `rootParams.locale()`, valida con `hasLocale` (si no, `notFound()`) y carga `messages/${locale}.json`.
  - `proxy.ts`: `createMiddleware(routing)` con `matcher: '/((?!api|_next|_vercel|.*\\..*).*)'`.
  - `next.config.ts`: `createNextIntlPlugin()` envolviendo `{ experimental: { globalNotFound: true } }`.
  - `site.ts`: `SITE = { name: 'Sello', defaultLocale: 'es' } as const`.
  - `sections.ts`: `type SectionKey = 'dashboard'|'placementTest'|'syllabus'|'grammar'|'vocabulary'|'reading'|'listening'|'writing'|'speaking'|'practice'|'mockExam'|'flashcards'|'mistakes'|'examGuide'|'settings'`; `SECTIONS: Record<SectionKey, { pathname: Pathname; phase: number }>` con fases: dashboard 7, placementTest 7, syllabus 2, grammar 2, vocabulary 2, reading 3, listening 4, writing 5, speaking 6, practice 2, mockExam 7, flashcards 7, mistakes 7, examGuide 2, settings 1; `PHASE_OF_SKILL: Record<Skill, number>` (core 2, reading 3, listening 4, writing 5, speaking 6).
  - Mensajes (mismas claves en ambos idiomas): `Metadata {title, description}`, `Nav {home, mainNav, skipToContent, more, moreTitle, close, <SectionKey>…}`, `Theme {toggle, choose, light, dark, system}`, `Locale {label, es, en}`, `Footer {disclaimer, legalNotice, privacy}`, `Home {…}`, `Sections {<SectionKey>: {title, lead}}`, `Coming {title, body, back}` (`body` con `{phase}`), `Parts {<ExamPart>: nombre}`, `Skills {core, reading, listening, writing, speaking}`, `Settings {…}`, `Legal {…}`, `Privacy {…}`, `NotFound {title, body, home}`, `Design {…}`.
  - Copia fija: `Footer.disclaimer` es = «Sello es una web independiente y no oficial. No está afiliada al British Council ni cuenta con su aprobación. Aptis ESOL General es un examen del British Council.»; en = «Sello is an independent, unofficial website. It is not affiliated with or endorsed by the British Council. Aptis ESOL General is a British Council exam.» `Parts` usa los nombres del formato del examen en inglés en ambos idiomas (Grammar, Vocabulary, Sentence comprehension, Text cohesion, Opinion matching, Long text comprehension, Information recognition, Information matching, Opinion matching, Monologue comprehension, Word-level writing, Short text writing, Three written responses, Formal and informal writing, Personal information, Describe a photo, Compare two pictures, Discuss an abstract topic).

- [ ] **Step 1: tests que fallan:**

```ts
// routing.test.ts
// para cada entrada de routing.pathnames: si es objeto, tiene 'es' y 'en'
// las rutas externas son únicas dentro de cada idioma
// los segmentos dinámicos ([slug], [part]) son los mismos en la ruta interna, es y en
// toda SECTIONS[k].pathname existe en routing.pathnames
expect(routing.pathnames['/practice/[part]']).toEqual({ es: '/practica/[part]', en: '/practice/[part]' })

// messages.test.ts
// es.json y en.json tienen exactamente el mismo conjunto de claves (recorrido profundo)
// ningún valor es una cadena vacía
// Parts tiene una clave por cada EXAM_PARTS y Sections una por cada SectionKey
```

- [ ] **Step 2:** FAIL → implementar → PASS. `npm run typecheck` → sin errores (AppConfig con `Locale` y `Messages: typeof en`).
- [ ] **Step 3: Commit** `feat(i18n): localized routing for es/en with typed messages`.

### Task 6: Componentes base y shell de la aplicación

**Files:**
- Create: `src/components/ui/*`, `src/components/icons/Icon.tsx`, `src/components/theme/*`, `src/components/i18n/LocaleSwitcher.tsx`, `src/components/shell/*`
- Create: `src/app/[locale]/layout.tsx`, `src/app/[locale]/not-found.tsx`, `src/app/[locale]/[...rest]/page.tsx`, `src/app/global-not-found.tsx`
- Delete: `src/app/layout.tsx`, `src/app/page.tsx` del scaffold (y los SVG de `public/` del scaffold)

**Interfaces:**
- Consumes: tokens (Task 4), `routing`, `Link`, `usePathname`, `SECTIONS` (Task 5).
- Produces:
  - `buttonClasses(variant: 'primary'|'secondary'|'ghost', size?: 'md'|'lg'): string`; `Button` (`<button>`), `ButtonLink` (next-intl `Link`) con las mismas props de variante; altura mínima 48 px (`lg`: 56 px). `primary` = `bg-cover text-on-cover`; `secondary` = borde `line`; `ghost` = sin borde.
  - `IconButton({ label: string; children; ...buttonProps })` con `aria-label={label}`, 48×48.
  - `PageHeader({ title: string; lead?: string })`, `EmptyState({ title: string; body: string; action?: ReactNode })`, `SkipLink({ targetId?: string })` (por defecto `main`).
  - `Icon({ name: IconName; className? })` con `aria-hidden`; `IconName` = `dashboard|syllabus|practice|mockExam|more|placementTest|flashcards|mistakes|examGuide|settings|sun|moon|close`. Trazos originales de 24 px, `stroke-width` 1.75, `currentColor`.
  - `ThemeProvider` (next-themes con `attribute="data-theme"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`); `ThemeToggle` (alterna claro/oscuro según `resolvedTheme`; iconos sol/luna mostrados por CSS con `dark:`, para no provocar avisos de hidratación; `aria-label` fijo `Theme.toggle`); `ThemeChoice` (grupo de radio Sistema/Claro/Oscuro para Ajustes; renderiza el estado solo tras montar).
  - `LocaleSwitcher`: dos enlaces `Link` de next-intl con `href={{ pathname, params }}` y `locale`, `hrefLang`, `lang` y `aria-current` en el activo; usa `usePathname()` y `useParams()`.
  - `nav-items.ts`: `type NavItem = { key: SectionKey; icon: IconName }`, `PRIMARY_NAV` (dashboard, syllabus, practice, mockExam), `MORE_NAV` (placementTest, flashcards, mistakes, examGuide, settings); la ruta sale de `SECTIONS[key].pathname`.
  - `isActive(current: string, target: string): boolean` (igual o `current.startsWith(target + '/')`), exportada desde `nav-items.ts` con test.
  - `TopBar` (solo < lg: marca, `LocaleSwitcher`, `ThemeToggle`), `SpineNav` (≥ lg: lomo `bg-cover on-cover` con marca, `PRIMARY_NAV` y `MORE_NAV`, idioma y tema al pie), `BottomNav` (< lg: `PRIMARY_NAV` + botón Más; `aria-current="page"`; respeta `env(safe-area-inset-bottom)`), `MoreDialog` (`<dialog>` nativo con `showModal`, cierra con Esc y al navegar, devuelve el foco al botón), `SiteFooter` (aviso + enlaces a aviso legal y privacidad), `AppShell` (compone todo; `<main id="main" tabIndex={-1}>`).
  - `[locale]/layout.tsx`: `generateStaticParams` por idioma, `setRequestLocale`, `<html lang={locale} suppressHydrationWarning>` con las variables de fuentes, `NextIntlClientProvider`, `ThemeProvider`, `SkipLink`, `AppShell`; `generateMetadata` con `title.template` `%s | Sello`, descripción por idioma y `metadataBase` pendiente de dominio (fase 8).
  - `[locale]/not-found.tsx` localizado; `[...rest]/page.tsx` llama a `notFound()`; `global-not-found.tsx` bilingüe con enlaces a `/es` y `/en`, importando `globals.css` y fuentes.

- [ ] **Step 1: test que falla** — `src/components/shell/nav-items.test.ts`:

```ts
expect(isActive('/practice/[part]', '/practice')).toBe(true)
expect(isActive('/practice', '/practice')).toBe(true)
expect(isActive('/practice-old', '/practice')).toBe(false)
expect(isActive('/', '/dashboard')).toBe(false)
expect(new Set([...PRIMARY_NAV, ...MORE_NAV].map((i) => i.key)).size).toBe(9)
```

- [ ] **Step 2:** FAIL → implementar → PASS. `npm run typecheck && npm run lint` → sin errores.
- [ ] **Step 3: Commit** `feat(shell): base components, theme, locale switcher and navigation shell`.

### Task 7: Páginas, primitivas del pasaporte y página de diseño

**Files:**
- Create: `src/lib/passport/guilloche.ts`, `src/components/passport/{Guilloche,Stamp,PassportCover}.tsx`, `src/components/sections/ComingSoon.tsx`
- Create: `src/app/[locale]/page.tsx` y una `page.tsx` por sección de `SECTIONS`, `src/app/[locale]/practice/[part]/page.tsx`, `src/app/[locale]/legal-notice/page.tsx`, `src/app/[locale]/privacy/page.tsx`, `src/app/[locale]/design/page.tsx`
- Test: `src/lib/passport/guilloche.test.ts`

**Interfaces:**
- Consumes: todo lo anterior.
- Produces:
  - `guillochePath(o: { cx: number; cy: number; R: number; r: number; d: number; steps: number }): string` — hipotrocoide `x = (R−r)·cos t + d·cos((R−r)/r·t)`, `y = (R−r)·sin t − d·sin((R−r)/r·t)`, con `t` de 0 a `2π·r/gcd(R,r)`, redondeo a 2 decimales, `M` + `L`s + `Z`.
  - `Guilloche({ className?, variant: 'rosette'|'band' })` (decorativo, `aria-hidden`, trazo `guilloche`).
  - `Stamp({ skill: Skill; level: 'A2'|'B1'|'B2'|'C'; caption: string; date?: string; tone?: 'entry'|'foil'|'ink'; rotate?: number })`: SVG con `role="img"` y `aria-label` («Sello {level}, {caption}»); forma por destreza (core círculo, reading rectángulo con esquinas recortadas, listening óvalo, writing hexágono, speaking triángulo redondeado); texto del borde en mayúsculas con Archivo expandida.
  - `PassportCover({ className? })`: tapa burdeos con roseta guilloche en `foil`, «Sello» y «Language passport»; decorativa (`aria-hidden`), el texto real va en el `h1` de la página.
  - `ComingSoon({ section: SectionKey })`: `PageHeader` con `Sections.<key>` + `EmptyState` con `Coming.body` y la fase de `SECTIONS`.
  - Páginas: todas llaman a `setRequestLocale` y exportan `generateMetadata` con su título. Inicio: `h1` «Prepárate el Aptis ESOL General y llega al C» / «Prepare for Aptis ESOL General and reach C», entrada «Lecciones, práctica de las 18 partes y simulacros con tiempos reales, pensados para hispanohablantes.», botones «Haz el test de nivel» (→ `/placement-test`) y «Empieza a estudiar» (→ `/syllabus`), `PassportCover`, y la lista de las 5 destrezas con sus partes enlazando a `/practice/[part]`. `practice/[part]`: `generateStaticParams` sobre `EXAM_PARTS`, `dynamicParams = false`, título `Parts.<part>`, fase según `PHASE_OF_SKILL[SKILL_OF_PART[part]]`. `settings`: `ThemeChoice` + `LocaleSwitcher` operativos y el resto como pendiente por fases (voz: 4, fecha de examen: 7, exportar/importar: 2). `legal-notice`: no afiliación, originalidad del contenido y titular «se completará antes de publicar la web» (fase 8). `privacy`: hoy solo se guarda la preferencia de tema en `localStorage` (clave `theme`); sin cookies, analítica ni cuentas. `design`: `robots: { index: false }`, muestras de tokens, escala tipográfica, botones, foco, guilloche y 5 sellos.
  - Mayúsculas solo dentro de `Stamp`; sin numeración decorativa salvo «Part N».

- [ ] **Step 1: test que falla:**

```ts
const p = guillochePath({ cx: 50, cy: 50, R: 5, r: 3, d: 5, steps: 200 })
expect(p.startsWith('M')).toBe(true)
expect(p.endsWith('Z')).toBe(true)
expect(p.match(/L/g)).toHaveLength(200)
expect(guillochePath({ cx: 50, cy: 50, R: 5, r: 3, d: 5, steps: 200 })).toBe(p)
```

- [ ] **Step 2:** FAIL → implementar → PASS.
- [ ] **Step 3:** `npm run build` → sin errores; todas las rutas de la spec §7 (salvo `[slug]`) se generan estáticas en `es` y `en`.
- [ ] **Step 4: Commit** `feat(pages): home, section placeholders, settings, legal pages and passport primitives`.

### Task 8: Verificación de la fase

**Files:** Create `.claude/launch.json` (`npm run dev`, puerto 3000). Modify lo que haga falta según lo encontrado.

- [ ] **Step 1:** `npm run check && npm run format:check && npm run build` → todo en verde.
- [ ] **Step 2:** navegador integrado a 375×812 y 1280×800, en claro y oscuro, en `/es` y `/en`:
  - `/` redirige a `/es` (o `/en` si el navegador lo pide).
  - Cada enlace de navegación abre su sección; `aria-current` correcto.
  - `/es/practica/reading-2` → cambiar a EN → `/en/practice/reading-2`.
  - `/es/practica/reading-9`, `/fr` y `/es/no-existe` → 404 sin error.
  - Tema: sin destello al recargar, se recuerda, «Sistema» sigue al sistema; consola sin avisos de hidratación.
  - Solo teclado: enlace de saltar, foco visible en todo, el diálogo Más se abre, atrapa el foco, se cierra con Esc y devuelve el foco.
  - Aviso de no afiliación visible en todas las páginas; sin desbordamiento horizontal a 375 px.
- [ ] **Step 3:** corregir lo encontrado y repetir el paso 1.
- [ ] **Step 4: Commit** `chore: phase 1 verification fixes` (si hubo cambios).

---

## Desviaciones durante la ejecución (2026-10-18)

- `create-next-app@16.4.2` integra Tailwind con `@tailwindcss/turbopack` (no PostCSS) y activa `cacheComponents` y `partialPrefetching`. Se mantienen.
- `@types/node` sube a 24: Vitest 5 exige ≥ 22.
- `vitest.config.ts` pasa a `vitest.config.mts` (ESM en un proyecto CommonJS).
- `typecheck` ejecuta `next typegen` antes de `tsc` para generar `PageProps`, `LayoutProps` y `next/root-params`.
- `readContentDir` vive en `src/lib/content/fs.ts` (testeable) y el script solo lo invoca.
- `dynamicParams` no existe con Cache Components: las partes desconocidas llaman a `notFound()` dentro de `<Suspense>` (navegación instantánea). Como el streaming ya empezó, responden 200 con `<meta name="robots" content="noindex">` y la página 404.
- La ruta comodín `[...rest]` exporta `instant = false`: solo pinta el 404.
- La página `/design` lee `globals.css` dentro de una función con `"use cache"`.
- Nuevo token `foil-ink` (#86651C / #D6B062): el oro normal sobre papel quedaba en 2.16:1.
- next-themes provoca en `next dev` el aviso «Encountered a script tag…» por la validación de navegación instantánea de Next 16.4; no aparece en producción (comprobado con `next start`).
