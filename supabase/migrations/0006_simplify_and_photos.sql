/*
 * Fase 7: catalogo sin categoria, fotos propias, borrado real cuando no hay
 * historial, responsable seleccionable y firma del reporte.
 */

/*
 * Se define aqui para que las migraciones siguientes puedan usarla sin depender
 * de is_active_admin(), que la fase 8 retira. SECURITY DEFINER evita recursion:
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

-- 1. Fotos ------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-photos', 'product-photos', true, 5242880,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('user-photos', 'user-photos', true, 5242880,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Se eliminan antes de crear para que el archivo pueda ejecutarse mas de una vez.
drop policy if exists "product_photos_public_read" on storage.objects;
drop policy if exists "user_photos_public_read" on storage.objects;
drop policy if exists "product_photos_member_write" on storage.objects;
drop policy if exists "product_photos_member_update" on storage.objects;
drop policy if exists "product_photos_member_delete" on storage.objects;
drop policy if exists "user_photos_member_write" on storage.objects;
drop policy if exists "user_photos_member_update" on storage.objects;
drop policy if exists "user_photos_member_delete" on storage.objects;

-- Politicas anteriores basadas en rol, por si quedaron de una version previa.
drop policy if exists "product_photos_admin_write" on storage.objects;
drop policy if exists "product_photos_admin_update" on storage.objects;
drop policy if exists "product_photos_admin_delete" on storage.objects;
drop policy if exists "user_photos_admin_write" on storage.objects;
drop policy if exists "user_photos_admin_update" on storage.objects;
drop policy if exists "user_photos_admin_delete" on storage.objects;

-- Lectura publica: las fotos aparecen en el reporte compartido, que no exige sesion.
create policy "product_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'product-photos');

create policy "user_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'user-photos');

create policy "product_photos_member_write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-photos' and public.is_active_member());

create policy "product_photos_member_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-photos' and public.is_active_member());

create policy "product_photos_member_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-photos' and public.is_active_member());

create policy "user_photos_member_write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'user-photos' and public.is_active_member());

create policy "user_photos_member_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'user-photos' and public.is_active_member());

create policy "user_photos_member_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'user-photos' and public.is_active_member());

-- 2. Catalogo sin categoria --------------------------------------------------

alter table public.products drop column if exists category;
alter table public.inventory_items drop column if exists category_snapshot;

alter table public.profiles add column if not exists photo_url text;

-- 3. Borrado real solo cuando no hay historial -------------------------------

/*
 * El administrador siempre ve "Eliminar". Si el producto ya aparece en algun
 * conteo, borrarlo dejaria reportes historicos incompletos, asi que en ese caso
 * se oculta en lugar de borrarse. La UI no distingue: el producto desaparece.
 */
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

  if v_has_history then
    update public.products set is_active = false where id = p_product_id;
    return 'HIDDEN';
  end if;

  delete from public.products where id = p_product_id;
  return 'DELETED';
end;
$$;

revoke execute on function public.delete_product(uuid) from anon;

/*
 * Igual para empleados: si firmo un reporte, el reporte quedaria sin responsable.
 * Un administrador tampoco puede eliminarse a si mismo.
 */
create or replace function public.delete_user_account(p_user_id uuid)
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

  if p_user_id = auth.uid() then
    raise exception 'No puedes eliminar tu propia cuenta' using errcode = 'check_violation';
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

revoke execute on function public.delete_user_account(uuid) from anon;

-- 4. Responsable y firma del reporte -----------------------------------------

alter table public.inventory_sessions
  add column if not exists responsible_id uuid references public.profiles (id) on delete restrict,
  add column if not exists signature text;

comment on column public.inventory_sessions.responsible_id is
  'Quien contó fisicamente. Puede diferir de performed_by, que es quien uso la aplicacion.';

comment on column public.inventory_sessions.signature is
  'Nombre escrito por el responsable al finalizar, como confirmacion del conteo.';

-- Lista de responsables elegibles sin exponer correos ni datos internos.
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

revoke execute on function public.list_active_staff() from anon;
