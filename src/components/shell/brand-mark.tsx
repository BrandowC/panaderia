import { cn } from '@/lib/utils/cn';

/**
 * Logotipo en gradiente. Se dibuja en SVG en lugar de usar un emoji para que
 * se vea igual en Android, iOS y escritorio.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-2xl bg-linear-135 from-brand to-secondary text-white shadow-brand',
        className ?? 'size-11',
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-2/3">
        <path
          d="M4.2 14.6c0-3.9 3.5-6.9 7.8-6.9s7.8 3 7.8 6.9v1.1a2.2 2.2 0 0 1-2.2 2.2H6.4a2.2 2.2 0 0 1-2.2-2.2v-1.1Z"
          fill="currentColor"
          opacity="0.95"
        />
        <path
          d="M8.6 11.9c.7-.9 1.7-1.4 2.8-1.4M13.9 10.6c1.1 0 2.1.5 2.8 1.4"
          stroke="#7A4520"
          strokeWidth="1.3"
          strokeLinecap="round"
          opacity="0.55"
        />
        <path
          d="M12 7.7c0-1.4.8-2.5 2-2.9"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
