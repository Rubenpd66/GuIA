# Contenido

Todo el contenido de estudio y los ejercicios viven aquí, como JSON, separados del código. Se valida con:

```bash
npm run validate:content
```

El build (`npm run build`) ejecuta esta validación antes de compilar: un fichero con errores impide publicar.

## Formato de un fichero

Cada fichero `.json` tiene esta forma:

```json
{ "kind": "exercises", "items": [ ... ] }
```

| `kind`                | Contiene                                                               | Esquema                               |
| --------------------- | ---------------------------------------------------------------------- | ------------------------------------- |
| `exercises`           | Ejercicios de cualquiera de las 18 partes, distinguidos por `examPart` | `src/lib/content/schemas/exercise.ts` |
| `grammar-lessons`     | Lecciones de gramática                                                 | `src/lib/content/schemas/lessons.ts`  |
| `vocabulary`          | Entradas de vocabulario, incluidos falsos amigos                       | `src/lib/content/schemas/lessons.ts`  |
| `can-do`              | Objetivos «I can…» por nivel y destreza                                | `src/lib/content/schemas/lessons.ts`  |
| `functional-language` | Conectores y frases funcionales por función y registro                 | `src/lib/content/schemas/lessons.ts`  |

Los números de cada parte (opciones, frases, párrafos, rangos de palabras) salen de `src/lib/exam/format.ts`.

## Reglas

- Contenido original: se imita el formato del examen, nunca se copian textos, audios ni preguntas.
- Inglés británico (colour, organise, flat, queue). El validador avisa de la ortografía americana; las claves `es` y `spanish` se ignoran.
- Los huecos se escriben con tres o más guiones bajos: `___`.
- Los textos admiten un marcado mínimo: `**negrita**`, `_cursiva_`, `==resaltado==`.
- Los `id` y `slug` van en minúsculas con guiones y son únicos en todo el contenido.
- En Reading part 2, `sentences` se guarda en el orden correcto; la app desordena las frases 2–6.
