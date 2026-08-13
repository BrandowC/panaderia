# PROMPT ALTERNATIVO — Next.js + NestJS + PostgreSQL

Usa este prompt únicamente cuando exista una razón académica, contractual o de crecimiento para mantener frontend y backend separados.

Actúa como líder técnico senior. Construye un monorepo TypeScript para una aplicación móvil web de inventario de panadería con:

- `apps/web`: Next.js App Router.
- `apps/api`: NestJS con adaptador Fastify.
- `packages/contracts`: esquemas Zod y tipos compartidos, sin importar código de servidor en el cliente.
- `packages/config`: configuraciones compartidas de lint y TypeScript.
- PostgreSQL administrado por Supabase.
- Supabase Auth para identidad.
- El API NestJS valida JWT, roles y propiedad de recursos en cada caso de uso.
- Docker Compose para desarrollo local.

## Advertencia arquitectónica

Esta variante añade dos aplicaciones, CORS, contratos entre servicios, dos despliegues, manejo de disponibilidad del API y más superficie de error. No es la opción recomendada cuando el objetivo principal es una panadería pequeña, costo cero y operación sencilla.

## Estructura

```text
apps/
  web/
  api/
packages/
  contracts/
  eslint-config/
  typescript-config/
supabase/
  migrations/
  seed.sql
docs/
```

## Backend NestJS

Organiza por módulos de negocio:

```text
src/
  auth/
  users/
  products/
  inventory/
  reports/
  audit/
  common/
```

Cada módulo debe separar:
- controller;
- DTO validado;
- application service/use case;
- repository interface;
- infrastructure adapter;
- authorization policy;
- tests.

No conviertas cada tabla en un módulo mecánico. Los módulos deben corresponder a capacidades del negocio.

## Seguridad

- No confiar en datos de rol enviados por el frontend.
- Verificar firma, audiencia, emisor y expiración del JWT.
- Aplicar guards globales y políticas por recurso.
- El empleado solo modifica sus conteos en estado DRAFT.
- Los reportes finalizados son inmutables.
- La clave `service_role` solo puede existir en secretos del backend y debe usarse de manera mínima.
- Los enlaces públicos deben usar tokens impredecibles, almacenados preferiblemente como hash.
- Configurar CORS con orígenes explícitos, nunca `*` con credenciales.
- Rate limit en login, finalización y consulta pública.

## Contratos

Define esquemas Zod compartidos para:
- producto;
- sesión de conteo;
- actualización de cantidad;
- finalización;
- reporte público;
- error de API.

Genera OpenAPI desde NestJS y comprueba que los contratos no diverjan.

## Estabilidad

- idempotency key al finalizar;
- transacción para snapshot y reporte;
- timeouts;
- retry solo para operaciones seguras;
- health endpoints de liveness y readiness;
- logs estructurados sin secretos;
- manejo global de excepciones;
- graceful shutdown;
- validación de variables de entorno.

## Pruebas

- unitarias en servicios de dominio;
- integración para repositorios y API;
- pruebas de guards y autorización negativa;
- E2E de NestJS;
- Playwright desde Next.js contra el sistema integrado;
- CI para ambas aplicaciones.

## Forma de trabajo

1. Lee `CLAUDE.md` y `docs/`.
2. Diagnostica el repositorio.
3. Presenta ADR comparando esta arquitectura con Next.js full-stack.
4. Crea un plan por fases.
5. No escribas código hasta que el plan y la matriz de permisos estén completos.
6. Implementa una fase por vez y exige lint, typecheck, test y build en verde.

## Primera respuesta requerida

Entrega primero:
- justificación de por qué NestJS separado sí es necesario;
- diagrama de componentes;
- límites de módulos;
- flujo de autenticación;
- matriz de permisos;
- modelo de datos;
- contratos API;
- estrategia de despliegue y sus limitaciones gratuitas;
- plan de pruebas;
- fases de implementación.
