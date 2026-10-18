# Fase 2b: contenido B1–B2 del Core — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** pasar del contenido de muestra a un banco usable: unas 30 lecciones de gramática B1–B2 y unas 150 preguntas en cada parte del Core, de modo que el modo examen (25 + 25) tenga material de sobra y sin repetir enseguida.

**Architecture:** casi todo es contenido JSON en `content/`, redactado por agentes `content-writer` (uno por categoría o tema, nunca dos en el mismo fichero), validado con `npm run validate:content` y revisado a mano. El único código nuevo es un resumen del banco en el informe del validador, para medir el lote y detectar lecciones con pocas preguntas.

**Tech Stack:** el de la fase 2a. Sin dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-10-18-sello-design.md` (§3 formato del Core, §8 modelo de contenido). Guía de redacción: skill `aptis-content`.

## Global Constraints

- Contenido original en inglés británico. English Grammar in Use (egu, 145 unidades) y English Vocabulary in Use Upper-intermediate (evu, 101) solo aportan números de unidad para `references` y para la cobertura. Nada de su texto, ejemplos ni ejercicios entra en el repositorio.
- Grammar: 3 opciones, una sola correcta (también en registro hablado), `optionNotes` en el mismo orden, exactamente un `___`.
- Vocabulary: tareas con banco de palabras compartido (5–12 palabras), cada palabra responde como mucho a un ítem, `usage` con un único `___`; los 4 `vocabType`.
- Ningún dato oficial inventado: las explicaciones no citan umbrales ni puntuaciones.
- Español peninsular neutro y breve en los campos `es`, centrado en errores típicos de hispanohablantes.

## Review Focus

1. **Dos opciones defendibles** en una pregunta de Grammar (sobre todo en registro `spoken`, donde el inglés coloquial tolera más). Pinea: revisión manual de cada fichero en la Task 5, con la regla «si dudas, cambia el distractor».
2. **Lección sin preguntas o con muy pocas**: «Practica este punto» abriría una sesión vacía o de 1–2 preguntas. Pinea: aviso del validador por debajo de 5 preguntas (Task 1).
3. **Banco de vocabulario desequilibrado** (p. ej. casi todo `synonym`): el modo examen no tendría los 4 tipos. Pinea: recuento por tipo en el informe (Task 1) y reparto fijo de tipos por tema (Task 3).
4. **Referencias a unidades equivocadas**: un «Para ampliar» que manda a otra unidad es peor que no tenerlo. Pinea: las unidades de la tabla de la Task 2 se comprueban contra el índice del libro antes de escribirlas; si no hay certeza, se omite la referencia.
5. **Ortografía americana o vocabulario de EE. UU.** (apartment, vacation, fall) en 300 ítems nuevos. Pinea: 0 avisos del validador (Task 5) y revisión de léxico en la misma pasada.

---

## File Structure

```
src/lib/content/validate.ts          + bankStats en el informe, aviso de lección con < 5 preguntas
src/lib/content/validate.test.ts     + tests de bankStats y del aviso
content/grammar/<slug>.json          28 lecciones nuevas (17 B1, 11 B2)
content/exercises/core-grammar/<slug>.json      5 preguntas por lección nueva (140)
content/exercises/core-vocabulary/<topic>.json  10 temas × 3 tareas × 5 ítems (150)
```

Las lecciones C1, el repaso A2, las entradas de vocabulario de los 11 temas, las frases funcionales y los can-do quedan para el 2c, igual que subir cada lección a 9 preguntas.

### Task 1: Resumen del banco en el validador

**Files:**
- Modify: `src/lib/content/validate.ts`
- Test: `src/lib/content/validate.test.ts`

**Interfaces:**
- Produces: `ValidationReport.bank: { grammarByLesson: Record<string, number>; vocabularyByType: Record<"synonym" | "definition" | "usage" | "collocation", number> }` (ítems, no tareas).
- Produces: aviso `Lesson "<slug>" has N Core Grammar questions; aim for at least 5` en el fichero de la lección, con `pointer: "items/<i>"`. Constante `MIN_QUESTIONS_PER_LESSON = 5`.

- [ ] **Step 1: tests que fallan**
  - `bank counts grammar questions per lesson`: dos lecciones, 3 y 0 preguntas → `grammarByLesson` = `{ a: 3, b: 0 }`.
  - `bank counts vocabulary items by type`: una tarea `usage` de 4 ítems y una `synonym` de 5 → `{ synonym: 5, definition: 0, usage: 4, collocation: 0 }`.
  - `warns about lessons with fewer than 5 questions`: la lección con 3 da un aviso con ese texto; con 5, ninguno.
- [ ] **Step 2:** `npx vitest run src/lib/content/validate.test.ts` → FAIL.
- [ ] **Step 3:** implementar y añadir a `formatReport` dos líneas antes del total:
  `Core Grammar: N questions in M lessons (fewest: <slug> K)` y `Core Vocabulary: N items (synonym a, definition b, usage c, collocation d)`.
- [ ] **Step 4:** el test pasa; `npm run validate:content` sobre el contenido actual da 0 errores y 0 avisos (las 3 lecciones de 2a tienen 8–9 preguntas).
- [ ] **Step 5:** commit `feat(content): bank summary and low-question warning in the validator`.

### Task 2: Lecciones de gramática B1–B2

28 lecciones nuevas; con las 2 B1 existentes son 30 B1–B2. `order` en pasos de 10 dentro de cada nivel, siguiendo la tabla. Cada lección: resumen, nota `es`, forma, usos, ejemplos con traducción, errores típicos de hispanohablantes y mini práctica, como `content/grammar/inversion.json`.

| Nivel | order | slug | category | egu (a verificar) |
|---|---|---|---|---|
| B1 | 10 | present-simple-vs-continuous | tenses | 1–4 |
| B1 | 20 | present-perfect-vs-past-simple (existe) | tenses | 13–14 |
| B1 | 30 | second-third-conditionals (existe) | conditionals | 38–40 |
| B1 | 40 | past-simple-vs-continuous | tenses | 5–6 |
| B1 | 50 | present-perfect-continuous | tenses | 9–12 |
| B1 | 60 | past-perfect | tenses | 15–16 |
| B1 | 70 | used-to-and-get-used-to | tenses | 18, 61 |
| B1 | 80 | future-forms | future | 19–23 |
| B1 | 90 | ability-and-permission | modals | 26, 36 |
| B1 | 100 | obligation-and-necessity | modals | 31–32 |
| B1 | 110 | advice-should-had-better | modals | 33–34 |
| B1 | 120 | zero-first-conditionals | conditionals | 25, 37 |
| B1 | 130 | passive-basics | passive | 42–43 |
| B1 | 140 | gerund-or-infinitive | verb-patterns | 53–54 |
| B1 | 150 | indirect-questions | questions | 49–50 |
| B1 | 160 | articles | nouns-articles | 72–76 |
| B1 | 170 | countable-uncountable-quantifiers | nouns-articles | 69–71, 87 |
| B1 | 180 | defining-relative-clauses | relative-clauses | 92–94 |
| B1 | 190 | comparatives-superlatives | adjectives-adverbs | 105–108 |
| B2 | 10 | future-continuous-and-perfect | future | 24 |
| B2 | 20 | modals-of-deduction | modals | 28–30 |
| B2 | 30 | past-modals | modals | 27 |
| B2 | 40 | wishes-and-regrets | conditionals | 40, 59 |
| B2 | 50 | passive-reporting-and-causative | passive | 44–46 |
| B2 | 60 | reported-speech | reported-speech | 47–48 |
| B2 | 70 | verbs-changing-meaning | verb-patterns | 56–58 |
| B2 | 80 | participle-clauses | verb-patterns | 68, 97 |
| B2 | 90 | non-defining-relative-clauses | relative-clauses | 95–96 |
| B2 | 100 | contrast-and-concession | linking | 113 |
| B2 | 110 | condition-and-purpose-linkers | linking | 64, 114–115 |

Las dos lecciones existentes no cambian (ya tienen order 20 y 30).

- [ ] **Step 1: verificar unidades.** La columna egu está hecha de memoria. Antes de lanzar agentes, el usuario la confirma contra el índice del libro (5.ª ed.) o indica dónde está el índice extraído para cotejarlo fuera del repositorio. Una unidad sin confirmar no se escribe y se anota en el informe final.
- [ ] **Step 2: redactar** con 4 agentes `content-writer` en paralelo, agrupados por categoría para que no compartan ficheros: (a) tenses + future, (b) modals + conditionals, (c) passive + reported-speech + verb-patterns + questions, (d) nouns-articles + relative-clauses + adjectives-adverbs + linking. Cada agente recibe slugs, nivel, order, category y referencias verificadas.
- [ ] **Step 3:** `npm run validate:content` → 0 errores, 0 avisos de ortografía. Los avisos de «menos de 5 preguntas» son esperados hasta la Task 3.
- [ ] **Step 4: revisión** de cada lección: explicación correcta, ejemplos originales y naturales, nota en español útil, sin calcos del libro.
- [ ] **Step 5:** commit `content(grammar): 28 B1-B2 lessons`.

### Task 3: Preguntas de Core Grammar y Vocabulary

**Grammar:** un fichero por lección nueva, `cg-<short>-01`…`05` (`<short>` corto y único, p. ej. `pscont`, `modded`), `grammarPoint` = slug. Por lección: dificultades repartidas entre 1 y 5, al menos 1 `spoken` y 3 `written`, temas variados, `explanation.en` en todas y `es` cuando haya trampa típica. Total 140 nuevas (166 con las de 2a).

**Vocabulary:** un fichero por tema (los 10 que faltan además de `work`), 3 tareas de 5 ítems, bancos de 8–10 palabras con distractores del mismo campo. Ids `cv-<topic>-<type>s-NN`. Reparto de tipos para que los 4 queden equilibrados (cada tema omite uno):

| Tema | Tipos |
|---|---|
| education, city, media | definition, usage, collocation |
| technology, culture-leisure | synonym, usage, collocation |
| environment, relationships, shopping-consumption | synonym, definition, collocation |
| health-sport, travel | synonym, definition, usage |

Resultado: synonym 35, definition 40, usage 35, collocation 40 nuevos (150; 175 con `work`).

- [ ] **Step 1: redactar** Grammar con los mismos 4 agentes/grupos de la Task 2 (cada uno escribe las preguntas de sus lecciones) y Vocabulary con 2 agentes más (5 temas cada uno).
- [ ] **Step 2:** `npm run validate:content` → 0 errores, 0 avisos; el resumen debe mostrar `Core Grammar: 166 questions in 31 lessons (fewest: … 5)` y los recuentos por tipo de la tabla (+ los de `work`).
- [ ] **Step 3: revisión** de las 290 preguntas: clave correcta, una sola opción válida, `optionNotes` alineadas, sin palabras repetidas en un banco, léxico británico (flat, holiday, autumn, queue).
- [ ] **Step 4:** commit `content(core): 140 grammar questions and 150 vocabulary items`.

### Task 4: Comprobación en la app

- [ ] **Step 1:** `npm run check` y `npm run build` limpios.
- [ ] **Step 2:** en el navegador (Playwright sin capturas, `read_page`/snapshot): `/es/gramatica` lista las 31 lecciones por nivel; una lección B2 nueva se abre y su «Practica este punto» da 5 preguntas; `/es/practica/core-grammar` y `core-vocabulary` en modo examen dan 25 ítems, y Vocabulary incluye los 4 tipos; filtro B2 solo trae B2; 375 px y oscuro sin desbordes.

### Task 5: Cierre

- [ ] **Step 1:** actualizar «Status» en `CLAUDE.md` (2b hecho, siguiente 2c) y la memoria del proyecto.
- [ ] **Step 2:** commit `docs(claude): close batch 2b`; sincronizar la copia de Documentos con `git -C "C:\Users\RUBEN\Documents\sello-aptis" pull -q "C:\Users\RUBEN\dev\sello-aptis" main`.
- [ ] **Step 3:** informe breve: recuentos finales, cobertura egu, referencias omitidas por no poder verificarlas y nivel de esfuerzo recomendado para el 2c.
