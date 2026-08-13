'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

const ToastContext = createContext<((message: string, kind?: ToastKind) => void) | null>(null);

export function useToast() {
  const show = useContext(ToastContext);
  if (!show) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }
  return show;
}

const KIND_CLASSES: Record<ToastKind, string> = {
  success: 'bg-ok text-white',
  error: 'bg-danger text-white',
  info: 'bg-secondary text-white',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = Date.now() + Math.random();
    setItems((current) => [...current, { id, message, kind }]);
    setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, 3600);
  }, []);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext value={value}>
      {children}

      {/* `aria-live` anuncia el mensaje a lectores de pantalla sin robar el foco. */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-3 bottom-3 z-100 grid gap-2 sm:left-auto sm:right-5 sm:bottom-5 sm:w-90"
      >
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className={cn(
              'slide-up pointer-events-auto rounded-2xl px-4 py-3 text-sm font-semibold shadow-float',
              KIND_CLASSES[item.kind],
            )}
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext>
  );
}
