'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

/**
 * El detalle tecnico nunca se muestra en pantalla: solo `digest`, que permite
 * localizar el error en los registros del servidor sin exponer datos internos.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error no controlado en la interfaz', error.digest ?? error.message);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <section className="rise-in glass-strong w-full max-w-md rounded-panel p-8 text-center shadow-float">
        <h1 className="text-2xl font-extrabold text-ink">Algo salió mal</h1>
        <p className="mt-2 leading-relaxed text-ink-muted">
          No pudimos completar la operación. Puedes intentarlo nuevamente.
        </p>
        <Button onClick={reset} size="lg" className="mt-6 w-full">
          Reintentar
        </Button>
        {error.digest ? (
          <p className="mt-4 font-mono text-xs text-ink-muted">Referencia: {error.digest}</p>
        ) : null}
      </section>
    </main>
  );
}
