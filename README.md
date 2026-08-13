# Inventario de Panadería

Aplicación web móvil para contar los productos elaborados cada día y compartir el
resultado mediante un enlace público o un PDF.

Pensada para usarse de pie, con prisa y desde un teléfono: botones grandes,
autoguardado y recuperación del conteo si se pierde la señal.

## Qué hace

- Inicio de sesión con dos roles: administrador y empleado.
- Catálogo de productos que se archiva en lugar de borrarse, para conservar el historial.
- Conteo con botones de más y menos, búsqueda sin acentos y guardado automático.
- Reporte inmutable con enlace público, fecha y hora de Colombia.
- Compartir por WhatsApp, correo, enlace copiado o el menú del teléfono.
- Descarga en PDF con el nombre `inventario-panaderia_AAAA-MM-DD_HH-mm.pdf`.
- Auditoría de las acciones importantes.

## Requisitos

- Node.js 20.9 o superior.
- Una cuenta gratuita de Supabase.

En Windows, si `npm install` falla con `"node" no se reconoce como un comando`,
agrega `C:\Program Files\nodejs` al `PATH` y abre una terminal nueva.

## Instalación

```bash
npm install
cp .env.example .env.local   # en Windows: copy .env.example .env.local
```

Completa `.env.local` con los datos de tu proyecto de Supabase
(*Project Settings → API*). La clave `service_role` va únicamente en ese archivo,
que `.gitignore` mantiene fuera del repositorio.

## Base de datos

En el *SQL Editor* de Supabase, ejecuta en orden los archivos de
`supabase/migrations/`. Si aparece el aviso de Row Level Security, elige
**Run without RLS**: cada migración activa RLS y crea sus políticas por sí misma.

Después ejecuta `supabase/seed.sql` para cargar 15 productos de ejemplo.

### Primer administrador

Crea el usuario en *Authentication → Users* y luego elévalo:

```sql
update public.profiles
set role = 'ADMIN'
where id = (select id from auth.users where email = 'tu-correo@ejemplo.com');
```

El disparador crea todos los perfiles como `EMPLOYEE`; el ascenso siempre es manual.

## Uso

```bash
npm run dev
```

Disponible en http://localhost:3000

## Comandos

| Comando | Para qué |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm run start` | Sirve la compilación de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | Verificación de tipos |
| `npm run test` | Pruebas unitarias y de componentes |
| `npm run format` | Aplica Prettier |

## Estructura

```text
src/
  app/            Rutas: login, inventario, admin, historial, reporte público
  components/     Primitivas de interfaz y conmutador de tema
  features/       Interfaz por dominio: auth, products, inventory, reports
  server/         Reglas de negocio, repositorios y sesión (nunca en el navegador)
  lib/            Fechas de Bogotá, entorno, errores, clientes de Supabase
supabase/
  migrations/     Esquema y políticas RLS versionadas
  seed.sql        Productos de ejemplo
docs/             Alcance, modelo de datos y plan de implementación
```

Las reglas de negocio viven en `src/server` y no dependen de React, de modo que
puedan extraerse a otro backend si el proyecto crece.

## Seguridad

- La autorización se aplica en tres niveles: interfaz, servidor y Row Level Security.
- La clave `service_role` nunca llega al navegador; `server-only` lo impide en compilación.
- Los enlaces públicos usan tokens de 256 bits guardados como hash.
- Los conteos finalizados son inmutables por disparadores en la base de datos.
- No hay registro público de usuarios: los crea el administrador.

## Zona horaria

La base de datos guarda todo en UTC y la aplicación siempre muestra `America/Bogota`.
El formateo está centralizado en `src/lib/dates/bogota.ts`.
