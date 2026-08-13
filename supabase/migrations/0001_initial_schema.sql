-- Fase 2: identidad, perfiles y configuracion de la panaderia.

create type public.app_role as enum ('ADMIN', 'EMPLOYEE');
create type public.inventory_status as enum ('DRAFT', 'FINALIZED', 'CANCELLED');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (length(trim(display_name)) between 1 and 80),
  role public.app_role not null default 'EMPLOYEE',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Datos de aplicacion del usuario. Las credenciales viven solo en auth.users.';

-- Filtra los usuarios que pueden iniciar un conteo sin recorrer toda la tabla.
create index profiles_active_role_idx on public.profiles (role) where is_active;

create table public.bakery_settings (
  id uuid primary key default gen_random_uuid(),
  bakery_name text not null default 'Panaderia' check (length(trim(bakery_name)) between 1 and 120),
  logo_url text,
  timezone text not null default 'America/Bogota',
  max_quantity integer not null default 99999 check (max_quantity between 1 and 1000000),
  is_singleton boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- La aplicacion administra una sola panaderia: el indice impide una segunda fila.
create unique index bakery_settings_singleton_idx on public.bakery_settings (is_singleton);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on column public.audit_logs.metadata is
  'Contexto no sensible. Nunca almacenar contrasenas, tokens ni claves.';

create index audit_logs_created_at_idx on public.audit_logs (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger bakery_settings_set_updated_at
  before update on public.bakery_settings
  for each row execute function public.set_updated_at();

/*
 * Crea el perfil al registrar un usuario en auth.users.
 * El rol nunca se toma de metadatos enviados por el cliente: se fuerza EMPLOYEE
 * y solo un administrador puede elevarlo despues. Evita escalamiento en el registro.
 */
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1)),
    'EMPLOYEE'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.bakery_settings (bakery_name) values ('Panaderia');
