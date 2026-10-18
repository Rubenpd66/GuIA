# Sello: plataforma de preparación del Aptis ESOL General (objetivo C)

Especificación de diseño aprobada el 2026-10-18. Es la referencia de producto, diseño y arquitectura para las 9 fases. Cada fase tiene además su propio plan de implementación en `docs/superpowers/plans/`.

## 1. Propósito

- **Para quién:** hispanohablantes adultos con nivel B1/B2 que se presentan al Aptis ESOL General y quieren la máxima nota (C) en las cinco partes: Core (Grammar & Vocabulary), Reading, Listening, Writing y Speaking.
- **Uso principal:** práctica diaria desde el móvil, seguimiento del nivel estimado por destreza y simulacros con tiempos reales.
- **Éxito:** el usuario sabe en todo momento qué nivel estimado tiene en cada parte, qué le falta para llegar al C y qué practicar a continuación; el formato de cada ejercicio coincide con el del examen real.

## 2. Reglas no negociables

1. Plan por fases; cada fase se aprueba antes de empezarla.
2. No se instala ningún paquete ni se configura ningún servicio, variable de entorno o clave sin avisar antes y recibir el OK.
3. Cada fase termina compilando, sin errores de lint ni de tipos, probada en el navegador y con un commit.
4. Todo el contenido es original: se imita el formato del examen, nunca el contenido de materiales oficiales o comerciales.
5. Web no oficial: aviso visible de no afiliación al British Council en todas las páginas; ni su logotipo, ni su nombre comercial en la marca, ni sus colores corporativos. «Aptis ESOL General» solo aparece de forma descriptiva.
6. No se inventan datos oficiales. Cualquier equivalencia puntuación → CEFR se presenta como estimación orientativa de la app.
7. Ninguna clave de API en el cliente ni en el repositorio.
8. Inglés británico en todo el contenido (colour, organise, flat, queue).

## 3. Formato del examen (fuente de verdad)

Fuente: documento oficial «Aptis ESOL General – Test format overview», tal como lo resumió el usuario. Estos números viven en código en `src/lib/exam/format.ts` y los usan el validador de contenido, los entrenadores y el simulacro.

| Componente | Tiempo | Partes |
|---|---|---|
| Core: Grammar & Vocabulary | 25 min | Grammar: 25 preguntas, 3 opciones, completar una frase (mayoría inglés escrito formal; unas pocas de inglés hablado/registro). Vocabulary: 25 preguntas de 4 tipos: synonym (word matching), definition, usage (completar frase), collocation (word pairs) |
| Reading | 35 min | 1: 5 frases, 3 opciones cada una. 2: 2 tareas de 6 frases desordenadas, la primera fija, ordenación única. 3: 4 personas, 7 afirmaciones, asignar persona. 4: texto de ~750 palabras, 8 encabezados para 7 párrafos (sobra 1) |
| Listening | 40 min, cada audio 1 o 2 veces | 1: mensaje/monólogo/diálogo corto, información concreta. 2: 4 monólogos, 6 informaciones, emparejar hablante. 3: diálogo hombre/mujer, 4 afirmaciones: hombre, mujer o ambos. 4: monólogo, 2 preguntas de actitud/intención/opinión |
| Writing | 50 min | 1: 5 mensajes con palabras sueltas (máx. 3 min). 2: 20–30 palabras (máx. 7 min). 3: 3 respuestas de 30–40 palabras (máx. 10 min). 4: email informal 40–50 + formal 120–150 palabras (~30 min) |
| Speaking | 12 min | 1: 3 preguntas personales, 30 s cada una. 2: foto + 2 preguntas, 45 s cada una. 3: dos imágenes + 2 preguntas, 45 s cada una. 4: imagen + 3 preguntas abstractas, 1 min de preparación y 2 min hablando |

Resultados: 0–50 por destreza y G&V 0–50; total de destrezas sobre 200; nivel CEFR por destreza. G&V desempata cuando una destreza se queda justo por debajo de un umbral (explicarlo en la web). Las puntuaciones no son comparables entre destrezas.

**Decisiones de la app que el documento no fija** (se marcan como tales en la interfaz y en el código):
- Listening partes 1 y 4: 3 opciones por pregunta.
- Vocabulary: cada tarea tiene un banco de palabras compartido por sus ítems; el tamaño del banco es configurable (5–12).
- Reading 4: tolerancia de 700–800 palabras para «~750».
- Writing 1: respuestas de 1 a 5 palabras.
- Número de ítems de Listening 1 en el simulacro: se decide en la fase 4.

## 4. Secciones de la aplicación

1. Inicio. 2. Test de nivel (~20 min, G&V + una lectura + un listening corto → nivel por destreza y plan personalizado). 3. Panel (nivel por destreza, racha, tiempo, puntos débiles, siguiente tarea, cuenta atrás). 4. Temario (Grammar, Vocabulary, Reading, Listening, Writing, Speaking; lecciones, estrategias y ejercicios). 5. Práctica por partes (18 entrenadores). 6. Simulacro completo con informe. 7. Flashcards con repetición espaciada (SM-2). 8. Banco de errores. 9. Guía del examen. 10. Ajustes (idioma, voz y velocidad del listening, tema, fecha del examen, exportar/importar).

Requisitos detallados de cada entrenador, temario y contenido: los del brief original del usuario (secciones 2, 4 y 5), que esta especificación no repite. Cada plan de fase los cita literalmente.

## 5. Stack

| Pieza | Versión al 2026-10-18 | Decisión |
|---|---|---|
| Node | 24 LTS | Vitest 5 exige ≥ 22.12; Node 20 está fuera de soporte |
| Next.js | 16.4 | App Router, `src/`, `proxy.ts` (antes `middleware.ts`), Turbopack, ESLint CLI directo |
| React | 19.3 | |
| TypeScript | estricto + `noUncheckedIndexedAccess` | |
| Tailwind CSS | 4.3 | tokens en CSS con `@theme inline`; oscuro con `@custom-variant dark` sobre `data-theme` |
| next-intl | 4.14 | `defineRouting` con `pathnames` traducidos; locale vía `next/root-params`; `setRequestLocale` + `generateStaticParams` |
| next-themes | 0.4 | `attribute="data-theme"`, claro/oscuro/sistema |
| Zod | 4.6 | esquemas de contenido; `discriminatedUnion` por `kind` y por `examPart` |
| Vitest | 5 | lógica pura (validador, contraste, recuento de palabras, mapa de rutas) |
| Motion | 14 | fase 3+; `MotionConfig reducedMotion="user"` |
| dnd-kit | `@dnd-kit/react` 0.5 o `@dnd-kit/core` 6.3 | se decide en la fase 3 |
| Recharts | 3.10 | fase 7 |
| PWA | Serwist o service worker propio | se decide en la fase 8 (Serwist necesita webpack) |
| Playwright | 1.64 | fases 7–8 |
| Despliegue | Vercel | fase 8 |
| Cuentas | Supabase con RLS | fase 9, opcional |

## 6. Sistema de diseño: el pasaporte

**Concepto.** El progreso es un pasaporte de idiomas que se llena de sellos. Las 18 partes del examen son «fronteras»; cada parte tiene una casilla de sello con el nivel estimado. El pasaporte aparece en el panel, los informes y los logros; las pantallas de examen y ejercicio son solo papel y tinta. Sin iconografía de viajes literal (aviones, maletas, mapas).

**Paleta.**

Cada token es una variable CSS (`--paper`, `--ink`…) que Tailwind expone como color (`bg-paper`, `text-ink`, `border-line`…).

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `paper` | #EEF2EF (papel de visado) | #1C1317 (tapa de noche) | fondo de página |
| `sheet` | #F8FAF8 | #2B1D23 | superficies elevadas, hoja de explicación |
| `ink` | #1A2332 (tinta) | #ECE6DE | texto principal |
| `ink-soft` | #4A5466 | #B5ABA6 | texto secundario |
| `line` | #4A5466 | #9A8F8B | bordes de controles (≥ 3:1) |
| `hairline` | #C9D3CE | #3D2A31 | divisores decorativos |
| `cover` | #6B1F33 (tapa burdeos) | #78263D | marca, navegación, botón principal |
| `on-cover` | #EEF2EF | #F3EEE8 | texto sobre `cover` |
| `foil` | #C9A04A (oro) | #D6B062 | solo sobre la tapa y para el nivel C |
| `entry` | #1E6E50 | #6FCB9F | acierto, sellos de entrada |
| `refusal` | #A8261F | #F28B80 | error |
| `guilloche` | #6E978C | #5A4A50 | patrón decorativo, nunca detrás de texto |
| `focus` | #1A2332 | #D6B062 | anillo de foco (sobre `cover`: `foil`) |

Pares obligatorios (lo comprueba un test): `ink` e `ink-soft` ≥ 4.5:1 sobre `paper` y `sheet`; `on-cover` y `foil` ≥ 4.5:1 sobre `cover`; `entry` y `refusal` ≥ 4.5:1 sobre `paper` y `sheet`; `line` y `focus` ≥ 3:1 sobre `paper` y `sheet`.

**Tipografía** (`next/font/google`, autoalojada).
- Archivo (variable, ejes `wght` y `wdth`): interfaz en anchura normal; titulares y sellos en anchura expandida (`font-stretch` 112–125 %).
- Literata (variable, ejes `wght` y `opsz`): lecciones, textos de lectura, respuestas modelo, enunciados de ejercicios.
- Fuente monoespaciada solo para la línea MRZ del pasaporte (fase 7; clon libre de OCR-B si la licencia lo permite, si no la mono del sistema).
- Escala de razón 1.25 sobre 17 px: 12, 13.6, 17, 21.25, 26.6, 33.2, 41.5, 51.9 px. Lectura con interlineado 1.65 y medida máxima de 68 ch. Alineación a la izquierda; nunca justificado. Solo se centran el sello y la tapa.
- Mayúsculas solo dentro de los sellos (vernáculo real), nunca como etiquetas.

**Forma.** Radio de página 10 px, radio de control 6 px; sin sombras grises genéricas (la elevación se marca con `surface` y `hairline`). Cada destreza tiene su forma de sello: Core círculo, Reading rectángulo con esquinas recortadas, Listening óvalo, Writing hexágono, Speaking triángulo redondeado.

**Disposición.** Mobile first. Móvil: barra superior (marca, idioma, tema), contenido en una columna, barra inferior con Panel, Temario, Práctica, Simulacro y Más (diálogo con Test de nivel, Flashcards, Errores, Guía y Ajustes). Escritorio (≥ 1024 px): lomo lateral burdeos con toda la navegación, contenido en una página de hasta 68 ch. Pie con el aviso de no afiliación en todas las páginas. Controles táctiles de al menos 48 px; opciones de respuesta de al menos 56 px.

**Movimiento.** Un solo momento de impacto: el sello cae, rebota, se asienta girado y la tinta se extiende (subir de nivel, terminar simulacro; fase 7). El resto responde al usuario: mini sello al acertar, sacudida corta al fallar. Con `prefers-reduced-motion` todo se reduce a fundidos de opacidad.

**Principios.**
1. El pasaporte es el progreso: cada dato se ancla a una de las 18 partes y a un nivel CEFR estimado.
2. Primero fiel al examen, luego útil: la estructura copia el examen; las ayudas son una capa activable que desaparece en modo examen.
3. La tinta significa algo: burdeos navega, verde acierta, rojo falla, oro es C. Sin degradados decorativos.

## 7. Rutas

Rutas internas en inglés; rutas públicas traducidas con `pathnames` de next-intl. Prefijo de idioma siempre presente; idioma por defecto `es`; `/` negocia por `Accept-Language`.

| Interna | `/es` | `/en` |
|---|---|---|
| `/` | `/` | `/` |
| `/dashboard` | `/panel` | `/dashboard` |
| `/placement-test` | `/test-de-nivel` | `/placement-test` |
| `/syllabus` | `/temario` | `/syllabus` |
| `/grammar`, `/grammar/[slug]` | `/gramatica`, `/gramatica/[slug]` | `/grammar`, `/grammar/[slug]` |
| `/vocabulary`, `/vocabulary/[slug]` | `/vocabulario`, `/vocabulario/[slug]` | `/vocabulary`, `/vocabulary/[slug]` |
| `/reading` | `/lectura` | `/reading` |
| `/listening` | `/comprension-auditiva` | `/listening` |
| `/writing` | `/expresion-escrita` | `/writing` |
| `/speaking` | `/expresion-oral` | `/speaking` |
| `/practice`, `/practice/[part]` | `/practica`, `/practica/[part]` | `/practice`, `/practice/[part]` |
| `/mock-exam` | `/simulacro` | `/mock-exam` |
| `/flashcards` | `/flashcards` | `/flashcards` |
| `/mistakes` | `/errores` | `/mistakes` |
| `/exam-guide` | `/guia` | `/exam-guide` |
| `/settings` | `/ajustes` | `/settings` |
| `/legal-notice` | `/aviso-legal` | `/legal-notice` |
| `/privacy` | `/privacidad` | `/privacy` |
| `/design` | `/design` (noindex) | `/design` (noindex) |

Los slugs de lección están en inglés en ambos idiomas (`/es/gramatica/inversion`). Los identificadores de parte son los de `examPart` (ver §8).

## 8. Modelo de contenido

Todo el contenido es JSON en `content/`, separado de los componentes. Cada fichero es `{ "kind": ..., "items": [...] }`. Los textos admiten un marcado mínimo en línea: `**negrita**`, `_cursiva_`, `==resaltado==`.

- `kind: "exercises"`: unión discriminada por `examPart`, con los 18 valores `core-grammar`, `core-vocabulary`, `reading-1`…`reading-4`, `listening-1`…`listening-4`, `writing-1`…`writing-4`, `speaking-1`…`speaking-4`.
- Campos comunes de un ejercicio: `id`, `examPart`, `cefrLevel` (A2, B1, B2, C1), `topic`, `difficulty` (1–5), y según la parte `grammarPoint`, `prompt`, `options`, `answer`, `explanation` (`{ en, es? }`).
- Temas: work, education, technology, environment, health-sport, travel, city, culture-leisure, relationships, shopping-consumption, media, general.
- `kind: "grammar-lessons"`, `"vocabulary"`, `"can-do"`, `"functional-language"`: esquemas en `src/lib/content/schemas/`.
- Los guiones de Listening son listas de `{ speaker: "man" | "woman" | "narrator", text }` con un `audio.src` opcional: la capa de audio usa la voz sintética si no hay fichero, de modo que se puede sustituir sin tocar los ejercicios.

`npm run validate:content` valida todos los ficheros con Zod (incluidas las reglas de cada parte: número de opciones, frases, párrafos, rangos de palabras), comprueba IDs únicos y referencias cruzadas, y avisa de la ortografía americana. Se ejecuta antes de `build`.

## 9. Progreso del usuario

Fases 2–8: en el dispositivo (localStorage para ajustes, IndexedDB para historial e intentos) con un esquema versionado y exportación/importación en JSON. Fase 9 opcional: sincronización con Supabase y Row Level Security. Nada personal en URLs.

## 10. Pruebas

- Vitest para la lógica pura: validador de contenido, contraste de tokens, recuento de palabras, mapa de rutas, paridad de mensajes ES/EN; más adelante corrección, puntuación y SM-2.
- Playwright para el flujo del simulacro (fases 7–8).
- Revisión en el navegador al final de cada fase: 375 px y 1280 px, claro y oscuro, ES y EN, solo teclado.

## 11. Fases

1. **Fundamentos:** proyecto, sistema de diseño, layout, navegación, i18n ES/EN, tema claro/oscuro, esquemas de contenido y validador.
2. **Core:** lecciones de gramática y vocabulario B1–C1, banco inicial de preguntas, entrenadores de Grammar y Vocabulary con feedback, almacenamiento del progreso.
3. **Reading:** 4 partes con sus interacciones (arrastrar y soltar accesible, subrayado) y estrategias.
4. **Listening:** capa de audio con `speechSynthesis` y 4 partes.
5. **Writing:** editor, contadores, temporizadores, modelos anotados, plantillas y rúbrica.
6. **Speaking:** grabación, temporizadores, banco de preguntas, ilustraciones SVG y modelos.
7. **Simulacro, test de nivel, panel, flashcards y banco de errores;** animación del sello.
8. **Pulido:** accesibilidad, rendimiento (Lighthouse ≥ 90 en móvil), PWA, SEO (metadatos, sitemap, datos estructurados), Playwright y despliegue en Vercel.
9. **Opcional:** feedback con IA para writing y speaking (función de servidor, clave en Vercel, límite por usuario, permiso previo y aviso de coste) y cuentas con Supabase.
