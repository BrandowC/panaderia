-- Fase 4: sesiones de conteo e items.

create table public.inventory_sessions (
  id uuid primary key default gen_random_uuid(),
  status public.inventory_status not null default 'DRAFT',
  performed_by uuid not null references public.profiles (id) on delete restrict,
  notes text check (notes is null or length(notes) <= 500),
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finalized_at timestamptz,
  -- R3: bloquea que un doble toque en "Finalizar" cree dos reportes.
  idempotency_key uuid not null default gen_random_uuid(),
  constraint finalized_has_timestamp
    check ((status = 'FINALIZED') = (finalized_at is not null))
);

create unique index inventory_sessions_idempotency_idx
  on public.inventory_sessions (idempotency_key);

/*
 * Un empleado solo puede tener un borrador abierto a la vez: evita conteos
 * duplicados y elimina la duda de "cual de los dos es el bueno".
 */
create unique index inventory_sessions_one_draft_idx
  on public.inventory_sessions (performed_by) where status = 'DRAFT';

create index inventory_sessions_history_idx
  on public.inventory_sessions (finalized_at desc) where status = 'FINALIZED';

create trigger inventory_sessions_set_updated_at
  before update on public.inventory_sessions
  for each row execute function public.set_updated_at();

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.inventory_sessions (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name_snapshot text not null,
  category_snapshot text,
  sort_order_snapshot integer not null default 0,
  quantity integer not null default 0 check (quantity >= 0 and quantity <= 99999),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Un producto no puede aparecer dos veces en el mismo conteo.
create unique index inventory_items_session_product_idx
  on public.inventory_items (session_id, product_id) where product_id is not null;

create index inventory_items_session_idx
  on public.inventory_items (session_id, sort_order_snapshot, product_name_snapshot);

create trigger inventory_items_set_updated_at
  before update on public.inventory_items
  for each row execute function public.set_updated_at();

/*
 * Los conteos finalizados son inmutables. El disparador lo impone en la base:
 * ninguna ruta de la aplicacion puede saltarselo.
 */
create or replace function public.prevent_finalized_session_changes()
returns trigger
language plpgsql
as $$
declare
  session_status public.inventory_status;
begin
  select status into session_status
  from public.inventory_sessions
  where id = coalesce(new.session_id, old.session_id);

  if session_status <> 'DRAFT' then
    raise exception 'El conteo ya fue finalizado y no admite cambios'
      using errcode = 'check_violation';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger inventory_items_only_when_draft
  before insert or update or delete on public.inventory_items
  for each row execute function public.prevent_finalized_session_changes();

create or replace function public.prevent_finalized_session_reopen()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'FINALIZED' and new.status <> 'FINALIZED' then
    raise exception 'Un conteo finalizado no puede reabrirse'
      using errcode = 'check_violation';
  end if;

  if old.status = 'FINALIZED' and (new.notes is distinct from old.notes) then
    raise exception 'Un conteo finalizado no admite cambios'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger inventory_sessions_no_reopen
  before update on public.inventory_sessions
  for each row execute function public.prevent_finalized_session_reopen();

-- RLS ------------------------------------------------------------------------

alter table public.inventory_sessions enable row level security;
alter table public.inventory_items enable row level security;

create policy "sessions_select_own_or_admin"
  on public.inventory_sessions for select
  to authenticated
  using (performed_by = (select auth.uid()) or public.is_active_admin());

create policy "sessions_insert_own"
  on public.inventory_sessions for insert
  to authenticated
  with check (performed_by = (select auth.uid()));

create policy "sessions_update_own_draft"
  on public.inventory_sessions for update
  to authenticated
  using (performed_by = (select auth.uid()) and status = 'DRAFT')
  with check (performed_by = (select auth.uid()));

create policy "items_select_own_or_admin"
  on public.inventory_items for select
  to authenticated
  using (
    exists (
      select 1 from public.inventory_sessions s
      where s.id = session_id
        and (s.performed_by = (select auth.uid()) or public.is_active_admin())
    )
  );

create policy "items_write_own_draft"
  on public.inventory_items for all
  to authenticated
  using (
    exists (
      select 1 from public.inventory_sessions s
      where s.id = session_id
        and s.performed_by = (select auth.uid())
        and s.status = 'DRAFT'
    )
  )
  with check (
    exists (
      select 1 from public.inventory_sessions s
      where s.id = session_id
        and s.performed_by = (select auth.uid())
        and s.status = 'DRAFT'
    )
  );
