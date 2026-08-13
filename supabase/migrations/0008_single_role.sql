/*
 * Fase 8: se elimina la distincion ADMIN/EMPLOYEE.
 * Todo usuario con sesion administra panes, compañeros y conteos. La barrera de
 * seguridad pasa a ser una sola: tener cuenta. El registro publico sigue cerrado.
 */

-- 1. Politicas basadas en rol: se reemplazan por "usuario activo" -------------

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_admin" on public.profiles;
drop policy if exists "profiles_insert_admin" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;
drop policy if exists "bakery_settings_update_admin" on public.bakery_settings;
drop policy if exists "audit_logs_select_admin" on public.audit_logs;
drop policy if exists "products_select_active" on public.products;
drop policy if exists "products_insert_admin" on public.products;
drop policy if exists "products_update_admin" on public.products;
drop policy if exists "reports_revoke_admin" on public.public_reports;
drop policy if exists "reports_select_own_or_admin" on public.public_reports;

-- Y las propias, para que el archivo pueda ejecutarse mas de una vez.
drop policy if exists "profiles_select_member" on public.profiles;
drop policy if exists "profiles_insert_member" on public.profiles;
drop policy if exists "profiles_update_member" on public.profiles;
drop policy if exists "products_select_member" on public.products;
drop policy if exists "products_insert_member" on public.products;
drop policy if exists "products_update_member" on public.products;
drop policy if exists "bakery_settings_update_member" on public.bakery_settings;
drop policy if exists "audit_logs_select_member" on public.audit_logs;
drop policy if exists "reports_select_member" on public.public_reports;
drop policy if exists "reports_revoke_member" on public.public_reports;
drop policy if exists "sessions_select_member" on public.inventory_sessions;
drop policy if exists "sessions_update_draft" on public.inventory_sessions;
drop policy if exists "items_select_member" on public.inventory_items;
drop policy if exists "items_write_draft" on public.inventory_items;

/*
 * Reemplaza a is_active_admin(). SECURITY DEFINER evita recursion infinita:
 * una politica sobre profiles que consulte profiles se llamaria a si misma.
 */
create or replace function public.is_active_member()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_active
  );
$$;

revoke execute on function public.is_active_member() from anon;

-- profiles ------------------------------------------------------------------

create policy "profiles_select_member"
  on public.profiles for select
  to authenticated
  using (public.is_active_member());

create policy "profiles_insert_member"
  on public.profiles for insert
  to authenticated
  with check (public.is_active_member());

-- Nadie puede desactivarse a si mismo: dejaria la panaderia sin ese acceso.
create policy "profiles_update_member"
  on public.profiles for update
  to authenticated
  using (public.is_active_member())
  with check (public.is_active_member() and (id <> (select auth.uid()) or is_active));

-- products ------------------------------------------------------------------

create policy "products_select_member"
  on public.products for select
  to authenticated
  using (public.is_active_member());

create policy "products_insert_member"
  on public.products for insert
  to authenticated
  with check (public.is_active_member());

create policy "products_update_member"
  on public.products for update
  to authenticated
  using (public.is_active_member())
  with check (public.is_active_member());

-- bakery_settings y audit_logs ----------------------------------------------

create policy "bakery_settings_update_member"
  on public.bakery_settings for update
  to authenticated
  using (public.is_active_member())
  with check (public.is_active_member());

create policy "audit_logs_select_member"
  on public.audit_logs for select
  to authenticated
  using (public.is_active_member());

-- public_reports -------------------------------------------------------------

create policy "reports_select_member"
  on public.public_reports for select
  to authenticated
  using (public.is_active_member());

create policy "reports_revoke_member"
  on public.public_reports for update
  to authenticated
  using (public.is_active_member())
  with check (public.is_active_member());

-- 2. Conteos: cualquier miembro puede ver y continuar los de la panaderia -----

drop policy if exists "sessions_select_own_or_admin" on public.inventory_sessions;
drop policy if exists "sessions_update_own_draft" on public.inventory_sessions;
drop policy if exists "items_select_own_or_admin" on public.inventory_items;
drop policy if exists "items_write_own_draft" on public.inventory_items;

create policy "sessions_select_member"
  on public.inventory_sessions for select
  to authenticated
  using (public.is_active_member());

create policy "sessions_update_draft"
  on public.inventory_sessions for update
  to authenticated
  using (public.is_active_member() and status = 'DRAFT')
  with check (public.is_active_member());

create policy "items_select_member"
  on public.inventory_items for select
  to authenticated
  using (public.is_active_member());

-- La inmutabilidad del conteo finalizado sigue garantizada por el disparador.
create policy "items_write_draft"
  on public.inventory_items for all
  to authenticated
  using (
    public.is_active_member()
    and exists (
      select 1 from public.inventory_sessions s
      where s.id = session_id and s.status = 'DRAFT'
    )
  )
  with check (
    public.is_active_member()
    and exists (
      select 1 from public.inventory_sessions s
      where s.id = session_id and s.status = 'DRAFT'
    )
  );

-- 3. Las politicas de fotos ya usan is_active_member desde la migracion 0006.

-- 4. Funciones que exigian rol -----------------------------------------------

create or replace function public.delete_product(p_product_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_has_history boolean;
begin
  if not public.is_active_member() then
    raise exception 'No autorizado' using errcode = 'insufficient_privilege';
  end if;

  select exists (select 1 from public.inventory_items where product_id = p_product_id)
  into v_has_history;

  -- Con historial se oculta: borrarlo dejaria reportes antiguos incompletos.
  if v_has_history then
    update public.products set is_active = false where id = p_product_id;
    return 'HIDDEN';
  end if;

  delete from public.products where id = p_product_id;
  return 'DELETED';
end;
$$;

create or replace function public.delete_user_account(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_has_history boolean;
  v_remaining integer;
begin
  if not public.is_active_member() then
    raise exception 'No autorizado' using errcode = 'insufficient_privilege';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'No puedes eliminar tu propia cuenta' using errcode = 'check_violation';
  end if;

  -- Sin roles, la unica proteccion contra quedarse sin acceso es no vaciar la lista.
  select count(*) into v_remaining from public.profiles where is_active;

  if v_remaining <= 1 then
    raise exception 'Debe quedar al menos una cuenta activa' using errcode = 'check_violation';
  end if;

  select exists (select 1 from public.inventory_sessions where performed_by = p_user_id)
  into v_has_history;

  if v_has_history then
    update public.profiles set is_active = false where id = p_user_id;
    return 'HIDDEN';
  end if;

  delete from public.profiles where id = p_user_id;
  return 'DELETED';
end;
$$;

create or replace function public.finalize_inventory_session(
  p_session_id uuid,
  p_token_hash text,
  p_notes text default null,
  p_responsible_id uuid default null,
  p_signature text default null
)
returns table (out_report_number text, out_generated_at timestamptz, out_already_finalized boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session public.inventory_sessions;
  v_existing public.public_reports;
  v_number text;
  v_sequence integer;
  v_today text;
begin
  select * into v_session
  from public.inventory_sessions
  where id = p_session_id
  for update;

  if not found then
    raise exception 'Conteo no encontrado' using errcode = 'no_data_found';
  end if;

  -- La funcion corre con privilegios elevados: la pertenencia se revisa aqui.
  if not public.is_active_member() then
    raise exception 'No autorizado' using errcode = 'insufficient_privilege';
  end if;

  select * into v_existing from public.public_reports where session_id = p_session_id;

  if found then
    return query select v_existing.report_number, v_existing.generated_at, true;
    return;
  end if;

  if v_session.status <> 'DRAFT' then
    raise exception 'El conteo no esta en borrador' using errcode = 'check_violation';
  end if;

  if not exists (select 1 from public.inventory_items where session_id = p_session_id) then
    raise exception 'El conteo no tiene productos' using errcode = 'check_violation';
  end if;

  if p_responsible_id is not null
     and not exists (select 1 from public.profiles where id = p_responsible_id and is_active) then
    raise exception 'Responsable invalido' using errcode = 'check_violation';
  end if;

  -- Numero legible con la fecha civil de Bogota, no la de UTC.
  v_today := to_char(timezone('America/Bogota', now()), 'YYYYMMDD');

  select count(*) + 1 into v_sequence
  from public.public_reports pr
  where pr.report_number like 'INV-' || v_today || '-%';

  v_number := 'INV-' || v_today || '-' || lpad(v_sequence::text, 3, '0');

  update public.inventory_sessions
  set status = 'FINALIZED',
      finalized_at = now(),
      notes = coalesce(p_notes, notes),
      responsible_id = coalesce(p_responsible_id, performed_by),
      signature = p_signature
  where id = p_session_id;

  insert into public.public_reports (session_id, public_token_hash, report_number)
  values (p_session_id, p_token_hash, v_number);

  return query select v_number, now(), false;
end;
$$;

create or replace function public.list_active_staff()
returns table (staff_id uuid, staff_name text, staff_photo text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select id, display_name, photo_url
  from public.profiles
  where is_active
  order by display_name;
$$;

-- 5. Retirar el rol -----------------------------------------------------------

drop function if exists public.is_active_admin();
drop function if exists public.current_role();

-- El indice filtraba por rol; sin roles pierde sentido.
drop index if exists public.profiles_active_role_idx;

alter table public.profiles drop column if exists role;

drop type if exists public.app_role;

-- El disparador ya no asigna rol al crear el perfil.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
