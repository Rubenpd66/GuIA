# Fase 9: cuentas con Supabase, administración, seguridad y RGPD — plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** cuentas de usuario opcionales con Supabase. Quien inicia sesión tiene su progreso guardado en la nube y sincronizado entre dispositivos; quien no, sigue usando Sello como hoy. Además: un login de administrador con un panel propio, la seguridad revisada a fondo y la parte legal lista para tratar datos personales (RGPD/LOPDGDD).

Ya no entra aquí: la corrección con IA y los pagos pasan a la fase 10. El rediseño visual y el SEO de contenidos van al final de la fase 10.

**Architecture:**
- **Supabase Auth** con `@supabase/ssr`, el patrón oficial para Next 16:
  - `proxy.ts` refresca la sesión con `getClaims` y se combina con el proxy de idiomas que ya existe.
  - Solo actúa cuando hay cookie de sesión, para no frenar las páginas estáticas.
- **Las páginas siguen siendo estáticas.** Lo que depende del usuario (botón de cuenta, sincronización) se pinta en el cliente o detrás de `<Suspense>`, como piden la guía de Next y `cacheComponents`.
- **Primero en local:**
  - `localStorage` sigue siendo la fuente inmediata.
  - Con sesión iniciada, cada clave (`progress`, `flashcards`, `exam-date`, `mock`) se sube a una tabla `user_data` (una fila por usuario y clave, `jsonb` y `updated_at`).
  - Al iniciar sesión, lo local y lo remoto se fusionan con una función pura y testeada: los intentos se unen por id, los errores y las tarjetas se quedan con lo más reciente, y la fecha del examen y el simulacro con lo último que se guardó.
- **Datos:** RLS en todas las tablas, con el propietario comprobado en `USING` y `WITH CHECK`.
- **Administrador:** el rol vive en `app_metadata` (nunca en `user_metadata`, que puede editar el propio usuario). Las acciones de administración se ejecutan en servidor con la clave secreta, que solo existe en Vercel.
- **Skills:** `supabase`, `supabase-postgres-best-practices`, `auth-implementation-patterns`, `gdpr-data-handling`, `security-audit`, `ponytail` y `tdd`.

**Spec:** §2 (reglas 2 y 7), §9 (sincronización con Supabase y RLS) y fase 9 de §11, actualizada por la conversación del 2026-10-19.

## Global Constraints

- **Claves:**
  - `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` pueden ir al navegador, porque las protege RLS.
  - `SUPABASE_SECRET_KEY` solo en servidor (`import "server-only"`) y en las variables de entorno de Vercel. Nunca en el repo, en el cliente ni en `NEXT_PUBLIC_*`.
- **Paquetes:** `@supabase/supabase-js` y `@supabase/ssr`, con versión fijada y lockfile commiteado.
- **Sin cuenta todo sigue funcionando.** Iniciar sesión nunca borra datos locales sin fusionarlos antes.
- **Cookies:** solo las técnicas de sesión de Supabase, que son estrictamente necesarias, así que no hace falta banner de consentimiento. Se documentan en la política de cookies. Sin analítica.
- **Edad:** el registro exige declarar 14 años o más (art. 7 LOPDGDD) y aceptar la política de privacidad y los términos.
- **Datos:**
  - Región de la UE.
  - Tratamiento mínimo: email, fecha de alta y los datos de estudio que ya guarda el navegador.
  - Borrado de cuenta real y en cascada; exportación disponible.
- Cada lote se cierra con `npm run check`, `npm run e2e`, la revisión de seguridad que le toque, commit y despliegue.

## Lotes

### 9a — Proyecto, esquema y sesión

- [ ] Crear el proyecto `sello` en Supabase, en la región de la UE (pregunta 1).
- [ ] Revisar el changelog de Supabase por cambios incompatibles.
- [ ] **Esquema:**
  - `user_data (user_id uuid → auth.users on delete cascade, key text check in (…), value jsonb, updated_at timestamptz)`, con PK `(user_id, key)`.
  - RLS: `select`/`insert`/`update`/`delete` `to authenticated`, usando `(select auth.uid()) = user_id` también en `with check`.
  - Límite de tamaño por fila (`pg_column_size`) para que nadie convierta la base en almacenamiento gratis.
- [ ] Pruebas de RLS con `execute_sql`, simulando dos usuarios y un visitante anónimo: nadie lee ni escribe lo de otro. Pasar `get_advisors` y que salga limpio.
- [ ] Clientes `src/lib/supabase/{server,browser,proxy}.ts` y combinación con el proxy de next-intl, siguiendo la documentación vigente de Supabase y de Next 16.
- [ ] Variables en `.env.local` (ignorado por git) y en Vercel (producción y preview).

### 9b — Acceso, cuenta y sincronización

- [ ] **Rutas localizadas:**
  - `/es/acceso` · `/en/sign-in`: entrar, crear cuenta y recuperar contraseña.
  - `/es/cuenta` · `/en/account`: datos, sincronización, exportar, cerrar sesión y borrar cuenta.
  - Callback de confirmación del email.
- [ ] Formularios accesibles con validación en el servidor (Server Actions), mensajes de error sin revelar si un email existe, y el límite de intentos de Supabase Auth.
- [ ] Botón de cuenta en la barra (se pinta en el cliente, así que no rompe el estático).
- [ ] **Sincronización** (`src/lib/sync/`):
  - `mergeProgress`, `mergeFlashcards`… puras y con TDD.
  - Subida con *debounce* tras cada guardado y descarga al iniciar sesión y al volver a la pestaña.
  - Aviso «Sincronizado» o «Sin conexión, se sincronizará».
- [ ] Borrar la cuenta: confirmación, borrado del usuario en servidor (en cascada con `user_data`), revocación de sesiones y limpieza local opcional.

### 9c — Administración

- [ ] Rol `admin` en `app_metadata` de tu usuario, puesto con SQL por mí una vez te registres. No hay forma de hacerse admin desde la web.
- [ ] `/admin`, sin traducir ni indexar (`noindex`). Comprobación en servidor en cada página y acción: sesión, `getClaims` y rol; si falla, 404.
- [ ] **Panel:**
  - Usuarios: total, altas por semana y activos en 7 y 30 días.
  - Uso: intentos por destreza y parte, calculados con agregados, sin ver el contenido de nadie.
  - Lista de usuarios (email, alta, último acceso) con búsqueda y borrado (con confirmación).
- [ ] Registro de acciones de administración (tabla `admin_log` sin acceso desde el cliente).

### 9d — Seguridad, legal, pruebas y despliegue

- [ ] **Cabeceras:**
  - HSTS, `X-Content-Type-Options`, `Referrer-Policy` y `frame-ancestors 'none'`.
  - `Permissions-Policy`: micrófono solo propio, sin cámara ni geolocalización.
  - CSP según la guía de Next 16 y medida para no romper el estático.
- [ ] **Auditoría completa con `security-audit`:** auth, RLS, secretos, CSRF de las Server Actions, open redirects en el callback, dependencias (`npm audit`) y `get_advisors`.
- [ ] **Textos legales:**
  - Privacidad ampliada: responsable, finalidades, base legal (contrato para la cuenta), encargados (Supabase en la UE, Vercel), plazos de conservación, derechos y cómo ejercerlos, y reclamación ante la AEPD.
  - Términos de uso.
  - Política de cookies.
  - Casilla de aceptación en el registro.
- [ ] **Documento para ti** (`docs/legal/`):
  - Registro de actividades de tratamiento.
  - Recordatorio de aceptar los DPA de Supabase y Vercel en sus paneles.
  - Qué revisar con un profesional.
- [ ] **E2E:**
  - Registro y entrada con un usuario de prueba en el proyecto de pruebas (pregunta 1).
  - Sincronización entre dos navegadores.
  - Acceso a `/admin` denegado sin rol.
  - Borrado de cuenta.
- [ ] Desplegar, comprobar en producción y cerrar la fase.

## Review Focus

1. **RLS:** ningún usuario ve ni modifica datos de otro, y el visitante anónimo no ve nada. Pinea: pruebas SQL con dos usuarios y `get_advisors` limpio.
2. **Fusión sin pérdidas:** iniciar sesión en un dispositivo con progreso no pisa lo que hay en la nube, ni al revés. Pinea: tests de las funciones de fusión.
3. **Admin:** solo con `app_metadata.role = 'admin'`, comprobado en servidor. La clave secreta nunca llega al cliente (lo comprobamos buscándola en el bundle).
4. **Rendimiento:** el proxy no frena a quien no ha iniciado sesión, y las páginas siguen en 90 o más. Pinea: Lighthouse sobre producción.
5. **Legal:** textos coherentes con lo que la app hace de verdad.

## Fuera de alcance

Pagos y planes de pago (fase 10), corrección con IA (fase 10), rediseño visual y SEO de contenidos (final de la fase 10), notificaciones por email más allá de las de cuenta.

## Preguntas para aprobar

1. **Proyecto Supabase:** ¿creo el proyecto `sello` en el plan gratuito, región UE (Fráncfort)? Ojo: en el plan gratuito los proyectos se pausan tras una semana sin actividad; al lanzar pagos convendrá pasar a Pro (unos 25 $/mes). Para las pruebas E2E, ¿creo un segundo proyecto gratuito `sello-dev` (tu proyecto «Macroforge» está pausado y no lo toco)?
2. **Formas de entrar:** ¿email y contraseña más enlace mágico por email? ¿Añado «Entrar con Google»? Eso último requiere que crees un cliente OAuth en Google Cloud; te guiaría paso a paso.
3. **Envío de emails:** el servidor de correo de Supabase solo sirve para pruebas (límite muy bajo). Para usuarios reales hace falta un proveedor SMTP, por ejemplo Resend, que tiene plan gratuito (cuenta nueva y clave en Vercel). ¿Lo configuramos ya o arrancamos con el de Supabase para una beta cerrada?
4. **Administración:** ¿te parece bien que solo tú seas administrador, y que el panel muestre estadísticas agregadas y la lista de usuarios con borrado, sin ver el progreso individual de nadie?
5. **Antibots:** ¿añado Cloudflare Turnstile (gratuito, requiere cuenta de Cloudflare) al registro, o lo dejamos para cuando abramos al público?
