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
