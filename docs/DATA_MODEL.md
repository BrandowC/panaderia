# Modelo de datos propuesto

## `profiles`
- `id uuid` PK y FK a `auth.users.id`
- `display_name text`
- `role app_role` (`ADMIN`, `EMPLOYEE`)
- `is_active boolean`
- `created_at timestamptz`
- `updated_at timestamptz`

## `bakery_settings`
- `id uuid`
- `bakery_name text`
- `logo_url text null`
- `timezone text` default `America/Bogota`
- `max_quantity integer` default `99999`
- timestamps

## `products`
- `id uuid`
- `name text`
- `normalized_name text`
- `category text null`
- `sort_order integer`
- `is_active boolean`
- `created_by uuid`
- timestamps

No borrar físicamente si existe historial.

## `inventory_sessions`
- `id uuid`
- `status inventory_status` (`DRAFT`, `FINALIZED`, `CANCELLED`)
- `performed_by uuid`
- `notes text null`
- `started_at timestamptz`
- `updated_at timestamptz`
- `finalized_at timestamptz null`
- `idempotency_key uuid`

## `inventory_items`
- `id uuid`
- `session_id uuid`
- `product_id uuid null`
- `product_name_snapshot text`
- `category_snapshot text null`
- `sort_order_snapshot integer`
- `quantity integer check quantity >= 0`
- timestamps
- único por `session_id + product_id` cuando `product_id` exista

Durante borrador puede referenciar el producto. Al finalizar deben quedar completos los snapshots.

## `public_reports`
- `id uuid`
- `session_id uuid unique`
- `public_token_hash text unique`
- `report_number text unique`
- `is_revoked boolean`
- `generated_at timestamptz`
- `revoked_at timestamptz null`
- `revoked_by uuid null`

Guardar preferiblemente hash del token y comparar en servidor. No exponer una lista pública de tokens.

## `audit_logs`
- `id uuid`
- `actor_id uuid null`
- `action text`
- `entity_type text`
- `entity_id uuid null`
- `metadata jsonb`
- `created_at timestamptz`

No almacenar secretos ni contraseñas en `metadata`.

## Matriz RLS resumida

| Tabla | ADMIN | EMPLOYEE | Público |
|---|---|---|---|
| profiles | administrar según reglas | leer su perfil | ninguno |
| products | CRUD lógico | leer activos | ninguno |
| inventory_sessions | todos | crear y modificar sus borradores; leer los propios | ninguno |
| inventory_items | todos | CRUD de ítems de sus borradores | ninguno |
| public_reports | administrar/revocar | crear al finalizar y leer los propios | sin acceso directo |
| audit_logs | leer | sin lectura general | ninguno |

El reporte público debe resolverse mediante una función o endpoint de servidor que entregue únicamente campos permitidos.
