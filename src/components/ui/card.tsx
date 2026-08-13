import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  interactive?: boolean;
  aura?: boolean;
}

/** Panel translucido con desenfoque: la superficie base de toda la aplicacion. */
export function Card({
  className,
  children,
  interactive = false,
  aura = false,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'glass rounded-panel p-4 shadow-card sm:p-5',
        aura ? 'aura-card' : null,
        interactive ? 'lift' : null,
        className,
      )}
      {...props}
    >
      <div className="relative">{children}</div>
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn('text-lg font-bold wrap-break-word text-ink', className)} {...props}>
      {children}
    </h2>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm leading-relaxed text-ink-muted', className)} {...props}>
      {children}
    </p>
  );
}

/** Tarjeta de cifra con icono, como el `stat-card` del prototipo. */
export function StatCard({
  icon,
  value,
  label,
  hint,
}: {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <article className="glass flex flex-col rounded-card p-4 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        {/* Una sola linea: si la etiqueta envuelve, las cifras de dos tarjetas
            contiguas dejan de alinearse entre si. */}
        <span className="truncate text-sm font-medium text-ink-muted">{label}</span>
        <span
          className="grid size-9 shrink-0 place-items-center rounded-xl bg-bg-tint text-brand-ink"
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
      <strong className="mt-2 block text-2xl font-extrabold tabular-nums text-ink">{value}</strong>
      {hint ? <span className="truncate text-xs text-ink-muted">{hint}</span> : null}
    </article>
  );
}
