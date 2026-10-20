# Fase 10f: feedback con IA (borrador de diseño)

Borrador preparado el 2026-10-20 sin el usuario, que pidió terminar lo que no necesitara su intervención. Esta fase sí la necesita: hay que elegir proveedor, crear una clave, fijar topes y aceptar un coste. Nada de esto está implementado. Las reglas no negociables de la especificación general siguen vigentes (sin claves en el cliente ni en el repositorio, permiso previo, aviso de coste).

## 1. Qué hace

- **Writing:** el alumno envía su texto de una tarea (partes 1 a 4) y recibe una valoración con la rúbrica propia de la app (no la oficial), los errores más importantes corregidos y explicados en español, y una versión mejorada del texto en inglés británico.
- **Speaking (segunda etapa):** necesita convertir la grabación en texto. Opciones, de menos a más coste: el alumno escribe lo que dijo; el reconocimiento de voz del navegador (sin coste, depende del navegador y envía audio a su proveedor); un servicio de transcripción de pago. Se decide aparte.
- Es una ventaja de los planes de pago (B1, B2, C1), con un tope de usos al mes por plan. El plan A2 no la incluye.

## 2. Arquitectura propuesta

- Un manejador de servidor (`src/app/api/feedback/route.ts`) que comprueba la sesión, el plan con `getEntitlement` y el tope de usos, y llama al proveedor. La clave vive solo en Vercel (`ANTHROPIC_API_KEY` u otra) y nunca llega al navegador.
- Tabla nueva `ai_usage` en Supabase (usuario, mes, usos), con RLS de solo lectura para el propio usuario y escritura solo desde el servidor. Requiere migración, que se aplica con el OK del usuario en `sello-dev` y después en `sello`.
- La respuesta del modelo se pide en JSON con un esquema fijo (criterios con nota orientativa, correcciones, versión mejorada) y se valida con Zod antes de mostrarla. Si no valida, se muestra un error y no se descuenta el uso.
- La interfaz añade un botón «Pedir corrección» en el entrenador de Writing, con el aviso de que el texto se envía a un tercero y el contador de usos que quedan.

## 3. Modelo

Propuesta: un modelo de la familia Claude 5. Haiku 5.5 para el coste y la rapidez, o Sonnet 5.5 si la calidad de la corrección lo justifica. Los precios no se fijan aquí: hay que consultarlos en la web del proveedor al decidir, y con ellos calcular el tope de usos por plan.

## 4. Privacidad y legal

- El texto del alumno sale a un tercero: hay que actualizar la política de privacidad (encargado del tratamiento, finalidad, plazo de conservación del proveedor) y pedir un consentimiento explícito la primera vez.
- Los textos no se guardan en Supabase, solo el contador de usos.
- La corrección es orientativa y de la app, no una nota oficial. Se dice en la interfaz.

## 5. Decisiones que necesitan al usuario

1. Proveedor y modelo (y crear la clave en su cuenta).
2. Tope de usos al mes para B1, B2 y C1, y si se acumulan.
3. Coste máximo aceptable al mes y qué pasa al alcanzarlo (cortar o avisar).
4. Si Speaking entra en esta fase y con qué transcripción.
5. OK para la migración `ai_usage` en los dos proyectos de Supabase.
6. Texto de la política de privacidad actualizado.

## 6. Pruebas previstas

Tests de la ruta con el proveedor simulado (sin plan, tope alcanzado, respuesta inválida, éxito), del esquema de la respuesta, del contador de usos, y un e2e con el proveedor simulado que comprueba el aviso, el consentimiento y el contador.
