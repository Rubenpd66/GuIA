---
name: GuIA
description: Preparación del Aptis ESOL General con el acabado de un producto de idiomas moderno: claro, rápido y con movimiento que explica.
colors:
  canvas: "#ffffff"
  surface: "#f5f7fa"
  ink: "#14161c"
  ink-soft: "#4b5260"
  line: "#6b7280"
  hairline: "#e5e7eb"
  accent: "#1f5fe0"
  on-accent: "#ffffff"
  success: "#15803d"
  danger: "#b91c1c"
  reward: "#f5a524"
  on-reward: "#14161c"
  reward-ink: "#8a5a00"
  level-a2: "#0b6e5a"
  level-b1: "#1f5fe0"
  level-b2: "#9a4a07"
  level-c1: "#be185d"
  canvas-dark: "#0f1115"
  surface-dark: "#171a21"
  accent-dark: "#6b9bff"
typography:
  display:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3.242rem"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.66rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
  reading:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 600
    lineHeight: 1.5
rounded:
  control: "12px"
  card: "16px"
  pill: "9999px"
spacing:
  section: "64px"
  section-lg: "80px"
  card-gap: "16px"
  row-min: "48px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.control}"
    padding: "8px 20px"
    height: "48px"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 20px"
    height: "48px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "24px"
  level-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.level-b1}"
    rounded: "{rounded.pill}"
    height: "28px"
---

# Design System: GuIA

## Overview

GuIA es una web de práctica para el Aptis ESOL General, pensada para móvil y sesiones cortas de cada día. La dirección es deliberadamente la del estándar del sector, ejecutada con el acabado de Busuu y Brilliant: fondo blanco, tinta casi negra, un único azul de acción y color solo donde significa algo (nivel, acierto, error, logro). No hay metáfora ni mundo temático.

Lo que da personalidad es el movimiento con propósito (pulsar, entrar, cambiar de página, acertar o fallar, lograr un nivel) y el ritmo vertical constante. Todo lo demás se aparta para dejar leer y practicar.

**Características clave:**

- Claro y oscuro con los mismos roles de color; el oscuro no usa sombras, usa un borde fino.
- Una sola familia tipográfica (Figtree).
- Separación entre secciones por espacio (64 px), no por líneas.
- El movimiento solo usa `transform` y `opacity`, y cada animación tiene alternativa para movimiento reducido.

## Colors

- **accent** (`#1f5fe0` claro, `#6b9bff` oscuro): acciones primarias, enlaces, elemento activo de la navegación, barras de progreso. Lejos del índigo corporativo del British Council a propósito.
- **canvas / surface**: fondo de página y de tarjetas. La tarjeta se distingue por superficie y sombra suave, no por borde.
- **ink / ink-soft**: texto principal y secundario. `line` (3:1) solo para bordes de controles; `hairline` para separadores.
- **success / danger**: acierto y error, siempre con icono además del color.
- **level-a2 / b1 / b2 / c1**: identidad de cada nivel en chips; texto sobre su propio tinte al 6 % cumple AA (test).
- **reward / on-reward / reward-ink**: ámbar reservado al logro del nivel C; `reward-ink` es la versión legible como texto.

### Named Rules

**La regla del color con significado.** El color de un nivel o de un estado nunca decora: si algo está en ámbar es un logro, en rojo un error.

## Typography

Figtree variable, subconjunto latino (cubre el español), solo estilo normal. Escala de tercera mayor (1,25) sobre 17 px, de 0,75 rem a 3,242 rem. Titulares con peso 700 u 800 y `letter-spacing: -0.015em`; cuerpo en 400. Lectura larga (`.prose-reading`): 54 ch de medida (unos 75 caracteres en Figtree) y interlineado 1,7.

### Named Rules

**La regla de la medida.** Ningún párrafo de lectura pasa de unos 75 caracteres por línea (`.prose-reading`, 54 ch).

## Layout

Contenido de hasta 64 rem. Columna lateral fija desde 1024 px; barra superior y barra inferior con indicador por debajo. Las secciones de página van dentro de `SectionStack` (64 px, 80 px desde `lg`); cada sección es un `Section` (título, texto de apoyo a 8 px, contenido a 24 px). Las páginas no fijan su propio espaciado entre secciones. Filas de lista de al menos 48 px (`min-h-12 py-3`). Reflow sin scroll lateral a 320 px.

## Elevation & Depth

Tarjetas en claro: `0 1px 2px rgb(16 24 40 / .06), 0 4px 12px rgb(16 24 40 / .05)`. En oscuro no hay sombra: borde `hairline`. Las tarjetas-enlace suben 2 px al pasar el ratón (solo con puntero fino).

## Shapes

Controles 12 px, tarjetas 16 px, chips y selectores de periodo en píldora. Sin bordes laterales gruesos de color.

## Components

### Buttons

`primary` (fondo accent), `secondary` (borde `line`), `ghost` (subrayado). Altura mínima 48 px (56 px en `lg`). Pulsar hunde el botón a 0,97 en 140 ms. Los cambios de color al pasar el ratón solo con `hover-fine`.

### Cards / Containers

`Card` sobre `surface`; con `href`, toda la tarjeta es el enlace. No se anidan tarjetas.

### Navigation

Columna lateral con píldora blanca y sombra para el elemento activo; barra inferior de cinco pestañas con un indicador que se desliza con `transform`; el menú «Más» es una hoja inferior (sube en 320 ms, sale en 200 ms).

### Progress and answers

`ProgressBar` rellena con `scaleX`. En los entrenadores, una barra segmentada por pregunta. Las opciones marcan acierto con un pop de 180 ms y error con una sacudida de 240 ms; con movimiento reducido solo cambia el color.

### Achievement (momento de recompensa)

Insignia circular del nivel (en ámbar para C) con un pequeño rebote de 700 ms y un anillo que se expande detrás; el texto aparece 120 ms después. Con movimiento reducido, fundido de 200 ms.

## Do's and Don'ts

### Do:

- Usa `Section`, `SectionStack` y `Card` en lugar de espaciados propios.
- Anima solo `transform` y `opacity`, con la alternativa de movimiento reducido en la misma regla.
- Comprueba cada par de color nuevo en el test de contraste (`theme-tokens.test.ts`).
- Mantén el aviso de no afiliación visible en todas las páginas.

### Don't:

- No uses colores, logotipo ni nombre del British Council.
- No animes con `transition: all` ni con `ease-in`; no animes acciones de teclado.
- No prometas IA mientras no exista (10f).
- No pongas una tarjeta dentro de otra ni un borde lateral grueso de color.
