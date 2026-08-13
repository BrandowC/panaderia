-- Fase 3: catalogo de productos.

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 80),
  normalized_name text not null,
  category text check (category is null or length(trim(category)) between 1 and 60),
  image_url text,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.products is
  'Catalogo. Los productos con historial se archivan (is_active=false), nunca se borran.';

/*
 * Evita duplicados evidentes solo entre productos activos: permite reutilizar el
 * nombre de uno archivado sin romper el historial que ya lo referencia.
 */
create unique index products_active_name_idx
  on public.products (normalized_name) where is_active;

-- Orden de presentacion del conteo: categoria, luego orden manual, luego nombre.
create index products_listing_idx
  on public.products (sort_order, name) where is_active;

create or replace function public.unaccent_static(value text)
returns text
language sql
immutable
as $$
  select translate(
    value,
    'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
    'aaaaaeeeeiiiiooooouuuuncAAAAAEEEEIIIIOOOOOUUUUNC'
  );
$$;

/*
 * Normaliza el nombre en la base y no en el cliente: garantiza que la deteccion de
 * duplicados sea consistente aunque cambie la aplicacion. Quita acentos y espacios
 * repetidos para que "Pan Aliñado" y "pan  alinado" colisionen.
 */
create or replace function public.normalize_product_name(value text)
returns text
language sql
immutable
as $$
  select lower(regexp_replace(trim(public.unaccent_static(value)), '\s+', ' ', 'g'));
$$;

create or replace function public.set_product_normalized_name()
returns trigger
language plpgsql
as $$
begin
  new.normalized_name = public.normalize_product_name(new.name);
  return new;
end;
$$;

create trigger products_normalize_name
  before insert or update of name on public.products
  for each row execute function public.set_product_normalized_name();

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- RLS ------------------------------------------------------------------------

alter table public.products enable row level security;

-- Todo usuario autenticado ve el catalogo activo; solo el admin ve los archivados.
create policy "products_select_active"
  on public.products for select
  to authenticated
  using (is_active or public.is_active_admin());

create policy "products_insert_admin"
  on public.products for insert
  to authenticated
  with check (public.is_active_admin());

create policy "products_update_admin"
  on public.products for update
  to authenticated
  using (public.is_active_admin())
  with check (public.is_active_admin());

-- Sin politica de DELETE: archivar es la unica forma de retirar un producto.
