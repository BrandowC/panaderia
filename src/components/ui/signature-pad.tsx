'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface SignaturePadProps {
  onChange: (dataUrl: string | null) => void;
}

const STROKE_WIDTH = 2.6;

/**
 * Firma trazada con el dedo o el ratón. Usa eventos de puntero, que cubren
 * tacto, lápiz y ratón con un solo camino de código.
 */
export function SignaturePad({ onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  const prepare = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // El canvas se dibuja al doble de resolucion para que el trazo no se vea
    // pixelado en pantallas de celular.
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.scale(ratio, ratio);
    context.lineWidth = STROKE_WIDTH;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#2C211B';
  }, []);

  useEffect(() => {
    prepare();
    window.addEventListener('resize', prepare);
    return () => window.removeEventListener('resize', prepare);
  }, [prepare]);

  function pointFrom(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function start(event: React.PointerEvent<HTMLCanvasElement>) {
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;

    // Capturar el puntero evita que el trazo se corte al salir del recuadro.
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;

    const { x, y } = pointFrom(event);
    context.beginPath();
    context.moveTo(x, y);
  }

  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;

    const { x, y } = pointFrom(event);
    context.lineTo(x, y);
    context.stroke();

    if (!hasInk) {
      setHasInk(true);
    }
  }

  function end() {
    if (!drawing.current) return;
    drawing.current = false;

    const canvas = canvasRef.current;
    if (canvas && hasInk) {
      onChange(canvas.toDataURL('image/png'));
    }
  }

  function clear() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    onChange(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-ink">Firma</span>
        {hasInk ? (
          <button
            type="button"
            onClick={clear}
            className="pressable min-h-touch rounded-xl px-3 text-sm font-bold text-danger"
          >
            Borrar
          </button>
        ) : null}
      </div>

      <div className="relative overflow-hidden rounded-xl border border-line-strong bg-white">
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          aria-label="Traza tu firma con el dedo"
          // `touch-none` impide que el gesto desplace la pagina al firmar.
          className="h-36 w-full cursor-crosshair touch-none"
        />

        {!hasInk ? (
          <span className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-ink-muted/70">
            Firma aquí con el dedo
          </span>
        ) : null}
      </div>
    </div>
  );
}
