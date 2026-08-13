# Instalación y ejecución

## Requisitos

- Node.js 20.9 o superior (probado con 22.20).
- npm 10 o superior.

En Windows, si `npm install` falla con `"node" no se reconoce como un comando`, la carpeta de Node
no está en el `PATH` del sistema. Agrega `C:\Program Files\nodejs` al `PATH` y abre una terminal nueva.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # en Windows: copy .env.example .env.local
npm run dev
```

La aplicación queda disponible en http://localhost:3000

Las credenciales de Supabase todavía no son necesarias: se incorporan en la Fase 2.
El archivo `.env.local` está bloqueado por `.gitignore` y nunca debe subirse al repositorio.

## Comandos

| Comando | Para qué |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm run start` | Sirve la compilación de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | Verificación de tipos sin emitir |
| `npm run test` | Pruebas unitarias y de componentes |
| `npm run test:watch` | Pruebas en modo continuo |
| `npm run format` | Aplica Prettier |
| `npm run format:check` | Verifica formato (lo usa el CI) |

## Estructura

```text
src/
  app/          Rutas, layout y páginas de error
  components/ui Primitivas accesibles reutilizables
  lib/
    dates/      Formateo en América/Bogotá
    env/        Validación de variables de entorno
    errors/     Errores y resultados de acción tipados
    utils/      Utilidades menores
  types/        Tipos compartidos del dominio
docs/           Alcance, modelo de datos, plan y productos simulados
```

## Convenciones

- Código, nombres de archivos y tipos en inglés; textos visibles en español.
- Las reglas de negocio irán en `src/server/services`, sin dependencias de React,
  para permitir extraerlas a otro backend más adelante.
- Toda fecha se guarda en UTC y se muestra mediante `src/lib/dates/bogota.ts`.
