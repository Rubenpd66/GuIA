# Fase 2c: gramática A2–C1 y cobertura del libro — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** completar el temario de gramática: repaso A2, las unidades de English Grammar in Use que aún faltan y las estructuras C1 que más pesan para llegar al C, con 5 preguntas de Core Grammar por lección nueva.

**Architecture:** solo contenido JSON, redactado por 5 agentes `content-writer` (grupos sin ficheros compartidos), validado con `npm run validate:content` y revisado pregunta a pregunta. Sin código nuevo: el validador del 2b ya mide el banco y avisa de lecciones con menos de 5 preguntas.

**Tech Stack:** el de la fase 2a. Sin dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-10-18-sello-design.md` (§3, §8). Guía: skill `aptis-content`. Plan anterior: `2026-10-18-phase-2b-core-content.md`.

## Alcance y reparto con el 2d

El 2c original (lecciones, vocabulario, frases funcionales, can-do y 300 + 300 preguntas) no cabe en un lote revisable. Se divide:

- **2c (este plan):** 34 lecciones nuevas (65 en total) y 170 preguntas de Grammar (336 en total). egu pasa de 76/145 a 144/145.
- **2d (plan aparte):** grupos de vocabulario de los 10 temas restantes y de los sets C1 (con unidades evu que aporte el usuario), unas 240 entradas de vocabulario, 25 tareas más de Vocabulary (300 ítems), unas 120 frases funcionales, unos 54 can-do B1–C1 y las piezas de interfaz que los muestran (página de lenguaje funcional, objetivos en temario y lecciones).

## Global Constraints

- Contenido original en inglés británico. El libro solo aporta números de unidad. Ningún texto, ejemplo ni ejercicio suyo entra en el repositorio.
- Grammar: 3 opciones, una sola correcta (también en registro hablado), `optionNotes` alineadas, un único `___`.
- Lecciones como `content/grammar/inversion.json`: 8–12 ejemplos, errores típicos de hispanohablantes, al menos 3 ítems de práctica, `canDo: []` (los can-do llegan en el 2d).
- Ids de pregunta `cg-<slug>-01`…`05`. Dificultad repartida: A2 1–3, B1/B2 1–5, C1 3–5. Al menos 1 `spoken` y 3 `written` por lección.

## Review Focus

1. **C1 con dos respuestas válidas**: en cleft sentences, subjuntivo y marcadores formales, el inglés culto tolera variantes (_It was… that/who_, _insist that he go/goes/should go_). Pinea: revisión de clave en la Task 3 con la regla «si dudas, cambia el distractor».
2. **Preposiciones y phrasal verbs con varias partículas posibles** (_angry with/at_, _look into/at_): una pregunta solo vale si el contexto deja una. Pinea: misma revisión.
3. **A2 demasiado fácil o infantil**: el usuario es adulto B1/B2; el repaso A2 debe ir a las trampas de hispanohablantes (_have 25 years_, _the life_, _there is/it is_), no a frases de libro infantil. Pinea: revisión de lecciones (Task 2).
4. **Duplicados con lecciones existentes**: varias unidades rozan lecciones del 2b (posesivos/artículos, as/like y linkers). Pinea: comprobación de prompts repetidos entre ficheros en la Task 3 (el script del 2b) y lectura de las lecciones vecinas antes de redactar.
5. **Unidades mal asignadas**: la columna egu sale de memoria y la unidad 41 no está asignada. Pinea: confirmación del usuario antes de lanzar agentes (Task 1).

---

## File Structure

```
content/grammar/<slug>.json                     34 lecciones nuevas
content/grammar/used-to-and-get-used-to.json    + egu 35 (would)
content/exercises/core-grammar/<slug>.json      5 preguntas por lección nueva (170)
CLAUDE.md                                        estado: 2c y 2d
```

### Task 1: Confirmar la tabla de unidades

| Nivel | order | slug | category | egu | Agente |
|---|---|---|---|---|---|
| A2 | 10 | be-and-have-got | tenses | 17 | A |
| A2 | 20 | there-and-it | pronouns-determiners | 84 | A |
| A2 | 30 | possessives-and-reflexives | pronouns-determiners | 81–83 | A |
| A2 | 40 | some-any-no-none | pronouns-determiners | 85–86 | A |
| A2 | 50 | adjectives-and-adverbs | adjectives-adverbs | 100–101 | A |
| A2 | 60 | prepositions-of-time | prepositions | 121–122 | A |
| A2 | 70 | prepositions-of-place-and-movement | prepositions | 123–126 | A |
| A2 | 80 | present-perfect-basics | tenses | 7–8 | A |
| B1 | 200 | adjectives-ed-ing-and-order | adjectives-adverbs | 98–99 | B |
| B1 | 210 | so-such-too-enough | adjectives-adverbs | 102–103 | B |
| B1 | 220 | word-order-and-focus-adverbs | adjectives-adverbs | 109–112 | B |
| B1 | 230 | for-during-while-by-until | prepositions | 119–120 | B |
| B1 | 240 | prepositions-other-uses | prepositions | 127–128 | B |
| B2 | 120 | question-tags-and-short-answers | questions | 51–52 | B |
| B2 | 130 | like-as-as-if | linking | 116–118 | B |
| B2 | 140 | gerund-after-prepositions | verb-patterns | 60, 62, 63 | C |
| B2 | 150 | adjective-patterns-and-perception-verbs | verb-patterns | 65–67 | C |
| B2 | 160 | articles-with-names | nouns-articles | 77–78 | C |
| B2 | 170 | plural-and-compound-nouns | nouns-articles | 79–80 | C |
| B2 | 180 | quantifiers-all-both-each | pronouns-determiners | 88–91 | C |
| B2 | 190 | noun-and-adjective-prepositions | prepositions | 129–132 | C |
| B2 | 200 | verb-prepositions | prepositions | 133–135 | C |
| B2 | 210 | phrasal-verbs-basics | phrasal-verbs | 136–140 | D |
| C1 | 30 | future-in-the-past | future | — | D |
| C1 | 40 | advanced-passive | passive | — | D |
| C1 | 50 | reporting-verbs | reported-speech | 55 | D |
| C1 | 60 | degree-modifiers | adjectives-adverbs | 104 | D |
| C1 | 70 | phrasal-verbs-advanced | phrasal-verbs | 141–145 | D |
| C1 | 10 | cleft-sentences | emphasis | — | E |
| C1 | 80 | inverted-conditionals | conditionals | — | E |
| C1 | 90 | mixed-conditionals | conditionals | — | E |
| C1 | 100 | subjunctive-and-formal-structures | verb-patterns | — | E |
| C1 | 110 | ellipsis-and-substitution | linking | — | E |
| C1 | 120 | formal-discourse-markers | linking | — | E |

`inversion` (C1, order 20) no cambia. «—» = estructura C1 sin unidad en el libro: `references: []`.

- [ ] **Step 1:** el usuario confirma la columna egu contra el índice (5.ª ed.) y dice dónde va la unidad 41, que no encaja en ningún hueco de la tabla. Unidad sin confirmar = no se escribe.
- [ ] **Step 2:** añadir `{ "book": "egu", "unit": 35 }` a `used-to-and-get-used-to` (ya explica _would_ para hábitos pasados) si el usuario confirma que la 35 es _would_.

### Task 2: Lecciones

- [ ] **Step 1:** 5 agentes `content-writer` en paralelo, uno por letra de la tabla, con slug, nivel, order, category y referencias confirmadas. Cada agente lee antes las lecciones existentes de su categoría para no repetir ejemplos ni enfoque.
- [ ] **Step 2:** `npm run validate:content` → 0 errores y 0 avisos de ortografía (se esperan 34 avisos de «menos de 5 preguntas»).
- [ ] **Step 3:** revisión de cada lección: errores típicos y claves de la práctica (volcado como en el 2b), registro adulto en A2, precisión en C1.
- [ ] **Step 4:** commit `content(grammar): 34 A2-C1 lessons and full egu coverage`.

### Task 3: Preguntas de Core Grammar

- [ ] **Step 1:** los mismos 5 agentes escriben 5 preguntas por lección (reglas de la sección Global Constraints, modelo `content/exercises/core-grammar/inversion.json` para C1).
- [ ] **Step 2:** `npm run validate:content` → 0 errores, 0 avisos; resumen `Core Grammar: 336 questions in 65 lessons (fewest: … 5)`, cobertura `144/145` (145 si la 41 se asigna).
- [ ] **Step 3:** revisión de las 170 preguntas con el script de volcado y la comprobación de prompts duplicados en todo `content/exercises`.
- [ ] **Step 4:** commit `content(core): 170 grammar questions for A2-C1 lessons`.

### Task 4: Comprobación y cierre

- [ ] **Step 1:** `npm run check`, `format:check` y `build` limpios.
- [ ] **Step 2:** Playwright (sin capturas): `/es/gramatica` con 65 lecciones en 4 niveles; una lección A2 y una C1 abren y su «Practica este punto» da 5 preguntas; filtro C1 del entrenador con al menos 25 preguntas para el modo examen; 375 px y oscuro sin desbordes. Borrar `.playwright-mcp/`.
- [ ] **Step 3:** actualizar «Status» de `CLAUDE.md` (2c hecho; 2d siguiente, con su alcance) y la memoria; commit `docs(claude): close batch 2c`; sincronizar Documentos.
- [ ] **Step 4:** informe breve con recuentos, cobertura y nivel de esfuerzo recomendado para el 2d.
