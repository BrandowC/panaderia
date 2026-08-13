'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { logoutAction } from '@/features/auth/actions';
import { cn } from '@/lib/utils/cn';
import {
  BreadIcon,
  CloseIcon,
  CountIcon,
  HomeIcon,
  LogoutIcon,
  MenuIcon,
  ReportIcon,
  UsersIcon,
} from './nav-icons';

export interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/inventario', label: 'Resumen', icon: <HomeIcon /> },
  { href: '/inventario/contar', label: 'Contar panes', icon: <CountIcon /> },
  { href: '/historial', label: 'Reportes', icon: <ReportIcon /> },
  { href: '/panes', label: 'Panes', icon: <BreadIcon /> },
  { href: '/empleados', label: 'Empleados', icon: <UsersIcon /> },
];

export function isCurrent(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * `trigger` dibuja el boton de menu en la barra superior (solo movil);
 * `sidebar` dibuja el panel fijo de escritorio. Un unico componente evita que
 * las dos vistas se desincronicen.
 */
export function AppNav({ variant }: { variant: 'trigger' | 'sidebar' }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const items = NAV_ITEMS;

  const links = (
    <nav className="grid gap-1.5">
      {items.map((item) => {
        const current = isCurrent(pathname, item.href);

        return (
          <div key={item.href}>
            <Link
              href={item.href}
              // Cerrar aqui, y no en un efecto sobre la ruta, evita renders en cascada.
              onClick={() => setOpen(false)}
              aria-current={current ? 'page' : undefined}
              className={cn(
                'pressable flex min-h-touch items-center gap-3 rounded-xl px-3 font-bold',
                current
                  ? 'bg-linear-135 from-brand/20 to-brand-soft/15 text-brand-ink'
                  : 'text-ink-muted hover:bg-bg-tint hover:text-secondary',
              )}
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </Link>
          </div>
        );
      })}

      <div className="my-2 h-px bg-line" />

      <form action={logoutAction}>
        <button
          type="submit"
          className="pressable flex min-h-touch w-full items-center gap-3 rounded-xl px-3 font-bold text-ink-muted hover:bg-bg-tint hover:text-secondary"
        >
          <LogoutIcon />
          Cerrar sesión
        </button>
      </form>
    </nav>
  );

  if (variant === 'sidebar') {
    return (
      <aside className="glass sticky top-24 hidden rounded-panel p-3 shadow-soft lg:block">
        {links}
      </aside>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        aria-expanded={open}
        className="pressable grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-bg-tint text-secondary lg:hidden"
      >
        <MenuIcon />
      </button>

      {/* Movil: panel deslizante sobre la pagina. */}
      {open ? (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm lg:hidden"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            className="slide-up glass-strong absolute inset-x-3 top-3 rounded-panel p-3 shadow-float"
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-sm font-bold text-ink-muted">Menú</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="pressable grid size-11 place-items-center rounded-xl bg-bg-tint text-ink-muted"
              >
                <CloseIcon />
              </button>
            </div>
            {links}
          </div>
        </div>
      ) : null}
    </>
  );
}
