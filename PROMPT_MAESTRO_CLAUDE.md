# PROMPT MAESTRO — Aplicación de inventario para panadería

Actúa como líder técnico senior y coordina especialistas de arquitectura de software, análisis de sistemas, UX móvil, seguridad, bases de datos, QA y DevOps.

Debes construir una aplicación web de producción sencilla, comprensible y mantenible para registrar el conteo diario de panes y otros productos elaborados en una panadería.

## 1. Forma de trabajo obligatoria

Antes de escribir código:

1. Lee completamente `CLAUDE.md`, `README.md` y todos los archivos de `docs/`.
2. Inspecciona el repositorio y no borres trabajo existente sin justificarlo.
3. Presenta un diagnóstico breve del estado actual.
4. Crea o actualiza un plan en `docs/IMPLEMENTATION_PLAN.md`, dividido en fases pequeñas.
5. Identifica riesgos, decisiones pendientes y criterios de aceptación.
6. Trabaja una sola fase a la vez.
7. Después de cada fase, ejecuta lint, typecheck, pruebas y build pertinentes.
8. No avances mientras existan errores conocidos, pruebas fallidas o TODO críticos.
9. Resume exactamente qué archivos cambiaste, por qué, qué verificaste y cuál es el siguiente paso.

No generes toda la aplicación de una sola vez. Prioriza una base correcta y comprobable.

## 2. Arquitectura elegida

Construye la primera versión como una aplicación full-stack en un solo repositorio:

- Next.js con App Router.
- TypeScript en modo estricto.
- Supabase para PostgreSQL, autenticación y Row Level Security.
- Componentes de servidor por defecto; componentes cliente solo cuando haya interacción real.
- Route Handlers o Server Actions para operaciones privilegiadas.
- Despliegue compatible con Cloudflare Workers mediante OpenNext.

No crees un backend NestJS independiente en esta primera versión. La escala y el alcance no justifican dos servicios, dos despliegues, CORS, duplicación de contratos ni manejo adicional de sesiones. Mantén el dominio desacoplado de la UI para permitir extraerlo a NestJS en una fase futura sin reescribir las reglas de negocio.

Estructura orientativa:

```text
src/
  app/
    (auth)/
    (dashboard)/
    report/[token]/
    api/
  components/
    ui/
    inventory/
    products/
    reports/
  features/
    auth/
    inventory/
    products/
    reports/
    users/
  lib/
    supabase/
    validation/
    dates/
    errors/
  server/
    auth/
    repositories/
    services/
    actions/
  types/
supabase/
  migrations/
  seed.sql
```

Puedes mejorar esta estructura, pero explica cualquier cambio.

## 3. Funcionalidades obligatorias

### Autenticación
- Inicio y cierre de sesión por correo y contraseña.
- Sin registro público.
- Recuperación de contraseña preparada.
- Sesiones seguras y protección de rutas.
- Pantallas claras para sesión vencida y acceso denegado.

### Roles y permisos

`ADMIN`:
- Crear usuarios empleados.
- Activar o desactivar usuarios.
- Crear, editar, ordenar y archivar productos.
- Ver todos los conteos y reportes.
- Revocar enlaces públicos.
- Corregir configuración de la panadería.

`EMPLOYEE`:
- Ver productos activos.
- Iniciar un conteo.
- Registrar o modificar cantidades mientras el conteo esté en borrador.
- Recuperar su borrador.
- Finalizar y generar reporte.
- Ver los reportes que produjo, sin editar reportes finalizados.

Implementa autorización en tres niveles: interfaz, servidor y políticas RLS. Ocultar controles no equivale a seguridad.

### Catálogo de productos
- Nombre obligatorio y normalizado.
- Categoría opcional.
- Orden visual configurable.
- Estado activo/archivado.
- Eliminar en la UI significa archivar, no borrar físicamente.
- Evitar duplicados evidentes por nombre normalizado.
- Búsqueda y filtros rápidos.

### Conteo de inventario
- Vista mobile-first con tarjetas o filas compactas.
- Campo numérico grande para cada producto.
- Solo enteros entre 0 y un máximo razonable configurable, inicialmente 99.999.
- Botones opcionales `−1`, `+1` y limpiar.
- Guardado automático con debounce.
- Indicador visible de guardado: guardando, guardado o error.
- Respaldo temporal en `localStorage` para recuperar cambios no sincronizados.
- Confirmación antes de finalizar.
- No permitir editar un conteo finalizado.
- Manejar envíos dobles e idempotencia.

### Reporte final
Al finalizar un conteo:

1. Crear un snapshot inmutable de cada nombre y cantidad.
2. Registrar fecha/hora UTC y mostrarla en `America/Bogota`.
3. Crear un token público criptográficamente impredecible.
4. Publicar una ruta de solo lectura: `/report/[token]`.
5. Mostrar:
   - logo o marcador de logo;
   - nombre de la panadería;
   - número de reporte;
   - fecha y hora;
   - nombre visible del responsable;
   - tabla ordenada de productos y cantidades;
   - total de referencias contadas;
   - total de unidades;
   - observaciones, si existen.
6. Añadir botones:
   - Compartir mediante Web Share API;
   - copiar enlace;
   - abrir WhatsApp con un mensaje prellenado que incluya el enlace;
   - abrir correo con asunto y enlace prellenados;
   - descargar PDF.
7. Nombre del PDF:
   `inventario-panaderia_YYYY-MM-DD_HH-mm.pdf` usando hora de Bogotá.
8. El PDF debe derivarse de los mismos datos del reporte público y conservar diseño limpio al imprimir.

No integres envío automático por WhatsApp en la primera versión. El enlace prellenado evita depender de una API de pago y deja al usuario confirmar el envío.

### Auditoría
Registrar como mínimo:
- creación/edición/archivo de productos;
- creación o cambio de rol/estado de usuarios;
- inicio y finalización de conteos;
- revocación de reportes públicos.

No registrar contraseñas, tokens, secretos ni datos sensibles innecesarios.

## 4. Modelo de datos

Usa migraciones SQL versionadas. Parte del modelo descrito en `docs/DATA_MODEL.md` y ajústalo justificadamente.

Requisitos:
- claves UUID;
- timestamps UTC;
- restricciones `CHECK` para cantidades;
- índices para búsquedas reales;
- claves foráneas explícitas;
- índices únicos parciales cuando aporten valor;
- políticas RLS documentadas y probadas;
- funciones SQL con `security definer` solo cuando sea imprescindible, con `search_path` seguro.

No uses la clave `service_role` en el cliente.

## 5. Diseño y experiencia móvil

Crea una interfaz propia, profesional y cálida, no una plantilla genérica.

Dirección visual inicial:
- fondo crema claro;
- amarillo pan como color principal;
- terracota o naranja tostado como acento;
- marrón cacao para texto fuerte;
- verde suave para estados correctos;
- rojo accesible para errores;
- bordes redondeados moderados y sombras discretas;
- iconografía coherente;
- tipografía legible.

Requisitos:
- mobile-first desde 320 px;
- objetivos táctiles de al menos 44 px;
- navegación simple;
- contraste WCAG AA;
- etiquetas visibles, no depender solo de placeholders;
- estados vacíos, carga, error, sin conexión y sesión vencida;
- confirmaciones claras para acciones destructivas;
- no usar animaciones que retrasen el registro rápido.

Usa datos simulados de `docs/seed-products.json` durante el desarrollo. No dependas todavía de imágenes de panes; usa iconos o marcadores visuales ligeros hasta que la propietaria entregue fotografías reales.

## 6. Manejo de errores y estabilidad

Implementa:
- error boundaries;
- páginas `not-found` y error;
- validación Zod;
- respuestas de servidor tipadas;
- mensajes útiles para el usuario y detalles técnicos solo en logs;
- reintento seguro para fallos transitorios;
- prevención de doble submit;
- transacciones al finalizar reportes;
- tiempo de espera y cancelación donde corresponda;
- recuperación del borrador local;
- degradación elegante si Web Share no está disponible.

No prometas disponibilidad absoluta. Diseña para reducir fallos y documenta las limitaciones del nivel gratuito.

## 7. Calidad del código

- TypeScript estricto; no usar `any` sin justificación escrita.
- Nombres descriptivos.
- Evitar archivos gigantes y componentes multipropósito.
- Reglas de negocio en servicios o funciones puras, no mezcladas con JSX.
- No comentar lo obvio; comentar decisiones, invariantes y riesgos.
- No duplicar modelos entre capas sin necesidad.
- Formateo consistente.
- Dependencias fijadas mediante lockfile.
- Variables de entorno validadas al inicio.
- Proporcionar `.env.example` sin secretos.

## 8. Pruebas obligatorias

Configura:
- pruebas unitarias con Vitest;
- React Testing Library para componentes relevantes;
- Playwright para recorridos E2E;
- pruebas SQL/RLS cuando sea viable;
- GitHub Actions para lint, typecheck, test y build.

Casos E2E mínimos:
1. administrador inicia sesión y crea un producto;
2. empleado no puede entrar a administración;
3. empleado inicia un conteo y registra cantidades;
4. borrador se guarda y recupera;
5. finalización crea un reporte público;
6. enlace público funciona sin iniciar sesión;
7. reporte finalizado no se puede editar;
8. producto archivado no aparece en nuevos conteos pero sí en reportes anteriores;
9. usuario no autorizado no puede cambiar roles llamando directamente a la API;
10. token inexistente o revocado muestra respuesta segura.

## 9. Control de versiones y entrega

- Usar ramas cortas por funcionalidad.
- Commits convencionales, pequeños y descriptivos.
- No hacer commit de secretos, `.env`, resultados temporales ni credenciales.
- Crear `README.md` final con instalación, migraciones, seed, pruebas y despliegue.
- Crear `CHANGELOG.md` inicial.
- Configurar CI antes del despliegue.
- No desplegar si el pipeline está fallando.

## 10. Fases de implementación

### Fase 0 — Diagnóstico y diseño
- inspección del repositorio;
- decisiones arquitectónicas;
- wireframes textuales;
- modelo de permisos;
- modelo de datos;
- plan de implementación.

### Fase 1 — Base técnica
- Next.js y TypeScript;
- estilos y componentes base;
- configuración de Supabase local/remota;
- validación de entorno;
- lint, format, test y CI.

### Fase 2 — Autenticación y autorización
- login;
- perfiles y roles;
- rutas protegidas;
- RLS;
- pruebas de permisos.

### Fase 3 — Catálogo administrativo
- CRUD lógico de productos;
- ordenar, buscar y archivar;
- seed de productos simulados;
- auditoría.

### Fase 4 — Conteo móvil
- sesión de inventario;
- inputs rápidos;
- autosave;
- borrador local;
- validaciones;
- recuperación.

### Fase 5 — Reportes y compartir
- finalización transaccional;
- snapshot;
- página pública;
- WhatsApp/correo/Web Share;
- PDF e impresión;
- revocación.

### Fase 6 — QA y producción
- E2E completos;
- accesibilidad;
- seguridad;
- rendimiento móvil;
- despliegue;
- documentación de operación.

## 11. Criterios de aceptación del MVP

El MVP solo está terminado cuando:
- ambos roles funcionan y están realmente aislados;
- se pueden crear y archivar productos;
- un empleado puede completar un conteo desde celular sin perder datos;
- el reporte es inmutable, público mediante token y descargable como PDF;
- compartir por WhatsApp y correo funciona con enlace prellenado;
- fecha y hora usan Bogotá;
- CI está en verde;
- no hay secretos en el repositorio;
- no hay errores de compilación, lint o tipos;
- los recorridos críticos están cubiertos por E2E;
- la documentación permite que otra persona instale y despliegue el sistema.

## 12. Primera respuesta requerida

No escribas código todavía. Primero responde con:

1. diagnóstico del repositorio;
2. arquitectura final propuesta;
3. lista de supuestos;
4. riesgos técnicos y mitigaciones;
5. esquema de carpetas;
6. modelo de datos resumido;
7. matriz de permisos;
8. plan de fases y criterios de aceptación;
9. decisiones que no deben cambiar sin aprobación.

Después espera la instrucción para ejecutar la Fase 1.
