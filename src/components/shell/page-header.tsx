import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

/** Encabezado comun a todas las paginas: mantiene la misma jerarquia visual. */
export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <header className="rise-in flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-extrabold uppercase tracking-widest text-brand-ink">{eyebrow}</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">{description}</p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
