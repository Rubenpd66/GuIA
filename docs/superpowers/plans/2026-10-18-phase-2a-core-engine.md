# Fase 2a: motor del Core — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** que el Core funcione de punta a punta con contenido real de muestra: lecciones de gramática y vocabulario navegables, entrenadores de Grammar y Vocabulary en modo estudio y examen, y progreso guardado en el navegador con banco de errores y exportar/importar.

**Architecture:** el contenido JSON se carga en el servidor durante el build (función con `"use cache"`), se valida con los esquemas de la fase 1 y se indexa. La lógica de los entrenadores (sesiones, barajado, corrección, puntuación, reducer de estado) es TypeScript puro y testeado; los componentes cliente solo la pintan. El progreso es un documento versionado en `localStorage` validado con Zod.

**Tech Stack:** el de la fase 1. Sin dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-10-18-sello-design.md`

## Global Constraints

- Contenido original en inglés británico. English Grammar in Use (5.ª ed., 145 unidades) y English Vocabulary in Use Upper-intermediate (4.ª ed., 101 unidades) solo se usan como índice de cobertura y como referencia «Para ampliar» (libro + número de unidad). Nunca se copia su texto, ejemplos ni ejercicios, y el texto extraído de los PDF no entra en el repositorio.
- Formato del Core según `EXAM_FORMAT`: 25 preguntas de Grammar con 3 opciones y 25 de Vocabulary; Core en 25 minutos. El entrenador de una sola parte usa 12 min 30 s en modo examen (decisión de la app: la mitad proporcional).
- Puntuaciones como estimación: aciertos sobre 25 por parte y sobre 50 el Core. Ningún umbral CEFR oficial.
- Sin dependencias nuevas. Todo el progreso se queda en el navegador.
- Opciones de respuesta ≥ 56 px, teclas 1-2-3 en Grammar, foco visible, sin depender solo del color para acierto/error.

## Review Focus

1. **Barajar las opciones** no puede desalinear la respuesta correcta ni las notas por opción. Pinea: test de `shuffleChoice` (Task 3).
2. **Progreso corrupto o de otra versión** en `localStorage` (JSON roto, campos que faltan) no debe romper la app: se ignora y se empieza de cero. Pinea: test de `parseProgress` (Task 6).
3. **Importar un fichero ajeno** (no es JSON, es de otra app, versión desconocida) debe dar un error claro sin tocar el progreso actual. Pinea: test de `importProgress` (Task 6).
4. **Banco con menos preguntas que una sesión** (p. ej. 12 preguntas y sesión de 25) debe dar una sesión más corta, no un fallo. Pinea: test de `buildGrammarSession` (Task 3).
5. **Rutas de lecciones inexistentes** (`/es/gramatica/no-existe`) deben dar la página 404 traducida. Pinea: comprobación en navegador (Task 7).

---

## File Structure

```
src/config/books.ts                     libros de referencia y su número de unidades
src/lib/content/schemas/lessons.ts      + category, order, references; + VocabularyGroup; VocabularyEntry.sets
src/lib/content/schemas/content-file.ts + kind "vocabulary-groups"
src/lib/content/validate.ts             + grupos de vocabulario y cobertura de libros
src/lib/content/coverage.ts             unidades de cada libro sin lección
src/lib/content/index.ts                buildContentIndex (puro)
src/lib/content/load.ts                 getContent() con "use cache" (servidor)
src/lib/content/markup.ts               parseInline, splitGaps
src/lib/trainer/random.ts               createRng, shuffle
src/lib/trainer/session.ts              buildGrammarSession, buildVocabularySession, shuffleChoice
src/lib/trainer/score.ts                scoreItems
src/lib/trainer/reducer.ts              estado de una sesión (estudio y examen)
src/lib/progress/schema.ts              Progress v1 (Zod)
src/lib/progress/progress.ts            parseProgress, recordSession, mistakeKeys, export/import
src/lib/progress/useProgress.ts         enlace con localStorage (cliente)
src/components/content/RichText.tsx     pinta el marcado en línea
src/components/content/GapSentence.tsx  frase con hueco
src/components/lessons/*                 piezas de la página de lección
src/components/trainer/*                 entrenadores de Grammar y Vocabulary
content/grammar/*.json, content/vocabulary/*.json, content/exercises/core/*.json   contenido de muestra
src/app/[locale]/{syllabus,grammar,grammar/[slug],vocabulary,vocabulary/[slug],exam-guide}/page.tsx
src/app/[locale]/practice/[part]/page.tsx   entrenador real para core-grammar y core-vocabulary
src/app/[locale]/settings/page.tsx          + exportar, importar y borrar progreso
```

### Task 1: Esquemas ampliados

- `BOOKS = { egu: { units: 145 }, evu: { units: 101 } }` y `Reference = { book: "egu" | "evu"; unit: int }`, con la unidad dentro del rango del libro.
- `GrammarLesson` + `category` (tenses, future, modals, conditionals, passive, reported-speech, questions, verb-patterns, nouns-articles, pronouns-determiners, relative-clauses, adjectives-adverbs, linking, prepositions, phrasal-verbs, emphasis), `order` (entero ≥ 1, orden dentro del nivel) y `references` (por defecto `[]`).
- `VOCAB_SETS` = collocations, vague-language, false-friends, formal-informal, idioms, nuance, phrasal-verbs, word-formation, linking-words. `VocabularyEntry.sets?: VocabSet[]`.
- `VocabularyGroup = { slug: Topic sin "general" | VocabSet, title, summary, references }`, kind `vocabulary-groups`.
- Validador: cada topic (salvo `general`) y set usado por una entrada necesita su grupo; slugs de grupo únicos. Informe de cobertura: «English Grammar in Use: N/145 unidades», solo informativo hasta la fase 2c.
- Tests: unidad 146 de egu rechazada; categoría desconocida rechazada; entrada con set sin grupo → error; `findUncoveredUnits` devuelve las unidades sin lección.

### Task 2: Cargador, marcado y contenido de muestra

- `buildContentIndex(files: ContentFile[]): ContentIndex` con `grammarLessons` (ordenadas por nivel y `order`), `vocabularyGroups`, `vocabulary`, `canDo`, `functional`, `exercises`; `lessonBySlug`, `exercisesByPart`.
- `getContent()` lee `content/`, valida (lanza si hay errores) y devuelve el índice; `"use cache"`.
- `parseInline(text)` → nodos `text | strong | em | mark` para `**…**`, `_…_` (un solo guion bajo, nunca dentro de `___`) y `==…==`. `splitGaps(text)` → partes antes/después de cada hueco.
- Contenido de muestra original: 3 lecciones (present-perfect-vs-past-simple B1, second-third-conditionals B1, inversion C1) con 8–9 preguntas de Core Grammar cada una; grupo `work` con 14 entradas y 5 tareas de Core Vocabulary (25 ítems, los 4 tipos).
- Tests de índice y de marcado (incluido que `Hardly ___ had` no se interpreta como cursiva).

### Task 3: Motor de sesiones

- `createRng(seed)` (mulberry32) y `shuffle(items, rng)` deterministas.
- `shuffleChoice({ options, answer, optionNotes }, rng)` mantiene alineadas respuesta y notas.
- `buildGrammarSession({ exercises, count, rng, levels?, grammarPoint?, onlyKeys? })` → como mucho `count` preguntas.
- `buildVocabularySession({ tasks, count, rng, onlyKeys? })` → tareas completas hasta `count` ítems, recortando la última, e intentando incluir los 4 tipos.
- `scoreItems(items, answers)` → `{ correct, total }`.
- `trainerReducer`: estudio (responder → ver explicación → siguiente) y examen (responder y cambiar respuestas, anterior/siguiente, terminar o fin de tiempo).

### Task 4: Páginas de lecciones

- `/syllabus`: bloques Gramática (por nivel), Vocabulario (grupos) y las destrezas con su fase.
- `/grammar`: lecciones por nivel; `/grammar/[slug]`: resumen, nota en español desplegable, forma, usos, ejemplos (traducción desplegable), errores típicos, mini práctica interactiva, «Para ampliar», «Practica este punto» (entrenador filtrado).
- `/vocabulary` y `/vocabulary/[slug]`: grupos y entradas (falsos amigos destacados).
- `params` dentro de `<Suspense>`; slug desconocido → `notFound()`.

### Task 5: Entrenadores

- `/practice/core-grammar` y `/practice/core-vocabulary` pasan de «en preparación» al entrenador: pantalla inicial (modo estudio o examen, nivel, «repasar mis errores» si hay), sesión y resultados.
- Grammar: frase con hueco, 3 opciones grandes, teclas 1-2-3, barra de perforaciones (una por pregunta), temporizador en examen, hoja de explicación con nota por opción en estudio.
- Vocabulary: banco de palabras visible, un `<select>` nativo por ítem, «Comprobar» por tarea en estudio.
- Resultados: aciertos/25 (estimación), lista de fallos con explicación, repetir o repasar errores.

### Task 6: Progreso

- `Progress = { version: 1, attempts: Attempt[] (máx. 200), mistakes: Record<key, { part, count, streak, lastSeen }> }`; clave `exerciseId` o `exerciseId#itemId`.
- `recordSession`: añade el intento; un fallo suma `count` y pone `streak` a 0; un acierto de algo que estaba en el banco suma `streak` y lo saca al llegar a 2.
- `parseProgress(raw)` (corrupto → vacío), `exportProgress`, `importProgress(text)` → `{ ok, progress } | { ok: false, error }`.
- `useProgress()` con `useSyncExternalStore` sobre `localStorage` (`sello:progress`), sincronizado entre pestañas.
- Ajustes: exportar (descarga JSON), importar (fichero), borrar (confirmación). Privacidad actualizada.

### Task 7: Guía del examen y verificación

- `/exam-guide`: formato de las 5 partes desde `EXAM_FORMAT`, cómo se puntúa y por qué el Core puede salvar un C.
- `npm run check`, `format:check`, `build`; navegador a 375 y 1280 px, claro/oscuro, ES/EN; commit y sincronización con Documentos.
