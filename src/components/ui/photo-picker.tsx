'use client';

import { useRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface PhotoPickerProps {
  label: string;
  bucket: 'product-photos' | 'user-photos';
  value: string | null;
  onChange: (url: string | null) => void;
  shape?: 'square' | 'circle';
}

const MAX_DIMENSION = 900;
const JPEG_QUALITY = 0.82;

/**
 * Reduce la foto antes de subirla: una camara de celular produce archivos de
 * varios megabytes y el catalogo se abre con datos moviles en la panaderia.
 */
async function compress(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('sin contexto de canvas');
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('no se pudo comprimir'))),
      'image/jpeg',
      JPEG_QUALITY,
    );
  });
}

export function PhotoPicker({
  label,
  bucket,
  value,
  onChange,
  shape = 'square',
}: PhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);

    try {
      const blob = await compress(file);
      const body = new FormData();
      body.append('file', blob, 'foto.jpg');
      body.append('bucket', bucket);

      const response = await fetch('/api/upload', { method: 'POST', body });
      const result = (await response.json()) as { url?: string; message?: string };

      if (!response.ok || !result.url) {
        throw new Error(result.message ?? 'No se pudo subir la foto.');
      }

      onChange(result.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo subir la foto.');
    } finally {
      setBusy(false);
    }
  }

  const rounded = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-bold text-ink">{label}</span>

      <div className="flex items-center gap-3">
        <div
          className={cn(
            'grid size-20 shrink-0 place-items-center overflow-hidden border border-line bg-bg-tint',
            rounded,
          )}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- la URL viene de Supabase Storage
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <CameraIcon />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            // `capture` abre la camara trasera directamente en el celular.
            capture="environment"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
              event.target.value = '';
            }}
          />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="pressable inline-flex min-h-touch items-center justify-center gap-2 rounded-xl border border-line-strong bg-bg-tint px-3 text-sm font-bold text-secondary disabled:opacity-60"
          >
            <CameraIcon small />
            {busy ? 'Subiendo…' : value ? 'Cambiar foto' : 'Tomar foto'}
          </button>

          {value ? (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="pressable min-h-touch rounded-xl px-3 text-sm font-bold text-danger"
            >
              Quitar foto
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm font-bold text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function CameraIcon({ small = false }: { small?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(small ? 'size-4.5' : 'size-7', 'text-ink-muted')}
      aria-hidden="true"
    >
      <path d="M4 8.5h3l1.4-2h7.2L17 8.5h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13.5" r="3.2" />
    </svg>
  );
}
