# Fase 5: Writing — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** las cuatro partes de Writing con editor, contador de palabras, temporizador, modelos anotados B2 y C, plantillas de frases útiles y una rúbrica de autoevaluación, más estrategias por parte y un banco inicial de tareas originales.

**Architecture:** misma que Reading y Listening: lógica pura y testeada en `src/lib/trainer/writing.ts` (rangos, estado del contador, sesiones, rúbrica) y un `WritingTrainer` cliente con un componente por parte. No hay corrección automática: el alumno escribe, ve los modelos anotados y se autoevalúa con una lista de comprobación. La IA que corrige es la fase 9 (opcional, con permiso y aviso de coste). Los esquemas de contenido (`schemas/writing.ts`) y `EXAM_FORMAT.writing` ya existen.

**Tech Stack:** el de la fase 4. Sin dependencias nuevas, sin servicio.

**Spec:** `docs/superpowers/specs/2026-10-18-sello-design.md` (§3 formato de Writing, §4 secciones 4–5, §8, §10, fase 5 de §11).

## Global Constraints

- Formato desde `EXAM_FORMAT.writing`: parte 1, 5 mensajes con respuestas de 1 a 5 palabras (decisión de la app) y 3 min; parte 2, 20–30 palabras y 7 min; parte 3, 3 respuestas de 30–40 palabras y 10 min; parte 4, email informal de 40–50 y email formal de 120–150 palabras, ~30 min. Los tiempos suman los 50 min del examen.
- **Decisiones de la app** (marcadas en código y en la interfaz): la rúbrica de autoevaluación es nuestra, no la oficial, y no da una nota oficial; el modo examen corta el tiempo al terminar la cuenta atrás (como Reading); el modo estudio tiene temporizador opcional y se puede ver una pista y las frases útiles.
- Contenido original en inglés británico. Los modelos B2 y C están dentro del rango de palabras de la parte (el esquema ya lo valida) y sus anotaciones citan texto que existe.
- El texto del alumno nunca sale del navegador: borradores en `localStorage`, nada en URLs ni servicios.
- Accesible: el contador se anuncia sin spam (región `aria-live` educada, con texto «dentro / por debajo / por encima del rango», no solo color); editor con etiqueta; objetivos táctiles ≥ 44 px; 375 px sin desbordes; claro y oscuro.
- `messages/es.json` y `en.json` con las mismas claves.

## Review Focus

1. **Contador de palabras**: debe coincidir con el del validador (`countWords`: contracciones y guiones cuentan una). Pinea: test con contracciones, guiones, puntuación suelta y texto vacío (Task 1).
2. **Pérdida de borradores**: recargar o cambiar de tarea no debe borrar lo escrito; `localStorage` bloqueado no debe romper el editor. Pinea: test del almacén de borradores con almacenamiento que lanza (Task 2) y comprobación en navegador (Task 6).
3. **Fin del tiempo en examen**: al llegar a cero el editor se bloquea sin perder el texto y se pasa a los modelos. Pinea: comprobación en navegador (Task 6).
4. **Anotaciones**: el resaltado de `quote` en el modelo tiene que casar cuando una cita aparece dos veces o con signos de puntuación. Pinea: test de la función que parte el texto en tramos anotados (Task 1).
5. **Progreso sin banco de errores**: Writing no tiene aciertos/fallos automáticos y no debe ensuciar el banco de errores de la fase 7. Pinea: `recordAttempt` guarda el intento (autoevaluación como `correct/total`) y no toca `mistakes`; test (Task 1).
6. **Contenido**: los modelos B2 y C deben diferir de verdad (estructuras, conectores, registro), el registro del email informal/formal debe ser correcto y los modelos deben contestar a todos los puntos del enunciado. Revisión una a una (Task 5).

---

## File Structure

```
src/lib/trainer/writing.ts            rangos, estado del contador, tramos anotados, sesiones, rúbrica
src/lib/trainer/writing.test.ts
src/lib/progress/progress.ts          + recordAttempt (intento sin banco de errores)
src/lib/writing/drafts.ts             borradores en localStorage (sello:writing-drafts)
src/lib/writing/drafts.test.ts
src/components/writing/WritingEditor.tsx     textarea + contador + temporizador
src/components/writing/ModelAnswers.tsx      modelos B2 y C con anotaciones
src/components/writing/Checklist.tsx         rúbrica de autoevaluación
src/components/writing/PhrasePanel.tsx       frases útiles (reutiliza functional-language)
src/components/writing/WritingTrainer.tsx
src/components/writing/Writing{1,2,3,4}Task.tsx
src/app/[locale]/writing/page.tsx     formato, estrategias, rúbrica explicada
src/app/[locale]/practice/[part]      monta writing-1…4
src/lib/trainer/config.ts             WRITING_PART_EXAM (tiempos recomendados)
src/lib/content/validate.ts           resumen del banco de Writing
content/exercises/writing-{1,2,3,4}/  banco inicial
messages/{es,en}.json                 Writing.*
```

## Tasks

### Task 1: Lógica (TDD)

- [ ] `wordStatus(text, range)`: `below` / `within` / `above` con `countWords`. Tests: contracciones, guiones, vacío.
- [ ] `annotatedSegments(model)`: parte el texto en tramos con su anotación, con citas repetidas y solapadas. Tests.
- [ ] `buildWritingSession` (estudio 1 tarea; examen 1 tarea por parte) y rúbrica por parte (4 criterios propios: respuesta a la tarea, organización y conectores, rango y corrección, registro).
- [ ] `recordAttempt` en progress: añade el intento con `correct/total` de la autoevaluación y no toca `mistakes`. Tests.
- [ ] `WRITING_PART_EXAM` en `config.ts` con los minutos recomendados de `EXAM_FORMAT`.

### Task 2: Borradores

- [ ] `drafts.ts`: leer, guardar y borrar por id de tarea, con `try/catch` y límite de borradores. Tests con almacenamiento que lanza.

### Task 3: Interfaz del editor

- [ ] `WritingEditor`: etiqueta, contador con texto de estado, temporizador (cuenta atrás de examen o cronómetro opcional de estudio), autoguardado del borrador, bloqueo al terminar el tiempo.
- [ ] `ModelAnswers`: pestañas/secciones B2 y C, tramos anotados con tipo y nota, contador de palabras de cada modelo.
- [ ] `Checklist`: rúbrica de autoevaluación y resumen.
- [ ] `PhrasePanel`: frases de `functional-language` filtradas por registro (informal/neutro/formal) y función; en modo examen oculto.

### Task 4: Entrenador y páginas

- [ ] `Writing1Task` (5 mensajes cortos, contador de 1–5 palabras, respuestas de ejemplo al final), `Writing2Task`, `Writing3Task` (3 preguntas), `Writing4Task` (informal y formal con su situación y destinatario).
- [ ] `WritingTrainer` (estudio y examen) siguiendo `ReadingTrainer`; montar `/practice/writing-1…4`; página `/writing` con formato, estrategias por parte, rúbrica y nota de que no hay corrección automática; ajustar textos «en preparación».

### Task 5: Banco de contenido

- [ ] Resumen del banco de Writing en el validador.
- [ ] Redacción con `content-writer` (Sonnet), un agente por parte: P1 8 tareas, P2 10, P3 8, P4 6; modelos B2 y C anotados (3–6 anotaciones por modelo); temas variados; ids `w1-…`…`w4-…`.
- [ ] Revisión una a una por mí (respuesta a todo el enunciado, registro, diferencia real B2/C, citas y rangos), `npm run validate:content` limpio.

### Task 6: Cierre

- [ ] Comprobación en navegador con Playwright (sin capturas): 375 y 1280 px, claro/oscuro, ES/EN, teclado; borrador que sobrevive a recargar; fin del tiempo en examen; almacenamiento bloqueado.
- [ ] `npm run check` limpio, `CLAUDE.md`, memoria, `ponytail-review` del diff, commits por tarea, sincronizar el espejo, borrar `.playwright-mcp/`.

## Fuera de alcance

Corrección automática o por IA (fase 9), comparación automática con las respuestas modelo, exportar borradores, historial de versiones, corrector ortográfico.

## Preguntas para aprobar

1. ¿Autoevaluación con rúbrica propia (4 criterios) guardada como `correct/total` en el progreso, sin tocar el banco de errores?
2. ¿Modo examen que bloquea el editor al llegar a cero (como Reading) y modo estudio con cronómetro opcional?
3. ¿Banco 8/10/8/6 con modelos B2 y C anotados en cada tarea?
