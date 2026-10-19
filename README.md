# GuIA

Plataforma web no oficial para preparar el Aptis ESOL General con objetivo C, pensada para hispanohablantes.

> GuIA es una web independiente y no oficial. No está afiliada al British Council ni cuenta con su aprobación. Aptis ESOL General es un examen del British Council.

## Requisitos

- Node.js 22.12 o superior (recomendado: 24 LTS)

## Scripts

| Comando                    | Qué hace                                            |
| -------------------------- | --------------------------------------------------- |
| `npm run dev`              | Servidor de desarrollo en http://localhost:3000     |
| `npm run build`            | Valida el contenido y genera la build de producción |
| `npm run check`            | Tipos, lint, tests y validación del contenido       |
| `npm test`                 | Tests unitarios (Vitest)                            |
| `npm run validate:content` | Valida todos los JSON de `content/`                 |
| `npm run format`           | Formatea el código con Prettier                     |

## Documentación

- Especificación: `docs/superpowers/specs/2026-10-18-sello-design.md`
- Planes por fase: `docs/superpowers/plans/`
- Formato del contenido: `content/README.md`
