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
