-- Fase 2: Row Level Security. Denegar por defecto y conceder lo minimo.

alter table public.profiles enable row level security;
alter table public.bakery_settings enable row level security;
alter table public.audit_logs enable row level security;

/*
 * R2: una politica sobre profiles que consulte profiles provoca recursion infinita.
 * SECURITY DEFINER evita reevaluar RLS al leer el rol. search_path fijo impide que
 * un esquema del atacante suplante las tablas referenciadas.
 */
create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

create or replace function public.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'ADMIN' and is_active
  );
$$;

revoke execute on function public.current_role() from anon;
revoke execute on function public.is_active_admin() from anon;

-- profiles ------------------------------------------------------------------

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "profiles_select_admin"
  on public.profiles for select
  to authenticated
  using (public.is_active_admin());

create policy "profiles_insert_admin"
  on public.profiles for insert
  to authenticated
  with check (public.is_active_admin());

/*
 * Un administrador no puede quitarse a si mismo el rol ni desactivarse: evita
 * dejar la instalacion sin ningun administrador activo.
 */
create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (public.is_active_admin())
  with check (
    public.is_active_admin()
    and (id <> (select auth.uid()) or (role = 'ADMIN' and is_active))
  );

-- Sin politica de DELETE: los usuarios se desactivan, no se borran.

-- bakery_settings -----------------------------------------------------------

create policy "bakery_settings_select_authenticated"
  on public.bakery_settings for select
  to authenticated
  using (true);

create policy "bakery_settings_update_admin"
  on public.bakery_settings for update
  to authenticated
  using (public.is_active_admin())
  with check (public.is_active_admin());

-- audit_logs ----------------------------------------------------------------

create policy "audit_logs_select_admin"
  on public.audit_logs for select
  to authenticated
  using (public.is_active_admin());

-- Sin politica de INSERT para clientes: la auditoria se escribe desde el servidor
-- con privilegios elevados, para que nadie pueda falsificar registros.
