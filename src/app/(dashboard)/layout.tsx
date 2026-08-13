import type { ReactNode } from 'react';
import { AppNav } from '@/components/shell/app-nav';
import { BrandMark } from '@/components/shell/brand-mark';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/server/auth/session';

/** Guarda de servidor: ninguna pagina hija se renderiza sin sesion valida. */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: settings } = await supabase
    .from('bakery_settings')
    .select('bakery_name')
    .limit(1)
    .maybeSingle();

  const bakeryName = settings?.bakery_name ?? 'Panadería';

  return (
    <div className="min-h-dvh">
      <header className="glass-strong sticky top-0 z-30 border-x-0 border-t-0">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-3 py-2.5 sm:px-5">
          <AppNav variant="trigger" />

          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <BrandMark />
            <div className="min-w-0">
              <strong className="block truncate text-sm font-extrabold text-ink sm:text-base">
                {bakeryName}
              </strong>
              <span className="block truncate text-xs text-ink-muted">Inventario diario</span>
            </div>
          </div>

          <ThemeToggle />

          <div className="flex items-center gap-2 rounded-full border border-line bg-glass p-1 pr-1 sm:pr-3">
            <span
              className="grid size-9 shrink-0 place-items-center rounded-full bg-linear-135 from-secondary to-brand text-sm font-extrabold text-white"
              aria-hidden="true"
            >
              {user.displayName.charAt(0).toUpperCase()}
            </span>
            <span className="hidden min-w-0 sm:block">
              <strong className="block max-w-32 truncate text-sm font-bold text-ink">
                {user.displayName}
              </strong>
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-5 px-3 py-5 sm:px-5 lg:grid-cols-[230px_minmax(0,1fr)]">
        <AppNav variant="sidebar" />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
