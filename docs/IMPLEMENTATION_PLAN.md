# Plan de implementación

Documento vivo. Se actualiza al cerrar cada fase.

## Estado general

| Fase | Nombre | Estado |
|---|---|---|
| 0 | Diagnóstico y diseño | Completada |
| 1 | Base técnica | Completada |
| 2 | Autenticación y autorización | Completada y verificada contra Supabase |
| 3 | Catálogo administrativo | Completada |
| 4 | Conteo móvil | Completada |
| 5 | Reportes y compartir | Completada |
| 6 | QA y producción | Completada |

## Migraciones

| Archivo | Contenido | Aplicada |
|---|---|---|
| `0001_initial_schema.sql` | Enums, `profiles`, `bakery_settings`, `audit_logs` | Sí |
| `0002_rls_policies.sql` | RLS de las tablas base | Sí |
| `0003_products.sql` | Catálogo con normalización de nombres | Pendiente |
| `0004_inventory.sql` | Sesiones e ítems, inmutabilidad | Pendiente |
| `0005_reports.sql` | Reportes públicos, finalización atómica | Pendiente |
| `seed.sql` | 15 productos con imágenes verificadas | Pendiente |

`APLICAR_AHORA.sql` reúne las cuatro pendientes en un solo archivo.

## Decisiones tomadas

| # | Decisión | Motivo |
|---|---|---|
| D1 | Next.js full-stack, sin NestJS | Alcance de una panadería pequeña |
| D2 | Tailwind CSS v4 con tokens `@theme` | Paleta centralizada, dos temas sin duplicar CSS |
| D3 | `server-only` en módulos privilegiados | Fuga de `service_role` = error de compilación |
| D4 | Config flat nativa de ESLint | `FlatCompat` falla con `eslint-config-next` 16 |
| D5 | PDF por impresión nativa | Sin dependencia extra; mismo DTO que la página |
| D6 | `README.md` intacto hasta Fase 6 | Describe el kit, no la app |
| D7 | Sin fotos en la pantalla de conteo | 98% de uso móvil; la métrica es contar 30 productos en 5 min |
| D8 | Token público hasheado con SHA-256 | Un volcado de la tabla no revela ningún enlace |
| D9 | Finalización en función SQL transaccional | No puede quedar un conteo cerrado sin reporte |
| D10 | `useSyncExternalStore` para estado del DOM | React 19 prohíbe `setState` síncrono en efectos |

## Riesgos

| # | Riesgo | Estado |
|---|---|---|
| R1 | Fuga de `service_role` | Mitigado: `server-only` + regla ESLint + verificado en el bundle |
| R2 | Recursión en políticas RLS | Mitigado: `is_active_admin()` con `SECURITY DEFINER` |
| R3 | Doble finalización de conteo | Mitigado: `idempotency_key` único + función transaccional |
| R4 | Enumeración de tokens públicos | Mitigado: 256 bits, hash en base, 404 uniforme |
| R5 | Pérdida de datos del conteo | Mitigado: autosave con debounce + respaldo `localStorage` |
| R6 | Historial alterado al renombrar | Mitigado: snapshots al crear la sesión |
| R7 | Desfase de zona horaria | Mitigado: formateo centralizado y probado en bordes de día |
| R8 | `.env` versionado | Mitigado: `.gitignore` previo; verificado que no llegó a git |
| R9 | Límites de PDF en Cloudflare | Cerrado: impresión nativa, sin dependencia de servidor |
| R10 | Deriva documentación/código | Mitigado: este documento |
| **R11** | **`service_role` expuesta sin rotar** | **ABIERTO — rotar antes de publicar** |

## Fase 6 — QA y producción (completada)

- Playwright configurado con dos perfiles: móvil (Pixel 7) y escritorio.
- 22 pruebas E2E en cuatro archivos: acceso público, permisos, catálogo y
  recorrido completo de conteo con reporte.
- Los usuarios de prueba se crean y se eliminan solos; no dependen de cuentas reales.
- CI con un trabajo E2E separado que corre cuando existen los secretos del proyecto.
- Gestión de usuarios desde la interfaz, con creación de cuentas y activación.
- Revocación de reportes desde el historial.

## Fase 8 — Un solo tipo de usuario (Opción A)

Se retiró la distinción ADMIN/EMPLOYEE a petición del propietario. Todo usuario
con sesión administra panes, compañeros y conteos.

| Antes | Ahora |
|---|---|
| Rutas `/admin/*` con guarda de rol | Rutas planas `/panes` y `/empleados` |
| `is_active_admin()` en las políticas RLS | `is_active_member()`: basta tener cuenta activa |
| `requireAdmin()` en las acciones | `requireUser()` |
| Columna `profiles.role` y enum `app_role` | Eliminados |
| Página `/sin-permiso` | Eliminada: ya no hay accesos denegados por rol |

**Lo que sigue protegido**: el registro público continúa cerrado (las cuentas se
crean desde dentro de la app), nadie puede eliminarse ni desactivarse a sí mismo,
y la base impide dejar cero cuentas activas. Los conteos finalizados siguen siendo
inmutables por disparador, y los reportes públicos solo se resuelven por token.

## Rediseño visual (a partir del prototipo del propietario)

`index(1).html` definió la dirección estética. Se adoptaron sus rasgos y se
corrigieron los problemas que impedían llevarlos a producción.

**Adoptado**: superficies translúcidas con desenfoque, halos de luz radiales,
sidebar con secciones, tarjetas de estadística, chip de usuario con avatar en
gradiente, sombras en capas, botones con gradiente y sombra de color, toasts.

**Cambiado, con motivo**:

| Prototipo | Decisión | Motivo |
|---|---|---|
| Rejilla de 2 columnas en el conteo | Una fila por producto | A 320 px el nombre queda en ~85 px y "Pan mantequilla" se corta |
| Blanco sobre el naranja de marca | Texto cacao sobre el mismo naranja | 2.79:1 incumple AA; con cacao son 5.61:1 y el botón se ve igual |
| `save-state` fijo en "Guardado" | Estado real de guardado | Un indicador que siempre dice lo mismo engaña al usuario |
| Barras translúcidas sobre listas | Fondo opaco en barra de búsqueda y resumen | El desenfoque dejaba entrever las filas y el resumen se volvía ilegible |

Verificado en navegador real a 320 px y 390 px: **cero desborde horizontal** en
resumen, conteo y productos, en tema claro y oscuro.

## Correcciones aplicadas tras probar contra la base real

| Problema | Causa | Corrección |
|---|---|---|
| `column reference "report_number" is ambiguous` (42702) al finalizar | Las columnas de retorno de `finalize_inventory_session` tenían el mismo nombre que las columnas de `public_reports` | Nombres de salida con prefijo `out_`; ver `CORREGIR_FUNCION.sql` |
| `syntax error at or near "entory_sessions"` | Un espacio partió el nombre de la tabla al concatenar las migraciones en un archivo único | Archivo concatenado eliminado; las migraciones se aplican una por una |
| Sin cabeceras de seguridad HTTP | No se habían configurado | CSP, `X-Frame-Options`, `Referrer-Policy` y `Permissions-Policy` en `next.config.ts` |

## Pendiente antes de publicar

1. **Aplicar `supabase/APLICAR_AHORA.sql`** (migraciones 0006, 0007 y 0008).
2. **Rotar el secreto JWT** en *Settings → API → JWT Settings → Generate a new JWT secret*.
   La pantalla de *Legacy API keys* solo permite copiar, no rotar; por eso la clave
   expuesta seguía siendo la misma. Rotar el secreto invalida ambas claves a la vez,
   así que hay que actualizar `NEXT_PUBLIC_SUPABASE_ANON_KEY` y
   `SUPABASE_SERVICE_ROLE_KEY` en el mismo momento.
3. Configurar los secretos del repositorio para que el CI ejecute las pruebas E2E.
4. Definir el dominio real en `NEXT_PUBLIC_SITE_URL`.
