import Link from 'next/link';
import { BrandMark } from '@/components/shell/brand-mark';

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <section className="rise-in aura-card glass-strong w-full max-w-md rounded-panel p-8 text-center shadow-float">
        <div className="relative">
          <BrandMark className="mx-auto size-14" />
          <h1 className="mt-5 text-2xl font-extrabold text-ink">No encontramos esta página</h1>
          <p className="mt-2 leading-relaxed text-ink-muted">
            Es posible que el enlace haya cambiado o que el reporte ya no esté disponible.
          </p>
          <Link
            href="/"
            className="pressable mt-6 inline-flex min-h-touch items-center justify-center rounded-2xl bg-linear-135 from-brand to-brand-soft px-6 font-bold text-on-brand shadow-brand"
          >
            Volver al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
