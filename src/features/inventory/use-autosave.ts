'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { updateQuantityAction } from './actions';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const DEBOUNCE_MS = 700;

/**
 * Guarda con retardo para no enviar una peticion por cada pulsacion, y conserva
 * una copia local hasta confirmar el guardado: una recarga o una perdida de red
 * no debe borrar el trabajo hecho de pie en la panaderia.
 */
export function useAutosave(sessionId: string) {
  const [state, setState] = useState<SaveState>('idle');
  const [pendingCount, setPendingCount] = useState(0);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const pending = useRef(new Map<string, number>());

  const storageKey = `inventario-borrador:${sessionId}`;

  const persistLocal = useCallback(
    (itemId: string, quantity: number) => {
      try {
        const raw = localStorage.getItem(storageKey);
        const draft = raw ? (JSON.parse(raw) as Record<string, number>) : {};
        draft[itemId] = quantity;
        localStorage.setItem(storageKey, JSON.stringify(draft));
      } catch {
        // Sin almacenamiento local seguimos guardando en el servidor.
      }
    },
    [storageKey],
  );

  const clearLocal = useCallback(
    (itemId: string) => {
      try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return;
        const draft = JSON.parse(raw) as Record<string, number>;
        delete draft[itemId];
        localStorage.setItem(storageKey, JSON.stringify(draft));
      } catch {
        // Ignorado a proposito.
      }
    },
    [storageKey],
  );

  const flush = useCallback(
    async (itemId: string) => {
      const quantity = pending.current.get(itemId);
      if (quantity === undefined) return;

      pending.current.delete(itemId);
      setState('saving');

      const result = await updateQuantityAction(itemId, quantity);

      if (result.ok) {
        clearLocal(itemId);
        setPendingCount(pending.current.size);
        setState(pending.current.size === 0 ? 'saved' : 'saving');
      } else {
        // Se conserva en local para reintentar; el usuario ve el estado de error.
        setState('error');
      }
    },
    [clearLocal],
  );

  const schedule = useCallback(
    (itemId: string, quantity: number) => {
      pending.current.set(itemId, quantity);
      persistLocal(itemId, quantity);
      setPendingCount(pending.current.size);
      setState('saving');

      const existing = timers.current.get(itemId);
      if (existing) clearTimeout(existing);

      timers.current.set(
        itemId,
        setTimeout(() => {
          timers.current.delete(itemId);
          void flush(itemId);
        }, DEBOUNCE_MS),
      );
    },
    [flush, persistLocal],
  );

  useEffect(() => {
    const currentTimers = timers.current;
    return () => {
      for (const timer of currentTimers.values()) {
        clearTimeout(timer);
      }
    };
  }, []);

  // Avisa si quedan cambios sin enviar al cerrar la pestana.
  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (pending.current.size > 0) {
        event.preventDefault();
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return { state, pendingCount, schedule };
}
