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
/*
 * Fase 7: el reporte incorpora responsable elegido, firma y foto del producto.
 * Reemplaza las funciones de 0005 conservando su contrato de seguridad.
 */

alter table public.inventory_items add column if not exists image_snapshot text;

-- Se eliminan ambas firmas: la de 3 parametros de 0005 y la de 5 por si una
-- ejecucion anterior de este archivo ya la habia creado.
drop function if exists public.finalize_inventory_session(uuid, text, text);
drop function if exists public.finalize_inventory_session(uuid, text, text, uuid, text);

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

  -- El responsable debe ser personal activo: impide firmar a nombre de cualquiera.
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

revoke execute on function public.finalize_inventory_session(uuid, text, text, uuid, text) from anon;

/*
 * Resuelve el reporte publico por hash de token. Devuelve solo campos permitidos:
 * nunca correos, identificadores de usuario ni datos internos.
 */
create or replace function public.get_public_report(p_token_hash text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'reportNumber', r.report_number,
    'generatedAt', r.generated_at,
    'performedBy', coalesce(resp.display_name, author.display_name),
    'signature', s.signature,
    'notes', s.notes,
    'bakeryName', b.bakery_name,
    'logoUrl', b.logo_url,
    'items', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'name', i.product_name_snapshot,
            'imageUrl', i.image_snapshot,
            'quantity', i.quantity
          )
          order by i.sort_order_snapshot, i.product_name_snapshot
        )
        from public.inventory_items i
        where i.session_id = s.id
      ),
      '[]'::jsonb
    )
  )
  into v_result
  from public.public_reports r
  join public.inventory_sessions s on s.id = r.session_id
  join public.profiles author on author.id = s.performed_by
  left join public.profiles resp on resp.id = s.responsible_id
  cross join lateral (select * from public.bakery_settings limit 1) b
  where r.public_token_hash = p_token_hash
    and r.is_revoked = false;

  return v_result;
end;
$$;

grant execute on function public.get_public_report(text) to anon, authenticated;
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
/*
 * Fase 9: cada reporte finalizado guarda su imagen en Storage.
 * La imagen es el mismo contenido que la pagina publica, en un PNG que se puede
 * enviar por WhatsApp sin que el destinatario abra un enlace.
 */

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('report-images', 'report-images', true, 5242880, array['image/png'])
on conflict (id) do nothing;

drop policy if exists "report_images_public_read" on storage.objects;
drop policy if exists "report_images_member_write" on storage.objects;

-- Lectura publica: la imagen acompaña al enlace compartido, que no exige sesion.
create policy "report_images_public_read"
  on storage.objects for select
  using (bucket_id = 'report-images');

create policy "report_images_member_write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'report-images' and public.is_active_member());

alter table public.public_reports add column if not exists image_url text;

/*
 * Solo se puede escribir la imagen una vez, y unicamente sobre reportes no
 * revocados. Evita sustituir la imagen de un reporte ya compartido.
 */
create or replace function public.attach_report_image(
  p_session_id uuid,
  p_image_url text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_active_member() then
    raise exception 'No autorizado' using errcode = 'insufficient_privilege';
  end if;

  update public.public_reports
  set image_url = p_image_url
  where session_id = p_session_id
    and image_url is null
    and is_revoked = false;
end;
$$;

revoke execute on function public.attach_report_image(uuid, text) from anon;

-- El reporte publico expone la imagen para poder descargarla o compartirla.
create or replace function public.get_public_report(p_token_hash text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'sessionId', s.id,
    'reportNumber', r.report_number,
    'generatedAt', r.generated_at,
    'performedBy', coalesce(resp.display_name, author.display_name),
    'signature', s.signature,
    'notes', s.notes,
    'bakeryName', b.bakery_name,
    'logoUrl', b.logo_url,
    'imageUrl', r.image_url,
    'items', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'name', i.product_name_snapshot,
            'imageUrl', i.image_snapshot,
            'quantity', i.quantity
          )
          order by i.sort_order_snapshot, i.product_name_snapshot
        )
        from public.inventory_items i
        where i.session_id = s.id
      ),
      '[]'::jsonb
    )
  )
  into v_result
  from public.public_reports r
  join public.inventory_sessions s on s.id = r.session_id
  join public.profiles author on author.id = s.performed_by
  left join public.profiles resp on resp.id = s.responsible_id
  cross join lateral (select * from public.bakery_settings limit 1) b
  where r.public_token_hash = p_token_hash
    and r.is_revoked = false;

  return v_result;
end;
$$;

grant execute on function public.get_public_report(text) to anon, authenticated;
/*
 * Fase 10: firma trazada a mano y retencion de 60 dias.
 */

-- 1. Firma como imagen --------------------------------------------------------

alter table public.inventory_sessions add column if not exists signature_image text;

comment on column public.inventory_sessions.signature_image is
  'Trazo de la firma en PNG. La columna signature conserva el nombre escrito.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('signatures', 'signatures', true, 1048576, array['image/png'])
on conflict (id) do nothing;

drop policy if exists "signatures_public_read" on storage.objects;
drop policy if exists "signatures_member_write" on storage.objects;

-- Lectura publica: la firma aparece en el reporte compartido, que no exige sesion.
create policy "signatures_public_read"
  on storage.objects for select
  using (bucket_id = 'signatures');

create policy "signatures_member_write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'signatures' and public.is_active_member());

drop function if exists public.finalize_inventory_session(uuid, text, text, uuid, text);
drop function if exists public.finalize_inventory_session(uuid, text, text, uuid, text, text);

create or replace function public.finalize_inventory_session(
  p_session_id uuid,
  p_token_hash text,
  p_notes text default null,
  p_responsible_id uuid default null,
  p_signature text default null,
  p_signature_image text default null
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
      signature = p_signature,
      signature_image = p_signature_image
  where id = p_session_id;

  insert into public.public_reports (session_id, public_token_hash, report_number)
  values (p_session_id, p_token_hash, v_number);

  return query select v_number, now(), false;
end;
$$;

revoke execute on function public.finalize_inventory_session(uuid, text, text, uuid, text, text) from anon;

-- 2. Retencion de 60 dias -----------------------------------------------------

/*
 * Borra los conteos finalizados hace mas de 60 dias. El borrado en cascada de
 * inventory_items y public_reports se encarga del resto de filas.
 * Devuelve cuantos elimino para poder registrarlo.
 */
create or replace function public.purge_old_reports(p_days integer default 60)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_deleted integer;
begin
  if p_days < 30 then
    raise exception 'La retencion minima es de 30 dias' using errcode = 'check_violation';
  end if;

  with removed as (
    delete from public.inventory_sessions
    where status = 'FINALIZED'
      and finalized_at < now() - make_interval(days => p_days)
    returning 1
  )
  select count(*) into v_deleted from removed;

  return v_deleted;
end;
$$;

revoke execute on function public.purge_old_reports(integer) from anon, authenticated;

-- Un conteo borrado debe llevarse su reporte: sin esto quedarian huerfanos.
alter table public.public_reports
  drop constraint if exists public_reports_session_id_fkey,
  add constraint public_reports_session_id_fkey
    foreign key (session_id) references public.inventory_sessions (id) on delete cascade;

-- 3. Exponer la firma trazada en el reporte publico ---------------------------

create or replace function public.get_public_report(p_token_hash text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'sessionId', s.id,
    'reportNumber', r.report_number,
    'generatedAt', r.generated_at,
    'performedBy', coalesce(resp.display_name, author.display_name),
    'signature', s.signature,
    'signatureImage', s.signature_image,
    'notes', s.notes,
    'bakeryName', b.bakery_name,
    'logoUrl', b.logo_url,
    'imageUrl', r.image_url,
    'items', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'name', i.product_name_snapshot,
            'imageUrl', i.image_snapshot,
            'quantity', i.quantity
          )
          order by i.sort_order_snapshot, i.product_name_snapshot
        )
        from public.inventory_items i
        where i.session_id = s.id
      ),
      '[]'::jsonb
    )
  )
  into v_result
  from public.public_reports r
  join public.inventory_sessions s on s.id = r.session_id
  join public.profiles author on author.id = s.performed_by
  left join public.profiles resp on resp.id = s.responsible_id
  cross join lateral (select * from public.bakery_settings limit 1) b
  where r.public_token_hash = p_token_hash
    and r.is_revoked = false;

  return v_result;
end;
$$;

grant execute on function public.get_public_report(text) to anon, authenticated;
