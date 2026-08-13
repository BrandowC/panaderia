'use client';

import { useCallback, useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

/** En el servidor el tema real aun no se conoce; el script inline ya lo aplico. */
function getServerSnapshot(): Theme {
  return 'light';
}

export function ThemeToggle() {
  // useSyncExternalStore es el patron correcto para leer estado externo (el DOM)
  // sin provocar renders en cascada desde un efecto.
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    const next: Theme = getSnapshot() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Modo privado puede bloquear el almacenamiento: el tema dura la sesion.
    }
    for (const listener of listeners) {
      listener();
    }
  }, []);

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      // Solo icono, sin texto visible: el nombre accesible viaja en aria-label.
      aria-label={isDark ? 'Cambiar a modo dia' : 'Cambiar a modo noche'}
      aria-pressed={isDark}
      className="pressable relative size-11 shrink-0 rounded-full border border-line bg-surface"
    >
      <span
        className="absolute inset-0 grid place-items-center transition-[opacity,transform] duration-300"
        style={{
          opacity: isDark ? 0 : 1,
          transform: isDark ? 'rotate(-90deg) scale(0.5)' : 'rotate(0deg) scale(1)',
        }}
        aria-hidden="true"
      >
        <SunIcon />
      </span>

      <span
        className="absolute inset-0 grid place-items-center transition-[opacity,transform] duration-300"
        style={{
          opacity: isDark ? 1 : 0,
          transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0.5)',
        }}
        aria-hidden="true"
      >
        <MoonIcon />
      </span>
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="text-bread-600"
    >
      <circle cx="12" cy="12" r="4.5" fill="currentColor" stroke="none" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-bread-400">
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" fill="currentColor" />
    </svg>
  );
}
