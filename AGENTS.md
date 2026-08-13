# Memoria permanente — Inventario de Panadería

## Objetivo
Construir una aplicación web móvil, sencilla y confiable para contar productos elaborados en una panadería, guardar cada conteo y generar un reporte público con fecha y hora de Colombia.

## Usuario objetivo
Personal de panadería que trabaja principalmente desde un teléfono celular y necesita registrar cantidades con pocos toques.

## Roles
- `ADMIN`: administra productos, usuarios, configuración, reportes y anulaciones.
- `EMPLOYEE`: visualiza productos activos, registra cantidades, guarda borradores y finaliza conteos. No administra usuarios ni productos.

## Decisiones arquitectónicas obligatorias
- Next.js App Router, TypeScript estricto y estructura full-stack.
- Supabase Auth + PostgreSQL + Row Level Security.
- No exponer claves privadas, `service_role`, secretos SMTP ni tokens administrativos al navegador.
- No confiar únicamente en ocultar botones: validar autorización en servidor y en RLS.
- Usar nombres de variables, funciones, tipos y archivos en inglés; textos visibles para usuarios en español.
- Código limpio, funciones pequeñas, responsabilidades claras y comentarios solo cuando expliquen una decisión no obvia.
- Evitar sobreingeniería y dependencias innecesarias.

## Flujo principal
1. El usuario inicia sesión.
2. Inicia un conteo nuevo o recupera un borrador.
3. Ve todos los productos activos, agrupados y buscables.
4. Escribe cantidades enteras no negativas.
5. La aplicación guarda automáticamente y mantiene copia temporal local para recuperación.
6. Al finalizar, valida datos y crea un reporte inmutable.
7. Muestra enlace público, botón Compartir, opción WhatsApp, copiar enlace y descargar PDF.
8. El reporte muestra nombre de panadería, identificador, fecha, hora, responsable y tabla de productos/cantidades.

## Regla de historial
No eliminar físicamente productos que hayan aparecido en reportes. El administrador debe archivarlos mediante `is_active = false`. Los reportes guardan el nombre del producto como snapshot para conservar su historia.

## Zona horaria
Toda visualización de fecha y hora debe usar `America/Bogota`. La base de datos guarda timestamps en UTC.

## Seguridad
- Registro público de usuarios deshabilitado.
- Usuarios creados o invitados solo por administrador.
- Contraseñas nunca se almacenan en tablas propias.
- Tokens públicos de reporte impredecibles y revocables.
- Aplicar validación Zod tanto en formularios como en entradas de servidor.
- Implementar protección contra IDOR, escalamiento de privilegios, mass assignment y exposición de datos.
- Añadir auditoría para acciones administrativas y finalización de reportes.

## Calidad mínima antes de declarar una fase terminada
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- Pruebas E2E para los recorridos críticos cuando corresponda.

## Restricciones del alcance inicial
No incluir ventas, costos, facturación, recetas, compras, proveedores ni inteligencia artificial. El producto inicial solo administra catálogo, conteos, usuarios, reportes y auditoría.
