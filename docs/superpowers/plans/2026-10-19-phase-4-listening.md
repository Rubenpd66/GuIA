# Fase 4: Listening — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** las cuatro partes de Listening con audio sintético del navegador (`speechSynthesis`), límite de reproducciones en modo examen, transcripción tras responder, ajustes de voz y velocidad, estrategias por parte y un banco inicial de tareas originales.

**Architecture:** misma que Reading. Lógica pura y testeada en `src/lib/trainer/listening.ts` (ítems, sesiones, puntuación) sobre el reducer y el progreso existentes. Una capa de audio en `src/lib/audio/` (planificación pura de las frases a leer + un hook cliente que envuelve `speechSynthesis`). Un `ListeningTrainer` cliente con un componente por parte y un `AudioPlayer` compartido. `/listening` pasa de «en preparación» a página de formato y estrategias. Contenido JSON redactado por el agente `content-writer`, validado con los esquemas de la fase 1 (`schemas/listening.ts` ya existe) y revisado clave a clave.

**Tech Stack:** el de la fase 3. Sin dependencias nuevas, sin servicio, sin claves: el audio es `window.speechSynthesis` (decisión del usuario, 2026-10-19). `audio.src` sigue siendo opcional en el esquema para sustituir la voz por grabaciones más adelante, pero **esta fase no implementa reproducir ficheros** (YAGNI): si algún día hay grabaciones, se añade entonces en el hook.

**Spec:** `docs/superpowers/specs/2026-10-18-sello-design.md` (§3 formato de Listening, §4 secciones 4–5 y 10, §8, §10, fase 4 de §11).

## Global Constraints

- Formato desde `EXAM_FORMAT.listening`: parte 1, mensaje/monólogo/diálogo corto, 3 opciones; parte 2, 4 monólogos y 6 informaciones, emparejar hablante (cada opción una sola vez); parte 3, diálogo hombre/mujer y 4 afirmaciones (hombre, mujer o ambos); parte 4, monólogo y 2 preguntas de 3 opciones sobre actitud, intención u opinión. Cada audio se oye 1 o 2 veces (`maxPlays: 2`). Listening completo: 40 minutos.
- **Decisiones de la app** (marcadas en código y en la interfaz, nunca presentadas como oficiales):
  - Modo examen: máximo 2 reproducciones por audio (la spec dice «1 o 2 veces»); modo estudio: sin límite y con transcripción disponible tras responder.
  - Ítems de Listening 1 en el simulacro: **5** (como Reading 1; el documento oficial no lo fija).
  - Sin cuenta atrás por parte en examen: el tiempo lo marca la duración del audio. Los 40 min se aplican solo al simulacro (fase 7).
  - Longitud de los guiones (para el validador): P1 15–70 palabras; P2 cada monólogo 25–60; P3 diálogo 120–220; P4 monólogo 180–280.
  - No se presenta ninguna equivalencia oficial de puntuación.
- La voz es sintética y depende del dispositivo: se dice en la interfaz (en `/listening` y en los ajustes) y nunca se la llama «voz del examen».
- Contenido original en inglés británico; nada copiado de material oficial o comercial.
- Accesible: reproducir, pausar y repetir con teclado y lector de pantalla; la transcripción es la alternativa para quien no puede oír (se ofrece siempre tras responder, y en estudio también antes si el alumno la pide); objetivos táctiles ≥ 44 px; sin depender solo del color; 375 px sin desbordes; claro y oscuro.
- `messages/es.json` y `en.json` con las mismas claves.

## Review Focus

1. **`speechSynthesis` es poco fiable**: Chrome corta los enunciados largos (~15 s), `getVoices()` llega de forma asíncrona (`voiceschanged`), Safari ignora algunas voces, y el motor no distingue género. Pinea: la planificación parte el guion por línea y por frase (test de `planUtterances`); el hook espera a las voces y cancela al desmontar o cambiar de tarea (Task 2, comprobación con un stub en el navegador).
2. **Hombre/mujer sin metadatos de género**: se elige por heurística de nombre de voz (`en-GB` primero) y, si no hay dos voces distintas, la misma voz con tono distinto. Pinea: test de `pickVoices` con listas de voces sintéticas: dos voces, una voz, ninguna (Task 2).
3. **Límite de reproducciones**: no se puede saltar recargando ni cambiando de pestaña en el mismo intento; reproducir y pausar no cuenta dos veces; terminar una reproducción sí cuenta. Pinea: test del contador del reducer/estado de audio (Task 1).
4. **Navegador sin `speechSynthesis` o sin voces en inglés**: aviso claro y transcripción disponible, no un trainer roto. Pinea: comprobación en navegador con el API borrado (Task 6).
5. **Parte 2: opción usada dos veces**: el esquema garantiza respuestas únicas, pero el alumno puede elegir la misma en dos hablantes; se muestra sin bloquear y puntúa lo que acierte (como el encabezado repetido de Reading 4). Pinea: test de puntuación (Task 1).
6. **Contenido**: las pistas (`cues`) de la parte 4 deben aparecer de verdad en el guion; en la parte 3, «both» solo si ambos lo dicen explícitamente. Pinea: revisión clave a clave más una comprobación del validador de que cada `cue` es subcadena del guion (Task 5).

---

## File Structure

```
src/lib/audio/plan.ts                  planUtterances (guion → frases con rol y velocidad), pickVoices
src/lib/audio/plan.test.ts
src/lib/audio/useSpeech.ts             hook cliente: play/pause/stop, estado, cuenta de reproducciones
src/lib/trainer/listening.ts           ítems, sesiones, puntuación (parte 3: índices 0/1/2)
src/lib/trainer/listening.test.ts
src/lib/progress/schema.ts             + ajustes listeningVoice { rate, man?, woman? } (migración de versión)
src/components/listening/AudioPlayer.tsx   reproducir/pausar/repetir, «oído n de 2», aviso sin soporte
src/components/listening/Transcript.tsx    guion con hablante, pistas resaltadas en la parte 4
src/components/listening/ListeningTrainer.tsx
src/components/listening/Listening{1,2,3,4}Task.tsx
src/components/settings/VoiceSettings.tsx  velocidad, voz hombre/mujer, botón de prueba
src/app/[locale]/listening/page.tsx    formato, estrategias, nota sobre la voz
src/app/[locale]/practice/[part]       monta listening-1…4 (comprobar cómo resuelve reading-*)
src/lib/content/validate.ts            longitud de guiones, cues ⊂ guion, resumen del banco
content/exercises/listening-{1,2,3,4}/ banco inicial
messages/{es,en}.json                  Listening.*, Settings.voice
```

## Tasks

### Task 1: Lógica del entrenador (TDD)

- [ ] `listeningItems(task)`: P1 un ítem (`answer`); P2 cuatro (hablante → opción); P3 cuatro (`answer` mapeado `man/woman/both` → 0/1/2); P4 dos. Claves con `readingKey`-style (`taskId#i`).
- [ ] `buildListeningSession`: estudio 1 tarea; examen P1 = 5 tareas, P2/P3/P4 = 1 (menos si el banco es pequeño, con aviso); filtros por nivel y `onlyKeys`, igual que Reading.
- [ ] Contador de reproducciones por audio con tope `maxPlays` solo en examen. Tests: tope, pausa no cuenta, repetir cuenta.
- [ ] Puntuación con `scoreItems` existente. Tests: opción repetida en P2, «both» en P3.
- [ ] Registrar `LISTENING_PART_EXAM` en `trainer/config.ts`.

### Task 2: Capa de audio

- [ ] `planUtterances(script, {rate})`: una unidad por frase, con `role` (`man`/`woman`/`narrator`) y pausa breve entre turnos. Test: guion largo → ninguna unidad > ~200 caracteres.
- [ ] `pickVoices(voices, prefs)`: `en-GB` primero, luego `en-*`; hombre/mujer por heurística de nombre; fallback a una voz con tono distinto; narrador = voz mujer. Tests con listas sintéticas.
- [ ] `useSpeech`: espera `voiceschanged`, `speak` encadenado, `pause/resume/cancel`, cancela al desmontar; expone `supported`, `status`, `plays`. Sin test unitario del hook (API del navegador): se comprueba en Task 6.

### Task 3: Ajustes de voz

- [ ] Ajustes `listeningVoice` en el esquema de progreso con migración de versión y su test; incluido en exportar/importar.
- [ ] `VoiceSettings` en `/settings`: velocidad (0.8 / 1 / 1.2), voz de hombre y de mujer (lista de voces `en-*` del dispositivo, «Automática» por defecto), botón «Probar». Sustituye el «Later on» del texto actual de ajustes.

### Task 4: Interfaz

- [ ] `AudioPlayer` (reproducir, pausar, repetir; «Audio n de 2» en examen; aviso si no hay soporte o voces en inglés). `Transcript`.
- [ ] `Listening1Task`: pregunta + 3 opciones, `context` visible antes del audio. `Listening2Task`: 4 audios independientes, cada uno con su selector de 6 opciones. `Listening3Task`: un audio, 4 afirmaciones con «Man / Woman / Both». `Listening4Task`: un audio, 2 preguntas; en resultados, las `cues` resaltadas en la transcripción.
- [ ] `ListeningTrainer` (estudio y examen) reutilizando `TrainerSetup`, `SessionHeader`, `ResultsView`, `Explanation`, progreso y banco de errores como `ReadingTrainer`.
- [ ] Montar `/practice/listening-1…4`; sustituir la página «en preparación» de `/listening` por formato, estrategias por parte (palabras de distracción, anticipar la pregunta antes del audio, usar el segundo oído para comprobar, tono y actitud) y la nota sobre la voz sintética; actualizar `SECTIONS`/mensajes y los textos «Audio with British voices» para no prometer más de lo que hay.

### Task 5: Banco de contenido

- [ ] Validador: rangos de palabras por parte, `cues` ⊂ guion, resumen de tareas por parte.
- [ ] Redacción con el agente `content-writer` (Sonnet): P1 16 tareas (un mensaje, monólogo o diálogo corto cada una), P2 6, P3 8, P4 6; B1–C1, temas variados; ids `l1-…`, `l2-…`, `l3-…`, `l4-…`. Texto hablado natural (contracciones, muletillas moderadas, números y fechas pronunciables).
- [ ] Revisión clave a clave por mí (respuesta correcta única, distractores plausibles, «both» justificado, `explanation` en `en` y `es`), `npm run validate:content` limpio.

### Task 6: Cierre

- [ ] Comprobación en navegador con Playwright (sin capturas; `speechSynthesis` real si hay voces, si no con stub; también con el API borrado): 375 y 1280 px, claro/oscuro, ES/EN, solo teclado; límite de 2 oídos; cambiar de tarea corta el audio.
- [ ] `npm run check` limpio, `CLAUDE.md` (estado y mapa), `ponytail-review` del diff, commits por tarea, sincronizar el espejo de `Documents`, borrar `.playwright-mcp/`.

## Fuera de alcance

Reproducir ficheros de audio (`audio.src`), velocidad por tramos, subtítulos sincronizados, test de nivel y simulacro (fase 7), cualquier API de TTS.

## Preguntas para aprobar

1. ¿Te vale **5 ítems** de Listening 1 en el simulacro y el reparto del banco 16/6/8/6?
2. ¿Sin cuenta atrás por parte en modo examen (solo tope de 2 oídos)?
3. ¿Ajustes de voz en `/settings` con velocidad y selección de voz hombre/mujer, o basta con velocidad?
