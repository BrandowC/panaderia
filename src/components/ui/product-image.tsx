'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface ProductImageProps {
  src: string | null;
  alt: string;
  className?: string;
}

/**
 * Degrada a un marcador cuando no hay imagen o la carga falla: una foto rota
 * en el catalogo confunde mas que un icono neutro.
 */
export function ProductImage({ src, alt, className }: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn('grid place-items-center bg-bg-tint text-ink-muted', className)}
        aria-hidden="true"
      >
        {/* El icono escala con el hueco: en una tarjeta grande uno de 20 px
            deja un vacio que parece un fallo de carga. */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          className="size-1/2 max-h-16 opacity-70"
        >
          <path d="M4 15c0-4 3.6-7 8-7s8 3 8 7v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1Z" />
          <path d="M8 12.5c.6-.8 1.5-1.2 2.5-1.2M13.5 11.3c1 0 1.9.4 2.5 1.2" />
        </svg>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- las URLs son externas y configurables por el admin
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn('object-cover', className)}
    />
  );
}
