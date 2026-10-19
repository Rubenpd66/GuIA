# Auditoría técnica del diseño (fase 10e, paso 1)

Fecha: 2026-10-19. Herramientas: detector de `impeccable` (v4.6.0) sobre `src/` y sobre 12 páginas renderizadas (build de producción, 1280×800 y 390×844), búsqueda local de `ui-ux-pro-max` y lectura del código. Los e2e ya existentes cubren axe en todas las rutas en claro y oscuro, reflow a 320 px, foco y movimiento reducido. No hay capturas de pantalla, por la regla del proyecto, así que el juicio visual es sobre código y medidas del detector.

## Puntuación

| # | Dimensión | Nota | Hallazgo principal |
|---|---|---|---|
| 1 | Accesibilidad | 3 | El modo de movimiento reducido apaga toda transición a 0,01 ms en vez de ofrecer una alternativa |
| 2 | Rendimiento | 4 | Páginas estáticas, fuentes con `next/font`, sin imágenes pesadas ni animaciones caras |
| 3 | Temas | 4 | Tokens completos en `globals.css`, modo oscuro con test de contraste; solo la imagen OG usa hex (inevitable) |
| 4 | Responsive | 3 | Algunas filas con relleno vertical justo; el temario abre con una columna muy larga |
| 5 | Integridad | 3 | Sistema propio y coherente (pasaporte); dos detalles sueltos |
| **Total** | | **17/20** | **Bueno** |

## Veredicto de integridad

Aprobado. El sitio tiene un sistema propio y reconocible: tokens de pasaporte (papel, tinta, burdeos de cubierta, dorado), una escala tipográfica de tercera mayor sobre 17 px, Archivo para la interfaz y Literata para la lectura larga, y una sola animación con intención (el sello que cae). El detector solo encuentra 2 cosas en el código y 6 en las páginas renderizadas, todas menores.

## Resumen

- 0 P0, 0 P1, 4 P2, 3 P3.
- Lo técnico está sano: la 10e no tiene que arreglar nada urgente.
- La distancia está en tus objetivos, no en errores: **casi no hay movimiento** (10 transiciones de color y una animación en todo el sitio), y la separación entre secciones depende de bordes finos (`hairline`) y del espacio, sin una escala de ritmo vertical documentada.

## Hallazgos

**[P2] El movimiento reducido lo apaga todo**
- Dónde: `src/app/globals.css`, bloque `@media (prefers-reduced-motion: reduce)` global.
- Impacto: con más movimiento en la 10e, esa regla quitaría también los cambios de estado útiles (aparecer, confirmar un acierto). Lo correcto es una alternativa por animación (fundido corto en vez de desplazamiento), como ya hace `.stamp-drop`.
- Comando: `/impeccable animate`.

**[P2] El temario abre con una columna muy larga**
- Dónde: `src/app/[locale]/syllabus/page.tsx:45`, `grid gap-12 lg:grid-cols-2`.
- Impacto: en escritorio, una columna mide 1,7 pantallas y la otra 0,4; el pliegue cae dentro de la sección y la página parece desequilibrada.
- Comando: `/impeccable layout`.

**[P2] Filas con poco relleno vertical**
- Dónde: listas con `py-1` (`LevelCatalogue` en planes, filas de tareas por parte; también en la lección y el simulacro en móvil, con 2,4 px alrededor de un texto de 21 px).
- Impacto: filas apretadas que se leen como una masa; en móvil, objetivos de toque al límite.
- Comando: `/impeccable layout`.

**[P2] Sin escala de ritmo vertical**
- Dónde: espaciados sueltos por página (`space-y-8`, `space-y-10`, `space-y-12`, `space-y-16`, `mt-3`…).
- Impacto: es la causa de que la separación entre secciones y párrafos se note poco o cambie de una página a otra.
- Comando: `/impeccable layout` (y documentarlo en `DESIGN.md`).

**[P3] Borde lateral grueso en Writing**
- Dónde: `src/components/writing/WritingTrainer.tsx:212`, `border-l-4`.
- Impacto: patrón muy visto; no encaja con el resto, que usa bordes de 1,5 px.
- Comando: `/impeccable polish`.

**[P3] Curva con rebote en el sello**
- Dónde: `globals.css:175`, `cubic-bezier(0.2, 0.9, 0.3, 1.15)`.
- Impacto: aviso del detector, pero aquí es intencionado (el golpe del sello). Se decide en la dirección visual.

**[P3] Botón de 44 px en Reading**
- Dónde: `src/components/reading/SortableList.tsx:30`, `size-11`.
- Impacto: por debajo de los 48 px que fija el proyecto.
- Comando: `/impeccable adapt`.

## Lo que funciona

- Contraste AA comprobado por test, en claro y oscuro.
- Objetivos de 48 px casi en todas partes, reflow a 320 px sin scroll lateral, foco visible con anillo propio también dentro de la cubierta.
- Tokens semánticos sin colores sueltos en los componentes.
- Una sola animación, con alternativa propia para el movimiento reducido.

## Acciones recomendadas

1. **[P2] `/impeccable layout`**: escala de espaciado y ritmo vertical, temario, filas apretadas.
2. **[P2] `/impeccable animate`**: movimiento con alternativa por animación para el modo reducido.
3. **[P3] `/impeccable adapt`**: el botón de 44 px.
4. **`/impeccable polish`**: pasada final.

En el plan de la 10e estos pasos van después de elegir la dirección visual (paso 2), que es la que decide si el pasaporte se moderniza o se sustituye.
