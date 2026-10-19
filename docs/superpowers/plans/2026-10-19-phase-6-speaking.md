# Fase 6: Speaking — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** las cuatro partes de Speaking con grabación en el navegador, temporizadores del formato real, preguntas leídas en voz alta, ilustraciones SVG originales, modelos B2 y C estructurados y una autoevaluación, más estrategias por parte y un banco inicial de tareas originales.

**Architecture:** la misma que Writing. La lógica pura y testeada va en `src/lib/trainer/speaking.ts`: fases de cada pregunta, tiempos, sesiones y rúbrica. La grabación usa `MediaRecorder` y `getUserMedia`, nativos del navegador, sin paquetes, en un hook `useRecorder`. Las preguntas se leen con la capa `speechSynthesis` de la fase 4 (`useSpeech`). Las escenas son componentes SVG propios registrados por `sceneId`. No hay corrección automática: el alumno se escucha, compara con los modelos y se autoevalúa. La IA es la fase 9. Los esquemas (`schemas/speaking.ts`) y `EXAM_FORMAT.speaking` ya existen.

**Tech Stack:** el de la fase 5. Sin dependencias nuevas, sin servicio, sin claves.

**Spec:** `docs/superpowers/specs/2026-10-18-sello-design.md` (§3 formato de Speaking, §4 secciones 4–5, §8, §9, §10, fase 6 de §11).

## Global Constraints

- Formato desde `EXAM_FORMAT.speaking`:
  - Parte 1: 3 preguntas personales, 30 s cada una.
  - Parte 2: describir una foto y 2 preguntas más, 45 s cada una.
  - Parte 3: comparar dos imágenes y 2 preguntas más, 45 s cada una.
  - Parte 4: una imagen y 3 preguntas abstractas, 1 min de preparación y 2 min seguidos para las tres.
- **Decisiones de la app** (marcadas en código y en la interfaz):
  - La rúbrica de autoevaluación es nuestra, no la oficial, y no da nota.
  - Si no hay voz sintética, la pregunta se muestra con 5 s de lectura antes de que empiece el tiempo.
  - Se da una longitud orientativa de los modelos por parte (aviso del validador, no error): unas 2,2 palabras por segundo de respuesta.
- **Privacidad del audio:** la grabación vive solo en memoria (un `Blob` y su URL de objeto). Nunca se sube ni se guarda en `localStorage` o IndexedDB, y se descarta al salir de la sesión. Hay un botón «Descargar» que el alumno pulsa si quiere conservarla. El micrófono se pide solo al pulsar «Empezar», nunca al cargar la página, y se libera (pistas paradas) al terminar.
- **Sin micrófono** (permiso denegado, sin `MediaRecorder` o sin dispositivo): el entrenador funciona igual con los temporizadores, hablando en voz alta sin grabar, y lo explica en un aviso que no bloquea.
- Contenido original en inglés británico. Las escenas son ilustraciones planas propias, sin fotos ni material ajeno, y cada una tiene texto alternativo en `en` y `es`.
- Accesible:
  - La cuenta atrás se anuncia solo al empezar, a falta de 10 s y al acabar, no cada segundo.
  - La grabación en curso se indica con texto, no solo con color.
  - Teclado completo, objetivos táctiles de 44 px o más, 375 px sin desbordes, claro y oscuro.
  - Las escenas son `role="img"` con su `alt`.
- `messages/es.json` y `en.json` con las mismas claves.

## Review Focus

1. **Máquina de fases de cada pregunta:** lectura → (preparación en la parte 4) → respuesta → hecho. El tiempo de respuesta empieza al terminar la lectura y no antes, y nunca dos veces. Pinea: test del reductor puro con tiempos simulados (Task 1).
2. **Grabación:** se para sola al llegar a cero, no se queda el micrófono encendido al salir o cambiar de pregunta, y un fallo de permiso no rompe la sesión. Pinea: test del hook con `MediaRecorder` y `getUserMedia` simulados (Task 2) y comprobación en navegador con micrófono falso de Chromium (Task 6).
3. **Fugas de memoria:** cada URL de objeto se revoca al regrabar y al desmontar. Pinea: test del hook (Task 2).
4. **Escenas:** todo `sceneId` del contenido existe en el registro, y el registro no tiene escenas huérfanas. Pinea: comprobación cruzada del validador y su test (Task 5).
5. **Progreso sin banco de errores:** la autoevaluación se guarda con `recordAttempt` como en Writing. Pinea: ya testeado; un test del cálculo de la rúbrica (Task 1).
6. **Contenido:**
   - Los modelos B2 y C deben diferir de verdad: estructuras, conectores, especulación en las partes 2–3 y contraste en la 4.
   - Deben contestar a lo que se pregunta, sonar a lengua hablada (no a texto escrito) y ajustarse al tiempo.
   - Revisión una a una (Task 5).

---

## File Structure

```
src/lib/trainer/speaking.ts             fases, tiempos, sesiones, rúbrica, longitud orientativa
src/lib/trainer/speaking.test.ts
src/lib/trainer/config.ts               + SPEAKING_PART_EXAM
src/lib/speaking/useRecorder.ts         getUserMedia + MediaRecorder, estado, URL revocadas
src/lib/speaking/useRecorder.test.ts
src/lib/speaking/scenes.ts              lista de sceneId (la usa el validador)
src/components/speaking/scenes/*.tsx    una escena SVG por fichero + índice
src/components/speaking/SceneImage.tsx
src/components/speaking/AnswerTimer.tsx
src/components/speaking/Recording.tsx   reproducir / regrabar / descargar
src/components/speaking/SpeakingModels.tsx   B2 y C por segmentos, escuchar el modelo
src/components/speaking/SpeakingTrainer.tsx  las 4 partes en un componente, como Writing
src/app/[locale]/speaking/page.tsx      formato, estrategias, rúbrica, privacidad del audio
src/app/[locale]/practice/[part]        monta speaking-1…4
src/lib/content/validate.ts             sceneId existentes, longitud de modelos, resumen del banco
content/exercises/speaking-{1,2,3,4}/   banco inicial
messages/{es,en}.json                   Speaking.*
```

## Tasks

### Task 1: Lógica (TDD)

- [ ] `SPEAKING_PART_EXAM` en `config.ts` con los segundos de `EXAM_FORMAT`.
- [ ] Reductor de fases por pregunta (`reading` → `preparing` → `answering` → `done`), con tiempos inyectados. Tests: el tiempo empieza tras la lectura, la parte 4 tiene preparación y un único turno de 2 min para las tres preguntas, terminar antes de tiempo, fin del tiempo.
- [ ] `buildSpeakingSession`: estudio, 1 tarea; examen, 1 tarea por parte.
- [ ] Rúbrica propia con 4 criterios: respuesta a la tarea; fluidez y organización; rango y corrección; pronunciación e inteligibilidad. Se guarda como `correct/total` con `recordAttempt`.
- [ ] `modelWordRange(part)`: rango orientativo a partir de los segundos.

### Task 2: Grabación

- [ ] `useRecorder`: `start()` pide el micrófono (solo la primera vez en la sesión) y graba; `stop()`; `reset()`; estado `idle | requesting | recording | stopped | unavailable | denied`; revoca URL al regrabar y al desmontar; para las pistas al terminar la sesión.
- [ ] Tests con `MediaRecorder` y `getUserMedia` falsos: permiso denegado, sin soporte, parada automática, revocado de URL, limpieza al desmontar.

### Task 3: Escenas e interfaz

- [ ] Registro de escenas (`scenes.ts` + `scenes/index.tsx`) y `SceneImage` (`role="img"`, `alt` localizado, colores con los tokens del tema para claro y oscuro).
- [ ] Unas 16 escenas SVG originales, planas y sencillas, dibujadas a mano en código, con piezas reutilizables (personas, edificios, objetos). La parte 4 puede reutilizar escenas.
- [ ] `AnswerTimer` (barra y reloj, anuncios dosificados), `Recording` (reproducir, regrabar en estudio, descargar), `SpeakingModels` (segmentos con su papel: intro, desarrollo, ejemplo, especulación, conclusión; botón para escucharlo con `useSpeech`).

### Task 4: Entrenador y páginas

- [ ] `SpeakingTrainer`:
  - Estudio: la pregunta se lee, el alumno empieza a grabar cuando quiere, el tiempo corta la grabación, puede regrabar sin límite, y ve una plantilla de estructura, frases útiles (`buying-time`, `speculation`, `comparison`, `opinion`…) y los modelos tras cada pregunta.
  - Examen: lectura → tiempo y grabación automáticos → siguiente, sin regrabar ni ayudas; al final, revisión de todas las grabaciones con los modelos y la autoevaluación.
- [ ] Montar `/practice/speaking-1…4`.
- [ ] Página `/speaking`: formato, estrategias por parte, rúbrica, aviso de privacidad del audio, probar el micrófono y nota de que no hay corrección automática. Quitar los textos «en preparación».

### Task 5: Banco de contenido

- [ ] Validador: el `sceneId` debe existir en `scenes.ts` (error), aviso por la longitud de los modelos y resumen del banco de Speaking.
- [ ] Redacción con `content-writer` (Sonnet), un agente por parte: P1 10 tareas, P2 6, P3 5, P4 5. Modelos B2 y C por segmentos, temas variados, ids `s1-…`…`s4-…`. Cada agente recibe la lista de escenas disponibles con su descripción.
- [ ] Revisión una a una por mí (contesta a la pregunta, suena hablado, B2 y C distintos de verdad, ajuste al tiempo, que la escena encaje con las preguntas y el `alt`). `npm run validate:content` limpio.

### Task 6: Cierre

- [ ] Comprobación en navegador con Playwright (sin capturas), con micrófono falso de Chromium (`--use-fake-device-for-media-stream`) y con permiso denegado: 375 y 1280 px, claro y oscuro, ES y EN, teclado; fin del tiempo con reloj simulado; micrófono liberado al salir.
- [ ] `npm run check` limpio, `CLAUDE.md`, memoria, `ponytail-review` del diff, commits por tarea, sincronizar el espejo y borrar `.playwright-mcp/`.

## Fuera de alcance

Corrección o transcripción automática (reconocimiento de voz) y feedback por IA (fase 9), guardar grabaciones entre sesiones, comparación de pronunciación, fotos reales.

## Preguntas para aprobar

1. ¿Grabaciones solo en memoria, descartadas al salir, nunca subidas, con un botón «Descargar» opcional?
2. ¿Modo examen con pregunta leída por voz sintética, y tiempo y grabación automáticos sin regrabar? ¿Y modo estudio con regrabación ilimitada, plantilla de estructura y modelos tras cada pregunta?
3. ¿Banco 10/6/5/5 con unas 16 escenas SVG originales dibujadas por mí (ilustración plana sencilla) y reutilizables en la parte 4?
4. ¿Autoevaluación con 4 criterios propios guardada como `correct/total`, igual que Writing?
