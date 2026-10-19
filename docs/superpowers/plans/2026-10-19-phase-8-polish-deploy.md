# Fase 8: pulido y despliegue — plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** dejar Sello listo para usarse en el móvil y publicado:
- Accesibilidad revisada con herramientas y a mano.
- Lighthouse ≥ 90 en móvil en las páginas principales.
- PWA instalable que funciona sin conexión en lo ya visitado.
- SEO completo: metadatos, hreflang, sitemap, robots, Open Graph y datos estructurados.
- Aviso legal con los datos del titular y favicon.
- Pruebas de extremo a extremo con Playwright en el repo.
- Despliegue en Vercel.

**Architecture:**
- Nada nuevo en la lógica de estudio.
- SEO y PWA usan lo que Next 16 trae de serie: `sitemap.ts`, `robots.ts`, `manifest.ts`, `opengraph-image.tsx` con `next/og`, y `metadataBase` y `alternates` en `generateMetadata`.
- El service worker se escribe a mano (`public/sw.js`, sin Workbox).
- Antes de tocar nada, se leen las guías de `node_modules/next/dist/docs/` para cada pieza, como pide `AGENTS.md`.

**Spec:** `docs/superpowers/specs/2026-10-18-sello-design.md`: §2 (reglas 2, 5 y 7), §5, §6, §7, §10 y la fase 8 de §11.

## Global Constraints

- Ningún paquete, servicio ni clave sin el OK del usuario (ver preguntas).
- Sin variables de entorno ni claves en esta fase.
- **No afiliación:**
  - El aviso visible en todas las páginas se mantiene.
  - Ni el sitemap, ni los metadatos, ni los datos estructurados usan la marca del British Council como si fuera nuestra.
  - «Aptis ESOL General» solo aparece de forma descriptiva.
- **Privacidad:**
  - Sin analítica ni cookies.
  - La política de privacidad dice qué guarda el navegador (progreso, ajustes, flashcards, simulacro) y qué ve el alojamiento (registros técnicos de Vercel).
  - Nada personal en URLs.
- **Rendimiento:** lo que no cabe en 90 se arregla en origen, no ocultándolo. Los primeros sospechosos son las páginas que envían bancos enteros al cliente: simulacro, test de nivel y flashcards.
- Cada lote se cierra compilando, con lint, tipos y tests limpios, comprobado en el navegador y commiteado. Los lotes 8a → 8d van seguidos, salvo que algo se salga del plan.

## Lotes

### 8a — Accesibilidad y rendimiento

- [ ] **Auditoría con axe** (`@axe-core/playwright`) en todas las rutas, en ES y EN y en claro y oscuro. Se corrige todo lo que no sea un falso positivo justificado.
- [ ] **Revisión a mano:**
  - Orden de foco y foco visible en diálogos (`dialog`), drag and drop de Reading 2 por teclado y temporizadores.
  - `aria-live` sin spam y contraste de las escenas SVG en oscuro.
  - Zoom al 200 % y `prefers-reduced-motion`.
- [ ] **Lighthouse** en móvil (build de producción en local): inicio, panel, una lección, un entrenador de cada destreza, flashcards, test de nivel y simulacro.
- [ ] Arreglos de rendimiento según lo que salga:
  - Enviar al cliente solo lo que la sesión usa (ids e índices en vez de bancos completos donde se note).
  - Cargar diferido de lo pesado: escenas, `AssessmentRunner`.
  - Fuentes y CLS.

### 8b — SEO y aviso legal

- [ ] `metadataBase` con el dominio final.
- [ ] `alternates.languages` (hreflang es/en) en todas las páginas a partir de los `pathnames` localizados.
- [ ] `sitemap.ts` con todas las rutas estáticas y dinámicas en los dos idiomas, y `robots.ts`. `/design` se queda con `noindex`.
- [ ] Imagen Open Graph generada con `next/og` (marca Sello, sin logos ajenos) y título y descripción revisados en cada sección.
- [ ] **Datos estructurados JSON-LD:**
  - `WebSite` en el inicio.
  - `LearningResource` en las lecciones de gramática y vocabulario.
  - Sin `Course` ni valoraciones inventadas.
- [ ] **Aviso legal** con los datos del titular (pregunta 1).
- [ ] **Política de privacidad** al día: almacenamiento local, micrófono, voz sintética y alojamiento.

### 8c — PWA y favicon

- [ ] `manifest.ts`: nombre, colores del tema, iconos 192/512 y maskable, y `start_url` al panel del idioma.
- [ ] Iconos PNG y `favicon.ico` generados desde `icon.svg` (pregunta 4).
- [ ] **Service worker `public/sw.js`:**
  - Caché por versión de build.
  - `_next/static` primero desde la caché.
  - Las páginas primero desde la red, con respaldo en la caché y una página «sin conexión» propia.
  - Al desplegar, la versión nueva sustituye a la vieja y se avisa al usuario («Hay una versión nueva: recargar»).
- [ ] Registro solo en producción. Pruebas: instalar, recargar sin red, actualizar tras un build nuevo.

### 8d — Pruebas E2E y despliegue

- [ ] Playwright en el repo (`@playwright/test`), con un proyecto móvil y otro de escritorio y `npm run e2e` contra el build de producción.
- [ ] **Flujos cubiertos:**
  - Navegación ES/EN y tema.
  - Un entrenador de cada destreza en modo examen, con micrófono simulado y reloj falso donde haga falta.
  - Test de nivel completo.
  - Simulacro por componentes, con recarga a mitad.
  - Flashcards.
  - Exportar e importar.
  - axe en cada página.
- [ ] `npm run check` no ejecuta E2E (son lentos); se añade `npm run e2e` y se ejecuta al cerrar cada lote.
- [ ] **Despliegue en Vercel** según la pregunta 3. Después: comprobar que funcionan las URL localizadas, el 404 global, el sitemap, el manifest y el service worker en el dominio real, y pasar Lighthouse otra vez sobre producción.
- [ ] Cierre de fase: `CLAUDE.md`, memoria, espejo y `.playwright-mcp/` borrado.

## Review Focus

1. **Service worker:** nunca sirve una versión vieja indefinidamente ni rompe el progreso guardado. Pinea: E2E de actualización y prueba sin red.
2. **hreflang y sitemap:** cada URL en los dos idiomas apunta a su pareja real. Pinea: test unitario del generador contra `routing.pathnames`.
3. **Sin regresiones** en lo construido. Pinea: E2E de los flujos principales.
4. **Lo legal correcto:** datos del titular, no afiliación y privacidad. Lo reviso yo y lo confirmas tú.

## Fuera de alcance

IA y cuentas (fase 9), analítica, notificaciones push, dominio propio comprado por mí (si lo quieres, lo compras tú).

## Preguntas para aprobar

1. **Aviso legal:** ¿qué datos del titular pongo? Como mínimo nombre (o nombre comercial) y un email de contacto. Añade NIF y domicilio si vas a tener ingresos o publicidad.
2. **Paquetes de desarrollo:** ¿puedo instalar `@playwright/test` (descarga navegadores, unos 150 MB) y `@axe-core/playwright`, y usar `npx lighthouse` sin instalarlo en el repo?
3. **Despliegue:** ¿Vercel con un repo privado en GitHub (necesitas tener `gh` con sesión iniciada) o con la CLI de Vercel (`npx vercel`, inicias sesión tú)? ¿Con el dominio gratuito `*.vercel.app`, y qué nombre prefieres (por ejemplo `sello-aptis`)?
4. **PWA y favicon:** ¿PWA instalable y sin conexión para lo ya visitado, con aviso de versión nueva? ¿Genero yo el `favicon.ico` y los iconos desde `icon.svg` (renderizándolos en el navegador, sin paquetes), o me pasas los tuyos?
