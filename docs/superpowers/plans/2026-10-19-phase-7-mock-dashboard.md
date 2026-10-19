# Fase 7: panel, banco de errores, flashcards, test de nivel y simulacro — plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** que el alumno sepa en todo momento qué nivel estimado tiene en cada parte, qué le falta para el C y qué practicar a continuación. Para eso: un panel con el pasaporte de sellos, un banco de errores, flashcards con repetición espaciada (SM-2), un test de nivel de unos 20 minutos, un simulacro completo con informe, y la animación del sello.

**Architecture:** no hay contenido nuevo. Todo se construye sobre los 18 entrenadores y el progreso que ya existe (`sello:progress`, en `localStorage`).
- La lógica pura va en `src/lib/estimate/` (nivel estimado y siguiente tarea), `src/lib/flashcards/` (SM-2) y `src/lib/mock/` (secuencia e informe del simulacro).
- El test de nivel y el simulacro reutilizan los componentes de tarea de cada destreza dentro de un orquestador nuevo; no copian entrenadores.
- Sin dependencias nuevas, sin servicio. La animación usa CSS y Web Animations, nativas del navegador.

**Tech Stack:** el de la fase 6.

**Spec:** `docs/superpowers/specs/2026-10-18-sello-design.md`: §1 (éxito), §2.6 (nada de datos oficiales inventados), §3 (resultados), §4 secciones 2, 3, 6, 7, 8 y 10, §6 (pasaporte y movimiento), §9, §10 y la fase 7 de §11.

## Global Constraints

- **Nada oficial inventado:**
  - El nivel por parte y por destreza es una **estimación orientativa de la app**, siempre etiquetada así.
  - No se muestran puntuaciones 0–50, porque la conversión oficial no es pública. Se muestra el porcentaje y el nivel estimado.
  - El papel de G&V como desempate se explica con el texto de la guía, sin números.
- Los niveles de los sellos son los de `StampLevel` (A2, B1, B2, C). Por debajo de A2 se muestra «sin sello», no «A1».
- Writing y Speaking se estiman con la autoevaluación (`correct/total` de la rúbrica). Se marca como autoevaluación, que es menos fiable.
- **Progreso:**
  - Se mantiene en `localStorage` con el esquema versionado actual. La IndexedDB que menciona §9 no hace falta para este volumen (máximo 200 intentos); queda anotado como decisión.
  - Las flashcards, la fecha del examen y la sesión del simulacro en curso van en claves propias e **incluidas en exportar/importar**.
  - Importar un fichero antiguo (sin esas claves) sigue funcionando.
- **Movimiento:**
  - Un único momento de impacto: el sello cae, rebota, se asienta girado y la tinta se extiende. Ocurre al subir de nivel en una parte y al terminar el simulacro.
  - Con `prefers-reduced-motion` se queda en un fundido.
  - Nada se anima en bucle.
- Accesible, a 375 y 1280 px, claro y oscuro, ES y EN.

## Lotes

Cada lote se cierra compilando, con lint y tipos limpios, testeado, comprobado en el navegador y commiteado, como las fases anteriores.

### 7a — Estimación, panel, banco de errores y fecha del examen

- [ ] `src/lib/estimate/level.ts` (TDD):
  - **Nivel estimado por parte:** media ponderada de los últimos intentos de esa parte. Los últimos 5 pesan más, y un intento en modo examen vale el doble que uno de estudio.
  - **Bandas de la app:** ≥ 85 % → C; ≥ 70 % → B2; ≥ 55 % → B1; ≥ 40 % → A2; por debajo, sin sello.
  - Hacen falta **al menos 2 intentos** (o 10 ítems en Core) para mostrar un nivel; si no, «sin datos».
  - Por destreza, la media de sus partes con datos.
- [ ] `nextTask(progress, examDate?)` (TDD) elige la siguiente tarea:
  1. Primero, la parte sin datos.
  2. Después, la parte con el nivel más bajo.
  3. Con errores pendientes, sugiere repasarlos.
  4. Con la fecha del examen a menos de 14 días, sugiere un simulacro.
- [ ] Racha (días seguidos con algún intento, en hora local) y tiempo practicado esta semana, a partir de `startedAt` y `finishedAt`. TDD.
- [ ] **Panel `/panel`:**
  - El pasaporte: 18 casillas con el sello de su nivel estimado, o vacías.
  - Nivel por destreza, racha, tiempo semanal y puntos débiles (las 3 partes con nivel más bajo).
  - La siguiente tarea, con enlace, y la cuenta atrás hasta el examen si hay fecha.
  - Vacío amable para un usuario nuevo, con enlace al test de nivel.
- [ ] **Banco de errores `/errores`:** errores por parte, con su recuento y su racha de aciertos, más un enlace al entrenador de esa parte (que ya ofrece «Repasar errores»). Hay un botón para vaciar el banco, con confirmación.
- [ ] **Ajustes:** fecha del examen (`sello:exam-date`), incluida en exportar/importar.

### 7b — Flashcards (SM-2)

- [ ] `src/lib/flashcards/sm2.ts` (TDD): SM-2 clásico con 4 botones (Otra vez, Difícil, Bien, Fácil → calidad 1, 3, 4, 5), factor mínimo 1,3 y fechas en días locales.
- [ ] Mazo:
  - Las 276 entradas de vocabulario (cara: palabra y ejemplo con hueco; dorso: definición, colocaciones y falso amigo).
  - Las 120 frases funcionales (cara: función y situación; dorso: la frase).
  - Filtros por mazo, nivel y tema.
  - 15 tarjetas nuevas al día (decisión de la app, ajustable en Ajustes) y todas las pendientes.
- [ ] Estado en `sello:flashcards` (solo las tarjetas vistas), incluido en exportar/importar.
- [ ] Página `/flashcards`: sesión con teclado (espacio para dar la vuelta, 1–4 para calificar), resumen al final y recuento en el panel.

### 7c — Test de nivel

- [ ] Unos 20 minutos, una sola vez o repetible:
  - 15 preguntas de Grammar y 10 de Vocabulary, con dificultad creciente y A2–C1 mezclado.
  - Una tarea de Reading de la parte 1 o 3.
  - Tres tareas de Listening de la parte 1 y una de la parte 2.
  - Todo sale del banco actual.
- [ ] El resultado:
  - Da un nivel estimado para Core, Reading y Listening, y deja Writing y Speaking como «sin estimar: haz una tarea».
  - Guarda los intentos con el modo `exam`, así que alimenta el panel.
  - Propone un plan: las 3 partes que conviene practicar primero.
- [ ] Página `/test-de-nivel`: explicación, inicio, progreso por secciones, resultado con sellos (animación) y plan.

### 7d — Simulacro y animación del sello

- [ ] Simulacro completo con los tiempos reales por componente (`EXAM_FORMAT`):
  - Core 25 + 25 preguntas en 25 min.
  - Reading en 35 min.
  - Listening con 2 reproducciones por grabación.
  - Writing en 50 min.
  - Speaking en unos 12 min.
- [ ] Se puede hacer entero o por componentes. El componente en curso se guarda (`sello:mock`) para continuar tras recargar.
- [ ] Informe:
  - Porcentaje y nivel estimado por destreza.
  - Writing y Speaking con autoevaluación al final.
  - Explicación del papel de G&V como desempate y los puntos débiles con enlaces.
  - El sello cae al terminar.
- [ ] Animación del sello en `Stamp` (`animate`): caída, rebote, asentamiento girado y tinta, en unos 700 ms, con fundido si se pide menos movimiento. Se usa al subir de nivel una parte (comparando la estimación anterior y la nueva al guardar un intento), al terminar el test de nivel y al terminar el simulacro.
- [ ] Playwright (§10): flujo del simulacro por componentes con reloj simulado, sin capturas.

### Cierre de la fase

- [ ] `npm run check`, `ponytail-review` del diff de cada lote, `CLAUDE.md`, memoria, espejo y `.playwright-mcp/` borrado.

## Review Focus

1. **Estimación honesta:** nunca hay nivel sin datos suficientes, siempre aparece la etiqueta «estimación de la app» y no se muestra ningún 0–50. Pinea: tests de `level.ts` y la comprobación de textos en el navegador.
2. **Fechas locales:** la racha y SM-2 cuentan días en hora local, no en UTC, incluido el cambio de hora. Pinea: tests con zonas horarias fijadas.
3. **Exportar/importar** con las claves nuevas, y compatibilidad con ficheros antiguos. Pinea: tests de `importProgress`.
4. **Simulacro reanudable:** recargar a mitad no pierde lo hecho ni regala tiempo. El reloj sigue corriendo según la hora de inicio guardada. Pinea: test del reductor del simulacro y Playwright.
5. **Reutilización:** el test de nivel y el simulacro montan las tareas existentes, sin copiar entrenadores.

## Fuera de alcance

Corrección por IA (fase 9), cuentas y sincronización (fase 9), notificaciones, logros más allá de los sellos, estadísticas por punto gramatical.

## Preguntas para aprobar

1. ¿Nivel estimado con las bandas propias (C ≥ 85 %, B2 ≥ 70 %, B1 ≥ 55 %, A2 ≥ 40 %), con más peso para los intentos recientes y en modo examen, un mínimo de datos para mostrarlo y Writing/Speaking por autoevaluación?
2. ¿Simulacro entero o por componentes, reanudable, y un informe con porcentaje y nivel estimado (sin escala 0–50)?
3. ¿Flashcards con el vocabulario y las frases funcionales, SM-2 con 4 botones y 15 nuevas al día?
4. ¿Lotes 7a → 7d seguidos sin parar a pedir permiso entre ellos, salvo que algo se salga del plan? Cada lote termina con su commit y una línea de resumen.
