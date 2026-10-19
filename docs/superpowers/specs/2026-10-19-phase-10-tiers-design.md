# Fase 10: planes por nivel, pagos, rediseño y SEO

Especificación de diseño aprobada por secciones el 2026-10-19. Complementa la especificación general (`2026-10-18-sello-design.md`), cuyas reglas no negociables siguen vigentes. Cada subfase (10a–10f) tiene su propio plan en `docs/superpowers/plans/` y se cierra compilando, sin errores de lint ni de tipos, con tests y commit, antes de empezar la siguiente.

## 1. Objetivo y modelo de negocio

Sello es una web instalable (PWA, no apps de tienda) que se vende por suscripción según el nivel al que aspira el alumno. Cada plan desbloquea su nivel y todos los inferiores:

| Plan | Niveles | Mensual | Anual (−20 %) |
|---|---|---|---|
| A2 (`free`) | A2 | gratis | gratis |
| B1 (`b1`) | A2, B1 | 9,99 € | 95,90 € |
| B2 (`b2`) | A2, B1, B2 | 14,99 € | 143,90 € |
| C1 (`c1`) | A2, B1, B2, C1 | 19,99 € | 191,90 € |

Precios en euros, IVA incluido. Cobro con Stripe. Sin prueba gratis ni cupones (el plan A2 hace de prueba). El plan A2 no necesita cuenta.

«Desbloquear un nivel» abarca todo el contenido de ese nivel: lecciones de gramática, vocabulario, frases funcionales, can-do, preguntas de Core, tareas de Reading, Listening, Writing y Speaking, y el simulacro.

### Decisiones tomadas

- PWA y Stripe; nada de compras dentro de apps de Apple o Google.
- Nivel por tarea, no por parte del examen.
- Simulacro por plan.
- A2 sin cuenta; los planes de pago exigen cuenta.
- Lo bloqueado se ve como avance más candado, no se oculta.
- Precios con IVA incluido; pago anual con un 20 % de descuento.
- Contenido A2 nuevo en cantidad equilibrada.
- El contenido de pago se protege en el servidor (enfoque A): avance estático y cuerpo dinámico. Ocultarlo solo en el navegador queda descartado.
- El feedback con IA va después de los pagos (10f), como ventaja de los planes de pago.

## 2. Subfases

| Subfase | Contenido | Depende de |
|---|---|---|
| 10a | Niveles en todo el contenido y contenido A2 nuevo | — |
| 10b | Acceso por plan en el servidor | 10a |
| 10c | Pagos con Stripe | 10b |
| 10d | Página de planes | 10a, 10b, 10c |
| 10e | Rediseño completo, textos y SEO | 10d |
| 10f | Feedback con IA para Writing y Speaking | 10c (diseño propio, más adelante) |

El despliegue sigue la regla de la fase 9: nada va a producción hasta que el usuario lo audita y lo pide.

## 3. 10a: Niveles

### Modelo

- `src/lib/access/tiers.ts` es la única fuente de los planes: `TIERS = ["free", "b1", "b2", "c1"]`, el nivel máximo de cada uno, `levelsFor(tier)` (niveles acumulados), `tierFor(level)` (el plan mínimo que abre un nivel) y los precios mostrados. Es código puro y tiene test.
- `TARGET_LEVELS` pasa de B1–C1 a A2–C1, de modo que las frases funcionales y los can-do admiten A2.

### Etiquetado

- Lecciones de gramática y entradas de vocabulario: ya tienen `level`; no cambian.
- Ejercicios (todas las partes): ya tienen `cefrLevel` obligatorio en `exerciseBase`, y los entrenadores ya filtran por él (corrección del 2026-10-19 al planificar 10a: no hace falta campo nuevo ni reetiquetar). Se conservan los niveles actuales. En la web se presentan como estimación de la app, nunca como dato oficial del examen.
- Los grupos de vocabulario son temas y mezclan niveles; el nivel lo lleva cada entrada. Por eso «3–4 grupos A2» se concreta como unas 60 entradas A2 repartidas en los grupos temáticos existentes.
- El validador imprime las tareas por nivel y parte, y avisa cuando a un nivel le falta material para montar su simulacro: al menos una tarea completa por parte con nivel igual o inferior.

### Contenido A2 nuevo

Original, en inglés británico, con la skill `aptis-content` y el agente `content-writer`:

- Lecciones de gramática A2: unas 10 nuevas, hasta 18 en total.
- Unas 60 entradas de vocabulario A2 en los grupos temáticos existentes.
- Frases funcionales y can-do A2.
- Tareas A2 en cada parte del examen, como mínimo las necesarias para un simulacro A2 completo; preguntas de Core A2 suficientes para una sesión de entrenador.

Las referencias a libros (`src/config/books.ts`) se añaden solo con el OK del usuario.

### Uso de los niveles

- Simulacro: toma tareas de todos los niveles que abre el plan; el de C1 es el examen completo con todos los niveles mezclados.
- Test de nivel: abierto a todos. Usa un conjunto fijo de ejercicios marcados con `placement: true`, de modo que no reparte material de pago. En 10b esos ejercicios cuentan como libres para cualquier plan.
- Flashcards, banco de errores y progreso: solo muestran elementos de niveles desbloqueados. El progreso guardado no se borra al bajar de plan; vuelve a verse al subir.

## 4. 10b: Acceso por plan

### Datos

Tabla `public.subscriptions` (migración nueva):

- `user_id uuid primary key references auth.users on delete cascade`
- `tier text check (tier in ('b1','b2','c1'))`
- `interval text check (interval in ('month','year'))`
- `status text` (estado de Stripe)
- `current_period_end timestamptz`
- `cancel_at_period_end boolean`
- `stripe_customer_id text unique`, `stripe_subscription_id text unique`
- `updated_at timestamptz default now()`

RLS activa. Una sola política: `select` para `authenticated` sobre su propia fila. Sin `insert`, `update` ni `delete` para los roles de la Data API; solo escribe el servidor con la clave secreta (webhook y borrado de cuenta).

### Comprobación

`getEntitlement()` en `src/lib/access/entitlement.ts` (`server-only`, envuelto en `cache()` de React para hacer una sola consulta por petición):

1. Verifica la sesión con `getClaims`. Sin sesión → `free`.
2. Lee la fila del usuario con su propio cliente (RLS).
3. Estados `active`, `trialing` y `past_due` con `current_period_end` en el futuro → el plan de la fila. Cualquier otro caso → `free`.

`past_due` mantiene el acceso mientras Stripe reintenta el cobro; cuando Stripe marca la suscripción como `unpaid` o `canceled`, el acceso vuelve a `free`.

### Páginas

- El contenido A2 no cambia: estático y completo.
- Páginas de B1 en adelante:
  - El build genera título, nivel y avance (introducción o primer apartado).
  - Un componente de servidor dentro de `<Suspense>` llama a `getEntitlement()`. Si el plan llega, **lee el cuerpo él mismo por slug** y lo pinta; si no, muestra `LockedNotice` (plan necesario, enlace a planes con `?nivel=`, enlace a iniciar sesión).
  - El cuerpo nunca se pasa como `children` ni como prop desde la parte estática, para que no acabe en el HTML prerenderizado ni en el payload de precarga.
- Índices y temarios: todo visible, con insignia de nivel y candado según el plan.

### Bancos y entrenadores

- El plan de 10b empieza con un inventario de todas las rutas y páginas que entregan ejercicios o cuerpos de lección (bancos, entrenadores por parte, simulacro, flashcards, errores, lecciones).
- `/banks/*` y esas rutas pasan a ser dinámicas, filtran por `levelsFor(tier)` y responden con `Cache-Control: private`.

### Offline

- El service worker sigue guardando lo visitado, así que quien paga estudia sin conexión.
- Al cerrar sesión y al entrar una cuenta distinta (el mismo punto que `claimOwner` en `src/lib/sync/owner.ts`) se borran las cachés de páginas y bancos.
- Atajo aceptado: tras bajar de plan, lo ya cacheado sigue legible sin conexión hasta la siguiente visita con red.

### SEO

Los avances se indexan. Las páginas de pago llevan el marcado de contenido con muro de Google (`isAccessibleForFree: false` y `hasPart` con el selector CSS de la parte bloqueada).

### Tests

- Unitarios: `levelsFor`, `tierFor` y la regla de estados de `getEntitlement` (como función pura).
- E2E: sin sesión, el HTML de una lección B1 no contiene texto de su cuerpo; un usuario `b1` (sembrado con la clave secreta en `sello-dev`) no recibe tareas B2 ni C1 de ningún banco.
- RLS: un usuario autenticado no puede insertar ni modificar su fila de `subscriptions`.

## 5. 10c: Pagos con Stripe

### Catálogo

Tres productos (B1, B2, C1), cada uno con un precio mensual y otro anual, en EUR, con `tax_behavior: inclusive` y `lookup_key` (`sello_b1_month`, `sello_b1_year`, `sello_b2_month`, `sello_b2_year`, `sello_c1_month`, `sello_c1_year`). El código solo usa lookup keys, así que el modo test y el real comparten código. Se crean primero en modo test, con el OK del usuario.

### Alta

- Acción de servidor `startCheckout(tier, interval)`. Exige sesión; si el usuario ya tiene una suscripción activa, devuelve la URL del portal en lugar de un Checkout.
- Reutiliza o crea el cliente de Stripe (`metadata.user_id`) y crea una sesión de Checkout alojada: modo `subscription`, `client_reference_id` igual al id del usuario, `automatic_tax` activado, dirección de facturación obligatoria y consentimiento de términos.
- `success_url` y `cancel_url` vuelven a la página de cuenta con un mensaje. La vuelta no concede acceso: lo concede el webhook.

### Cambios y baja

- Customer Portal de Stripe: cambio entre los tres planes y entre mensual y anual, cancelación, método de pago y facturas.
- Subir de plan: inmediato y con prorrateo. Bajar de plan y cancelar: al final del periodo.
- El acceso al portal está en la página de cuenta, a un clic.

### Webhook

- `src/app/api/stripe/webhook/route.ts`. El proxy ya excluye `/api`.
- Verifica la firma con `STRIPE_WEBHOOK_SECRET` sobre el cuerpo crudo.
- Eventos `checkout.session.completed` y `customer.subscription.created`, `.updated` y `.deleted`: vuelve a leer la suscripción en Stripe y hace upsert de la fila (`lookup_key` → plan). Es idempotente e indiferente al orden.
- Un evento no reconocido o sin usuario se responde con 200 y se registra en el log; uno con firma inválida, con 400.

### Borrado de cuenta

`deleteMyAccount` y `deleteUserAsAdmin` cancelan antes la suscripción de Stripe de inmediato. Si la cancelación falla, la cuenta no se borra y se devuelve un error. Las facturas quedan en Stripe por obligación fiscal; el registro de tratamientos lo documenta.

### Configuración (con OK previo)

- Paquete npm `stripe`.
- `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET`: solo en el servidor (Vercel y `.env.local`), nunca con prefijo `NEXT_PUBLIC_`.
- Opcional: la Stripe CLI para reenviar webhooks en local.

### Legal

- Antes de pagar, el usuario pide el acceso inmediato y acepta perder el derecho de desistimiento de 14 días (contenido digital). Se recoge en Checkout como consentimiento y se menciona en los términos.
- Términos: precios con IVA, renovación automática, cancelación, cambios de plan, qué pasa con el progreso al bajar de plan.
- Privacidad y `docs/legal/README.md`: Stripe como encargado del tratamiento, datos que recibe y plazos de conservación.
- Tareas del propietario, no de código: alta fiscal (autónomo o sociedad), registro en el régimen OSS de IVA, activación de Stripe Tax y de la cuenta en real, y revisión profesional de los textos legales.

### Admin

Suscriptores por plan e intervalo, e ingresos mensuales estimados (el anual dividido entre 12). Solo agregados.

### Tests

- Unitarios: de evento o suscripción de Stripe a fila (fixtures), de `lookup_key` a plan, la regla de «ya suscrito va al portal» y la verificación de firma con cabeceras de prueba del SDK.
- Manual, en modo test: Checkout con la tarjeta 4242, cambio de plan en el portal, cancelación y borrado de cuenta con suscripción activa.

## 6. 10d: Página de planes

- Rutas `/es/planes` y `/en/plans`. Enlaces en la navegación, en el pie y en cada `LockedNotice` (`?nivel=B2` resalta el plan).
- Selector mensual o anual accesible (grupo de opciones) que muestra el ahorro.
- Cuatro tarjetas con precio con IVA, lo que desbloquean (cifras calculadas del contenido en el build: lecciones, palabras, tareas, nivel del simulacro) y el botón según la situación:

  | Situación | Botón |
  |---|---|
  | A2 | «Empezar gratis» |
  | Sin sesión | «Crear cuenta y suscribirme», que pasa por el acceso y vuelve |
  | Con sesión, sin plan | «Suscribirme», que abre Checkout |
  | Suscrito | «Tu plan actual» o «Cambiar de plan», que abre el portal |
- Contenido por nivel: pestañas A2–C1 con las lecciones, los grupos de vocabulario y las tareas por parte. El catálogo es estático; el estado de candado de cada elemento llega como hueco dinámico.
- Preguntas frecuentes: IVA, cancelación, cambios de plan, progreso al bajar de plan, desistimiento y no afiliación.
- Marcado `Product` con sus ofertas.
- Se construye con el sistema de diseño actual; 10e la reestiliza.
- Tests: unitarios de las cifras por plan; E2E del botón según la situación y del resaltado con `?nivel=`.

## 7. 10e: Rediseño, textos y SEO

Objetivo del usuario: más transiciones, efectos y dinamismo; más limpio e intuitivo; separación clara entre secciones y párrafos.

Pasos, cada uno aprobado por el usuario antes del siguiente:

1. Auditoría del diseño actual con `impeccable` y `ui-ux-pro-max`. Se pide permiso antes de lo que descargue binarios o use red.
2. Dirección visual: 2–3 direcciones como maquetas (inicio, una lección, un entrenador); el usuario elige. En este paso se decide si el concepto de pasaporte con sellos se moderniza o se sustituye.
3. Sistema de diseño v2: tokens de color, tipografía, espaciado, ritmo vertical y movimiento (duraciones y curvas), documentados en `DESIGN.md`. La separación entre secciones y párrafos sale de la escala de espaciado, la medida de lectura, los encabezados de sección y la agrupación.
4. Movimiento con `animate`, `emil-design-eng` y `apple-design`: transiciones de página con View Transitions, entrada escalonada de listas, microinteracciones de acierto y error, de sellos y de progreso, y paneles con muelle. Solo `transform` y `opacity`, con `prefers-reduced-motion` respetado. Cualquier librería de animación, con OK previo.
5. Aplicación por familias: estructura e inicio, temario y lecciones, entrenadores y simulacro, panel, cuenta y planes.
6. Textos: reescritura de todos los textos de interfaz y marketing en es y en (`messages/*.json`, inicio, planes) con `humanizer`; inglés británico. El contenido de estudio no se reescribe.
7. SEO con las skills `searchfit-seo`: auditoría técnica y on-page, metadatos, enlazado interno, clusters de palabras clave en español y la landing. Las guías o artículos nuevos se proponen en una lista para que el usuario elija.
8. Revisión final: `review-animations`, accesibilidad y rendimiento.

Invariantes: el test de contraste AA, objetivos táctiles de 48 px, reflow a 320 px, los E2E actuales, Core Web Vitals sin empeorar, aviso de no afiliación y nada de colores, logotipo ni nombre comercial del British Council.

## 8. 10f: Feedback con IA

Fuera del alcance de esta especificación. Tendrá su propio diseño después de 10c: ventaja de los planes de pago, con un tope de usos por plan, permiso previo y aviso de coste, función de servidor y clave solo en Vercel (lo que ya fijaba la especificación general).

## 9. Fuera de alcance

- Apps en App Store o Google Play.
- Pruebas gratis, cupones y planes familiares o para academias.
- Reescribir el contenido de estudio existente (solo se le añade el nivel).
- Pagos fuera de Stripe.
