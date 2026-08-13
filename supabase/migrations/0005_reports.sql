-- Fase 5: reportes publicos inmutables.

create table public.public_reports (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.inventory_sessions (id) on delete cascade,
  -- R4: se guarda solo el hash. Un volcado de la tabla no revela ningun enlace.
  public_token_hash text not null unique,
  report_number text not null unique,
  is_revoked boolean not null default false,
  generated_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references public.profiles (id) on delete set null
);

create index public_reports_generated_idx on public.public_reports (generated_at desc);

alter table public.public_reports enable row level security;

create policy "reports_select_own_or_admin"
  on public.public_reports for select
  to authenticated
  using (
    exists (
      select 1 from public.inventory_sessions s
      where s.id = session_id
        and (s.performed_by = (select auth.uid()) or public.is_active_admin())
    )
  );

create policy "reports_revoke_admin"
  on public.public_reports for update
  to authenticated
  using (public.is_active_admin())
  with check (public.is_active_admin());

/*
 * Finaliza el conteo y crea el reporte en una sola transaccion.
 * Recibe el hash ya calculado: el token en claro nunca llega a la base ni a los
 * registros de Postgres. Idempotente: si el conteo ya estaba finalizado devuelve
 * el reporte existente en lugar de fallar o duplicar.
 */
create or replace function public.finalize_inventory_session(
  p_session_id uuid,
  p_token_hash text,
  p_notes text default null
)
-- Los nombres de salida llevan prefijo: sin el, `report_number` seria ambiguo
-- entre la columna de retorno y la columna de la tabla (error 42702).
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
  if v_session.performed_by <> auth.uid() and not public.is_active_admin() then
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

  -- Numero legible con la fecha civil de Bogota, no la de UTC.
  v_today := to_char(timezone('America/Bogota', now()), 'YYYYMMDD');

  select count(*) + 1 into v_sequence
  from public.public_reports
  where report_number like 'INV-' || v_today || '-%';

  v_number := 'INV-' || v_today || '-' || lpad(v_sequence::text, 3, '0');

  update public.inventory_sessions
  set status = 'FINALIZED',
      finalized_at = now(),
      notes = coalesce(p_notes, notes)
  where id = p_session_id;

  insert into public.public_reports (session_id, public_token_hash, report_number)
  values (p_session_id, p_token_hash, v_number);

  return query select v_number, now(), false;
end;
$$;

revoke execute on function public.finalize_inventory_session(uuid, text, text) from anon;

/*
 * Resuelve un reporte publico por hash de token. SECURITY DEFINER para saltar RLS
 * de forma controlada y devolver solo campos permitidos: nunca correos,
 * identificadores de usuario ni datos internos.
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
    'performedBy', p.display_name,
    'notes', s.notes,
    'bakeryName', b.bakery_name,
    'logoUrl', b.logo_url,
    'items', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'name', i.product_name_snapshot,
            'category', i.category_snapshot,
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
  join public.profiles p on p.id = s.performed_by
  cross join lateral (select * from public.bakery_settings limit 1) b
  where r.public_token_hash = p_token_hash
    and r.is_revoked = false;

  return v_result;
end;
$$;

grant execute on function public.get_public_report(text) to anon, authenticated;
