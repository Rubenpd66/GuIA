# Fase 3: Reading — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** las cuatro partes de Reading con su interacción real (huecos, ordenar frases con arrastrar y soltar accesible, asignar opiniones, encabezados), modo estudio y examen, resaltado de texto, estrategias por parte y un banco inicial de tareas originales.

**Architecture:** misma arquitectura que el Core: lógica pura y testeada en `src/lib/trainer/reading.ts` (ítems, sesiones, orden inicial, puntuación) sobre el reducer y el progreso existentes; un `ReadingTrainer` cliente con un componente por parte; dos piezas de interacción propias (`SortableList` y `HighlightableText`) sin dependencias; `/reading` pasa de «en preparación» a página de estrategias. Contenido JSON redactado por agentes, validado con los esquemas de la fase 1 y revisado.

**Tech Stack:** el de la fase 2. Sin dependencias nuevas: el arrastrar y soltar se hace con Pointer Events y teclado, no con una librería.

**Spec:** `docs/superpowers/specs/2026-10-18-sello-design.md` (§3 formato de Reading, §4 sección 5, §8, §10, fase 3 de §11). Guía de contenido: skill `aptis-content`.

## Global Constraints

- Formato desde `EXAM_FORMAT.reading`: parte 1, 5 frases con 3 opciones; parte 2, 2 tareas de 6 frases con la primera fija; parte 3, 4 personas y 7 afirmaciones; parte 4, texto de 700–800 palabras, 8 encabezados para 7 párrafos. Reading completo: 35 minutos.
- **Decisiones de la app** (marcadas en código y en la interfaz): tiempos de una sola parte en modo examen, 4 / 8 / 8 / 15 minutos (suman 35); en la parte 2 cada frase bien colocada vale un punto (5 por tarea). No se presenta ninguna equivalencia oficial de puntuación.
- Contenido original en inglés británico; nada copiado de material oficial o comercial.
- Accesible: todo se puede hacer solo con teclado y con lector de pantalla; objetivos táctiles ≥ 44 px (opciones ≥ 56 px como en el Core); sin depender solo del color; 375 px sin desbordes; claro y oscuro.
- `messages/es.json` y `en.json` con las mismas claves.

## Review Focus

1. **Orden inicial ya correcto en la parte 2**: si al barajar las frases 2–6 salen en su orden, la tarea está resuelta antes de empezar. Pinea: test de `initialOrder` (Task 1).
2. **Arrastrar en el móvil**: el gesto no puede hacer scroll de la página a la vez ni perder la frase si el dedo sale de la lista; y quien no puede arrastrar tiene botones y teclado. Pinea: comprobación en navegador táctil emulado (Task 7) y botones «subir/bajar» siempre visibles.
3. **Encabezado repetido en la parte 4**: el alumno puede elegir el mismo encabezado para dos párrafos; en estudio y en resultados debe verse claro, sin bloquearle. Pinea: test de puntuación con encabezado repetido (Task 1).
4. **Texto largo de la parte 4 en 375 px**: los desplegables de encabezado no pueden quedar lejos de su párrafo ni tapar el texto. Pinea: comprobación en navegador (Task 7).
5. **Banco pequeño**: con pocas tareas, el modo examen de la parte 2 necesita 2 tareas distintas y el de la parte 4 una; si no las hay, sesión más corta con aviso, no un fallo. Pinea: test de `buildReadingSession` (Task 1).

---

## File Structure

```
src/lib/content/text.ts                 + splitSentences
src/lib/trainer/reading.ts              ítems, sesiones, orden inicial, moveItem
src/lib/trainer/config.ts               + READING_PART_EXAM
src/components/reading/SortableList.tsx      lista ordenable (puntero, teclado, botones)
src/components/reading/HighlightableText.tsx resaltado por frases
src/components/reading/Reading{1,2,3,4}Task.tsx  una tarea de cada parte
src/components/reading/ReadingTrainer.tsx    preparación, sesión y resultados
src/app/[locale]/practice/[part]/page.tsx    + reading-1…4
src/app/[locale]/reading/page.tsx            formato, estrategias y enlaces
messages/{es,en}.json                         + Reading.*, ReadingStrategies.*
content/exercises/reading-{1,2,3,4}/*.json   banco inicial
```

### Task 1: Lógica de Reading

**Interfaces:**
- `splitSentences(text: string): string[]` en `text.ts`: corta tras `.`, `?` o `!` seguidos de espacio y mayúscula o comilla; no corta en abreviaturas comunes (`Mr.`, `Dr.`, `e.g.`, `i.e.`, `etc.` seguido de minúscula) ni en decimales.
- `READING_PART_EXAM: Record<"reading-1" | … | "reading-4", { tasks: number; seconds: number }>` = 1/240, 2/480, 1/480, 1/900.
- `readingItems(task: ReadingExercise): { key: string; answer: number }[]` — claves `id#i` (parte 1, frase i), `id#p` (parte 2, posición p de 1 a 5, respuesta = índice de la frase correcta, o sea p), `id#s` (parte 3, afirmación s, respuesta = persona), `id#p` (parte 4, párrafo p, respuesta = encabezado).
- `initialOrder(task: Reading2Exercise, rng: Rng): number[]` — `[0, …]` con 1–5 barajados y nunca en orden.
- `moveItem(order: number[], from: number, to: number): number[]` — inmutable; nunca mueve ni a ni desde la posición 0.
- `buildReadingSession({ tasks, part, mode, rng, levels?, onlyKeys? }): ReadingExercise[]` — estudio: 1 tarea; examen: `READING_PART_EXAM[part].tasks` distintas o las que haya; `onlyKeys` devuelve las tareas que contienen alguno de esos ítems.
- Respuestas de la parte 2: `answers[id#p]` = índice de la frase que el alumno tiene en la posición p; se puntúa con `scoreItems` sin cambios.

- [x] **Step 1: tests que fallan** en `text.test.ts` y `reading.test.ts`: «splits sentences but not after Mr. or 3.5», «initialOrder keeps the first sentence and never returns the solved order» (1000 semillas), «moveItem refuses position 0», «readingItems builds one key per gap, position, statement and paragraph», «a repeated heading scores only where it is right», «exam session for part 2 takes two different tasks», «a bank with one part-2 task gives a one-task session», «onlyKeys returns the tasks of those items».
- [x] **Step 2:** `npx vitest run src/lib` → FAIL.
- [x] **Step 3:** implementar.
- [x] **Step 4:** `npm run check` limpio.
- [x] **Step 5:** commit `feat(trainer): reading sessions, items and ordering logic`.

### Task 2: `SortableList`

**Interfaces:** `SortableList({ items: { id: string; content: ReactNode }[]; order: number[]; fixed: number; onMove(from, to): void; disabled?: boolean; labels })` — `fixed` es el número de elementos iniciales que no se mueven (1 en la parte 2).

- [x] **Step 1:** puntero: asa de arrastre por fila con Pointer Events y `setPointerCapture`; `touch-action: none` solo en el asa, para que el resto de la fila deje hacer scroll; posición de destino por el punto medio de las filas; la fila que se arrastra se ve levantada y el hueco de destino marcado con una línea (no solo color).
- [x] **Step 2:** teclado: el asa es un botón; Espacio/Intro coge la frase, flechas la mueven, Espacio/Intro la suelta, Escape cancela y la devuelve. Botones «subir» y «bajar» de 44 px en cada fila, deshabilitados en los extremos.
- [x] **Step 3:** región `aria-live="polite"` con «Frase cogida: posición 3 de 6», «Movida a la posición 2», «Soltada en la posición 2» (claves en `Reading.sortable.*`).
- [x] **Step 4:** página `/design` muestra una lista de ejemplo (como el resto de piezas del sistema de diseño) para probarla a mano; `npm run check` limpio; commit `feat(reading): accessible sortable list`.

### Task 3: `HighlightableText`

**Interfaces:** `HighlightableText({ paragraphs: string[]; highlighted: Set<string>; onToggle(key: string): void; active: boolean })` — clave `p:s` (párrafo, frase) a partir de `splitSentences`.

- [x] **Step 1:** con el resaltador apagado el texto se lee normal; encendido, cada frase es un botón (`aria-pressed`) que se marca con `==mark==`-style (fondo + subrayado, no solo color). Un interruptor «Resaltar» encima del texto y «Borrar resaltados».
- [x] **Step 2:** los resaltados viven solo en la sesión (estado del entrenador); no se guardan en el progreso.
- [x] **Step 3:** `npm run check` limpio; commit `feat(reading): sentence highlighter`.

### Task 4: Entrenador de Reading

- [ ] **Step 1:** `Reading1Task`: contexto opcional y 5 frases con un `<select>` nativo por hueco (como la parte real); en estudio, «Comprobar» marca cada frase y muestra su explicación.
- [ ] **Step 2:** `Reading2Task`: título opcional, frase 1 fija y `SortableList` con las demás; en estudio, «Comprobar» marca cada posición y muestra las `cohesionHints` (la frase o palabra que remite, resaltada, y a qué frase apunta) y la explicación.
- [ ] **Step 3:** `Reading3Task`: pregunta, las 4 personas con `HighlightableText` y 7 afirmaciones con un `<select>` de persona (A–D); en pantalla ancha, textos y afirmaciones en dos columnas; en móvil, textos plegables por persona encima de las afirmaciones.
- [ ] **Step 4:** `Reading4Task`: título, lista de los 8 encabezados y los 7 párrafos con `HighlightableText`, cada uno con su `<select>` de encabezado justo encima; un encabezado ya usado se marca «(ya elegido)» en las demás listas, sin bloquearlo.
- [ ] **Step 5:** `ReadingTrainer({ part, tasks })`: reutiliza `TrainerSetup`, `SessionHeader`, `ResultsView`, `trainerReducer`, `useCountdown` y `recordSession`; un paso por tarea; resultados con la explicación de cada fallo y «Repasar estos fallos» con `onlyKeys`. Aviso si el banco da menos tareas que el examen.
- [ ] **Step 6:** `/practice/[part]` monta el entrenador para `reading-1…4`; claves `Reading.*`; `npm run check` limpio; commit `feat(reading): trainer for the four reading parts`.

### Task 5: Contenido (en paralelo con las Tasks 2–4)

| Parte | Tareas | Niveles | Ids |
|---|---|---|---|
| reading-1 | 12 (60 frases) | 4 B1, 5 B2, 3 C1 | `r1-<tema>-NN` |
| reading-2 | 16 | 5 B1, 6 B2, 5 C1 | `r2-<tema>-NN` |
| reading-3 | 8 | 3 B2, 5 C1 | `r3-<tema>-NN` |
| reading-4 | 6 (700–800 palabras) | 2 B2, 4 C1 | `r4-<tema>-NN` |

Temas repartidos entre los 11 del examen. Parte 1: textos cortos reales (nota, email, aviso) y huecos de gramática y vocabulario a nivel de frase, con distractores claros. Parte 2: cohesión visible (pronombres, artículos, conectores, referencias), un único orden posible y `cohesionHints` en todas. Parte 3: opiniones con matices y paráfrasis (las afirmaciones no repiten palabras del texto), cada persona usada al menos una vez. Parte 4: un párrafo, una idea; el encabezado sobrante parece encajar pero no.

- [ ] **Step 1:** 4 agentes `content-writer`, uno por parte, en `content/exercises/reading-N/<tema>.json`.
- [ ] **Step 2:** `npm run validate:content` → 0 errores, 0 avisos.
- [ ] **Step 3:** revisión: un único orden en la parte 2 (leerla barajada), una única persona por afirmación, un único encabezado por párrafo, recuento de palabras, originalidad.
- [ ] **Step 4:** commit `content(reading): initial bank for the four parts`.

### Task 6: Página de Reading y estrategias

- [ ] **Step 1:** `/reading`: cabecera, las 4 partes desde `EXAM_FORMAT` (qué hay que hacer, cuántos ítems, tiempo de la app en examen marcado como decisión), 3–4 estrategias por parte (`ReadingStrategies.part1…4`, ES/EN, propias) y botón «Practicar» a cada entrenador; enlace a las lecciones de gramática útiles (linkers, referencias) desde la parte 2.
- [ ] **Step 2:** `SECTIONS.reading` y `PHASE_OF_SKILL.reading` siguen en 3; la lista de partes de `/practice` muestra Reading disponible.
- [ ] **Step 3:** `npm run check` limpio; commit `feat(reading): reading section with strategies`.

### Task 7: Comprobación y cierre

- [ ] **Step 1:** `npm run check`, `format:check`, `build`; reiniciar el servidor de desarrollo.
- [ ] **Step 2:** Playwright sin capturas, 375 y 1280 px, claro y oscuro, ES y EN: cada parte en estudio (comprobar, explicaciones, pistas de cohesión) y en examen (tiempo, resultados, repasar fallos); parte 2 solo con teclado (coger, mover, soltar, cancelar) y con arrastre de puntero emulado en táctil; resaltar y borrar en partes 3 y 4; encabezado repetido; `/reading` y `/practice`. Borrar `.playwright-mcp/`.
- [ ] **Step 3:** `CLAUDE.md` (fase 3 hecha, siguiente fase 4 Listening) y memoria; commit `docs(claude): close phase 3`; sincronizar Documentos.
- [ ] **Step 4:** informe breve y esfuerzo recomendado para la fase 4.
