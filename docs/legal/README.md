# Documento legal para el titular (RGPD / LOPDGDD)

Notas para ti, no para publicar. Sello trata datos personales solo si alguien crea una cuenta. Sin cuenta, todo queda en el navegador y no hay tratamiento por tu parte.

## Registro de actividades de tratamiento (art. 30 RGPD)

| Campo | Contenido |
|---|---|
| Responsable | Ruben Perez Dominguez, NIF 04657271R, Avenida Huerta Abajo 39B, 16770 San Lorenzo de la Parrilla (Cuenca), rubenpd66@gmail.com |
| Actividad | Cuentas de usuario, sincronización del progreso de estudio y suscripciones de pago |
| Finalidad | Dar acceso a la cuenta y mantener el progreso sincronizado entre dispositivos |
| Base legal | Ejecución del servicio solicitado (art. 6.1.b RGPD) |
| Interesados | Estudiantes con cuenta, de 14 años o más |
| Datos | Email, fecha de alta y de último acceso, identificador interno; copia del progreso, flashcards, fecha de examen y simulacro en curso; con suscripción, plan, estado, fechas e identificadores de Stripe (nunca datos de tarjeta). Stripe recibe nombre, email, dirección de facturación y medio de pago |
| Destinatarios | Ninguno, salvo los encargados de abajo. No hay cesiones ni venta |
| Encargados | Supabase (base de datos y autenticación, región UE, Fráncfort); Vercel (alojamiento; datos técnicos de visitas); Google, solo como identidad si el usuario elige «Entrar con Google»; Stripe Payments Europe (cobros, facturación, impuestos; su DPA se acepta con el contrato de servicios de Stripe) |
| Transferencias | Vercel, Google y Stripe pueden implicar transferencia a EE. UU. Comprueba que sus DPA incluyen cláusulas contractuales tipo o adhesión al Marco de Privacidad UE-EE. UU. |
| Conservación | Mientras exista la cuenta. Al borrarla se cancela la suscripción de Stripe y se eliminan los datos en cascada. Las facturas quedan en Stripe el plazo que exige la ley fiscal (registro de tratamientos: obligación legal, art. 6.1.c RGPD) |
| Seguridad | RLS en todas las tablas, clave secreta solo en servidor, cabeceras de seguridad y CSP, contraseñas gestionadas por Supabase Auth, registro de acciones de administración (`admin_log`) |

Un registro de acciones de administración solo guarda ids, nunca emails.

## Qué tienes que hacer tú

1. **Aceptar los DPA** (contratos de encargo del tratamiento). El texto de privacidad dice que existen; hasta que los aceptes no es cierto.
   - Supabase: panel de la organización → *Legal* → Data Processing Addendum (se firma desde el panel).
   - Vercel: DPA en <https://vercel.com/legal/dpa>, aplicable desde tu cuenta.
2. **Revisar los textos** de Privacidad, Términos y Cookies con un profesional (abogado o gestoría) antes de abrir al público. Los he redactado como borrador razonable, no como asesoramiento jurídico.
3. **Comprobar que la dirección y el NIF** de `src/config/site.ts` son los que quieres hacer públicos (aparecen en el Aviso legal).
4. **Si añades analítica** (GA4), hace falta banner de consentimiento con rechazo tan fácil como aceptar y actualizar las políticas.
5. **Cobros (fase 10c)**: el texto ya recoge a Stripe como encargado, el desistimiento y la renovación. Te toca a ti, fuera del código: alta fiscal (autónomo o sociedad), registro en el régimen OSS del IVA si vendes a consumidores de otros países de la UE, activar Stripe Tax con tus registros fiscales, activar la cuenta de Stripe en modo real (y repetir allí productos, Portal y webhook) y que un profesional revise los textos de Términos y Privacidad.
6. **Brecha de seguridad**: si ocurre, hay que notificar a la AEPD en 72 h. Ten a mano el contacto de Supabase y las instrucciones de la AEPD.
7. **Plan de Supabase**: el plan gratuito no incluye copias de seguridad diarias ni la protección contra contraseñas filtradas (que viene con Pro). Considéralo antes de abrir al público.

## Atender derechos

- Acceso y portabilidad: el usuario exporta en Ajustes; si te escribe, puedes buscar su fila de `user_data` por id en Supabase.
- Supresión: botón «Borrar mi cuenta»; también puedes borrar desde `/admin`.
- Rectificación: el usuario edita su progreso en la app; el email se cambia pidiéndotelo.
- Plazo de respuesta: un mes.
