# SEO de la fase 10e (paso 7)

Fecha: 2026-10-20. Revisión sobre el código y el build local, sin usar la red ni herramientas externas: no hay datos de volumen de búsqueda, así que los grupos de palabras clave son hipótesis para validar con Search Console cuando el sitio esté publicado.

## Estado encontrado

| Área | Estado |
|---|---|
| Título y descripción por página | Todas las páginas públicas los tienen (`generateMetadata`) |
| `sitemap.xml` con alternativas de idioma | Ya existía (`src/lib/seo/sitemap.ts`) |
| `robots.txt` | Correcto: bloquea `/banks/`, `/design` y `/admin` |
| Datos estructurados | `WebSite` en inicio, `LearningResource` en lecciones, `Product` en planes |
| Canonical y hreflang en cada página | **Faltaba**: solo estaban en el sitemap |
| Páginas de lección de pago | Ya marcadas con `isAccessibleForFree: false` y `cssSelector` |

## Corregido en esta fase

- Cada página indexable declara ahora su URL canónica y las alternativas `es`, `en` y `x-default` (español). Código: `src/lib/seo/alternates.ts` (con test) y `alternates` en cada `generateMetadata`, también en lecciones, grupos de vocabulario y entrenadores. Test e2e: `e2e/seo.spec.ts`.
- La portada tiene un titular y una descripción con las palabras que busca el alumno («Aptis ESOL General», «llega al C», 18 partes) y una sección de planes enlazada, con lo que la portada enlaza ya a `/plans`, a la práctica y al test de nivel.

## Pendiente o por decidir

1. **Cuando se cambie la URL**: `SITE.url` en `src/config/site.ts` (una línea) y volver a generar el sitemap con el despliegue.
2. **Search Console**: dar de alta el dominio nuevo y enviar `sitemap.xml`. Hace falta una cuenta; lo haces tú.
3. **Imagen para compartir**: existe una tarjeta Open Graph generada (`opengraph-image.tsx`) con la marca nueva; conviene revisarla a ojo.
4. **Enlazado interno**: las lecciones enlazan a su práctica y las listas enlazan a cada lección. Falta un bloque «lecciones relacionadas» al final de cada lección (misma categoría). Se propone para después de la revisión del usuario.

## Grupos de palabras clave (hipótesis, sin volumen medido)

| Grupo | Búsquedas típicas | Página que debería posicionar |
|---|---|---|
| Examen y formato | «aptis esol general», «formato examen aptis», «partes del aptis», «cuánto dura el aptis» | `/es/guia`, portada |
| Nivel y certificado | «aptis b1», «aptis b2», «aptis c1», «nivel aptis», «cuánto es un c en aptis» | `/es/planes`, `/es/test-de-nivel` |
| Preparación por destreza | «aptis reading ejercicios», «aptis listening práctica», «aptis writing modelos», «aptis speaking preguntas» | Páginas de cada destreza y entrenadores |
| Gramática y vocabulario | «aptis grammar and vocabulary», «ejercicios gramática b2», «collocations b2» | `/es/gramatica`, `/es/vocabulario` |
| Simulacro | «simulacro aptis», «aptis examen de prueba» | `/es/simulacro` |
| Motivo del examen | «aptis oposiciones», «aptis universidad», «aptis visado» | Guías nuevas (lista siguiente) |

No se promete nada de «aprobar» ni de nota oficial en los textos: la marca no es oficial y los niveles son estimaciones.

## Guías o artículos propuestos (elige cuáles)

Ninguna se escribirá hasta que elijas. Cada una enlazaría a la práctica y a los planes correspondientes.

1. Cómo es el Aptis ESOL General, parte por parte (formato y tiempos, apoyada en la guía del examen).
2. Aptis B1, B2 o C1: qué nivel necesito según para qué lo quiero (universidad, trabajo, visado, oposiciones).
3. Errores típicos de un hispanohablante en Grammar and Vocabulary.
4. Cómo preparar el Writing del Aptis: de la parte 1 al email formal.
5. Cómo preparar el Speaking del Aptis sin profesor.
6. Plan de estudio de 4 semanas para el Aptis (con test de nivel y simulacro).
7. Qué hacer el día antes y el día del examen.

Cada artículo es contenido original nuevo y necesita su revisión, por lo que va aparte de esta fase.
