# Fase 2d: vocabulario, lenguaje funcional y can-do — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** cerrar la fase 2 con el resto del contenido del Core: grupos y entradas de vocabulario de todos los temas y sets, 300 ítems de Vocabulary, unas 120 frases funcionales y unos 54 objetivos «I can…» B1–C1, y mostrar las frases y los objetivos en la web.

**Architecture:** dos piezas de código pequeñas y testeadas (nivel en las frases funcionales y ayudas de índice; dos vistas nuevas) y el resto contenido JSON redactado por agentes `content-writer`, validado y revisado. Las frases funcionales tienen página propia; los can-do se ven en el temario (por nivel y destreza) y en cada lección enlazada.

**Tech Stack:** el de la fase 2a. Sin dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-10-18-sello-design.md` (§4 temario, §7 rutas, §8 modelo de contenido). Guía: skill `aptis-content`.

## Global Constraints

- Contenido original en inglés británico; los textos `es`, en español peninsular neutro y breve.
- Los can-do se redactan con palabras propias: se inspiran en los niveles del MCER, pero no copian descriptores oficiales.
- English Vocabulary in Use (evu, 101 unidades) solo aporta números de unidad. Ningún texto, lista ni ejercicio suyo entra en el repositorio.
- Vocabulary: banco compartido de 8–10 palabras por tarea, una sola palabra válida por ítem, `usage` con un único `___`.
- Rutas nuevas con versión `es` y `en` (test de rutas); `messages/es.json` y `en.json` con las mismas claves (test de paridad).
- Unidades egu 35 y 41: siguen abiertas. No se tocan en este lote salvo que el usuario dé los números.

## Review Focus

1. **Falsos amigos mal descritos** (_actually_, _eventually_, _sensible_, _carpet_): una trampa explicada al revés enseña el error. Pinea: revisión de cada `falseFriend` en la Task 4.
2. **Modismos anticuados o de EE. UU.** (_it's raining cats and dogs_, _ballpark figure_): no ayudan para un examen británico actual. Pinea: misma revisión, con la regla «solo si un hablante británico lo usaría hoy».
3. **Registro de frases funcionales mal marcado**: una frase informal marcada como formal acaba en el email formal de Writing 4. Pinea: revisión de `register` en la Task 5.
4. **Can-do que enlazan lecciones inexistentes**: el validador ya da error; además, cada lección con can-do debe mostrar la sección «Objetivos» y las demás no. Pinea: test de `canDoOfLesson` (Task 1) y comprobación en navegador (Task 6).
5. **Página de frases con decenas de entradas en 375 px**: debe agruparse por función con navegación interna y sin desbordes. Pinea: comprobación en navegador (Task 6).

---

## File Structure

```
src/lib/content/schemas/lessons.ts        FunctionalPhrase + level, + note opcional
src/lib/content/schemas/lessons.test.ts   tests del esquema
src/lib/content/index.ts                  orden de frases y can-do; canDoOfLesson, canDoByLevel, phrasesByFunction
src/lib/content/index.test.ts             tests de las ayudas
src/i18n/routing.ts                       + "/functional-language" (es: /lenguaje-funcional)
src/app/[locale]/functional-language/page.tsx   página nueva
src/app/[locale]/syllabus/page.tsx        + enlace a lenguaje funcional, + objetivos por nivel
src/app/[locale]/grammar/[slug]/page.tsx  + sección «Objetivos»
src/components/lessons/CanDoList.tsx      lista de objetivos (temario y lección)
messages/{es,en}.json                     + Functional, CanDo
content/vocabulary/groups.json            + 10 temas y 8 sets
content/vocabulary/<group>.json           entradas por tema o set
content/exercises/core-vocabulary/<set>.json y C1 por tema   25 tareas nuevas
content/functional/<function>.json        frases por función
content/can-do/<level>.json               objetivos por nivel
```

### Task 1: Esquema y ayudas de índice

**Interfaces:**
- `FunctionalPhrase` + `level: "B1" | "B2" | "C1"` (obligatorio; no hay frases todavía) y `note?: LocalizedText` (cuándo usarla).
- `canDoOfLesson(index, slug): CanDo[]` — los can-do cuyo `links.lessons` incluye la lección. Fuente única: `GrammarLesson.canDo` sigue existiendo pero se deja vacío.
- `canDoByLevel(index): Record<"B1" | "B2" | "C1", CanDo[]>`, cada lista ordenada por destreza en el orden del enum.
- `phrasesByFunction(index): { function: FunctionalPhrase["function"]; phrases: FunctionalPhrase[] }[]` en el orden del enum, cada lista por nivel y luego registro (neutral, informal, formal).

- [ ] **Step 1: tests que fallan** en `lessons.test.ts` («rejects a functional phrase without level», «accepts an optional note») y en `index.test.ts` («canDoOfLesson returns only statements linking the lesson», «canDoByLevel groups and orders by skill», «phrasesByFunction keeps enum order and drops empty functions»).
- [ ] **Step 2:** `npx vitest run src/lib/content` → FAIL.
- [ ] **Step 3:** implementar; actualizar el fixture de frase funcional en `tests/fixtures/content.ts` con `level`.
- [ ] **Step 4:** `npm run check` limpio.
- [ ] **Step 5:** commit `feat(content): functional phrase level and can-do/phrase lookups`.

### Task 2: Vistas

- [ ] **Step 1:** ruta `"/functional-language": { es: "/lenguaje-funcional", en: "/functional-language" }`; el test de rutas existente la cubre.
- [ ] **Step 2:** página `/functional-language`: título, entradilla («para Writing 3–4 y Speaking»), índice de funciones con anclas, una sección por función con cada frase, su ejemplo, insignia de nivel y de registro y la nota si existe. Sin frases → `EmptyState`.
- [ ] **Step 3:** `CanDoList` (lista por destreza con el texto localizado). Temario: bloque «Objetivos por nivel» con un `<details>` por nivel y enlace a lenguaje funcional en la columna de vocabulario. Lección: sección «Objetivos» solo si `canDoOfLesson` no está vacío.
- [ ] **Step 4:** claves nuevas `Functional.*` (título, entradilla, las 10 funciones) y `CanDo.*` (título, las 6 destrezas) en ES y EN; `npm run check` limpio (paridad, contraste, rutas).
- [ ] **Step 5:** commit `feat(syllabus): functional language page and can-do objectives`.

### Task 3: Grupos de vocabulario

| Grupo | Tipo | evu |
|---|---|---|
| education, technology, environment, health-sport, travel, city, culture-leisure, relationships, shopping-consumption, media | tema | las aporta el usuario |
| collocations, vague-language, formal-informal, idioms, nuance, phrasal-verbs, word-formation, linking-words | set | las aporta el usuario |

- [ ] **Step 1:** el usuario da las unidades evu de cada grupo o dice «sin referencias»; un grupo sin unidades confirmadas sale con `references: []`.
- [ ] **Step 2:** añadir los 18 grupos a `content/vocabulary/groups.json` (título ES/EN y resumen breve, como `work` y `false-friends`).

### Task 4: Entradas de vocabulario

- 10 temas × ~15 entradas (B1–C1, mayoría B2) y sets: false-friends 15, los otros 8 × ~10. Unas 245 en total, un fichero por grupo (`content/vocabulary/<group>.json`), ids = headword en slug, únicos.
- Cada entrada: definición propia, al menos un ejemplo, colocaciones cuando las haya, registro cuando no sea neutro, `falseFriend` en los falsos amigos (también los que aparezcan en temas).

- [ ] **Step 1:** 5 agentes en paralelo: (a) education, technology, environment; (b) health-sport, travel, city; (c) culture-leisure, relationships, shopping-consumption, media; (d) false-friends, collocations, vague-language, formal-informal; (e) idioms, nuance, phrasal-verbs, word-formation, linking-words.
- [ ] **Step 2:** `npm run validate:content` → 0 errores, 0 avisos; ids repetidos entre grupos se resuelven con `topics`/`sets` múltiples, no duplicando la entrada.
- [ ] **Step 3:** revisión: falsos amigos, vigencia de modismos, ejemplos naturales.
- [ ] **Step 4:** commit `content(vocabulary): groups and entries for all topics and sets`, incluyendo `groups.json`.

### Task 5: Tareas de Vocabulary, frases funcionales y can-do

**Vocabulary (25 tareas de 5 ítems, hasta 300):**

| Fichero | Tipos |
|---|---|
| collocations | collocation, collocation |
| false-friends | definition, usage |
| formal-informal | synonym, usage |
| idioms | definition, usage |
| nuance | synonym, usage |
| phrasal-verbs | synonym, definition |
| word-formation | definition, usage |
| linking-words | synonym, usage |
| vague-language | synonym, definition |
| C1 en work, education, technology, environment | collocation (añadida al fichero del tema) |
| C1 en health-sport, media | synonym |
| C1 en relationships | definition |

Las tareas de sets llevan `topic: "general"`. Resultado esperado: synonym 75, definition 75, usage 75, collocation 75. Ids `cv-<grupo>-<type>s-NN`, con `NN` siguiente al último del fichero.

**Frases funcionales:** `content/functional/<function>.json`, 12 por función (4 B1, 4 B2, 4 C1), mezcla de registros; ids `fl-<function>-NN`.

**Can-do:** `content/can-do/{b1,b2,c1}.json`, 3 por destreza y nivel (54), ids `cd-<level>-<skill>-N`, `links.parts` con las partes del examen que trabajan y `links.lessons` con lecciones existentes cuando encaje.

- [ ] **Step 1:** 4 agentes: (a) tareas de sets 1–5; (b) tareas de sets 6–9 y las 7 C1 de temas; (c) frases funcionales; (d) can-do (lee `content/grammar/` para elegir enlaces).
- [ ] **Step 2:** `npm run validate:content` → 0 errores, 0 avisos; `Core Vocabulary: 300 items (synonym 75, definition 75, usage 75, collocation 75)`.
- [ ] **Step 3:** revisión con el volcado de claves del 2b y la comprobación de prompts duplicados; registro de cada frase; can-do en palabras propias.
- [ ] **Step 4:** commit `content(core): vocabulary tasks, functional phrases and can-do statements`.

### Task 6: Cierre de la fase 2

- [ ] **Step 1:** `npm run check`, `format:check` y `build`; reiniciar el servidor de desarrollo (caché de contenido).
- [ ] **Step 2:** Playwright sin capturas, a 375 y 1280 px, claro y oscuro, ES y EN: `/es/vocabulario` con 20 grupos y un grupo con falsos amigos destacados; `/es/lenguaje-funcional` con 10 funciones y anclas; temario con objetivos por nivel; una lección enlazada muestra «Objetivos» y una sin enlaces no; Vocabulary en modo examen con los 4 tipos. Borrar `.playwright-mcp/`.
- [ ] **Step 3:** `CLAUDE.md` (fase 2 cerrada; siguiente, fase 3 Reading, que necesita su plan) y memoria; commit `docs(claude): close phase 2`; sincronizar Documentos.
- [ ] **Step 4:** informe breve con recuentos, cobertura evu y esfuerzo recomendado para la fase 3.
