'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { matchesSearch } from '@/lib/utils/search';
import type { InventoryItem } from '@/server/repositories/inventory';
import type { StaffMember } from '@/server/repositories/users';
import { CountRow } from './count-row';
import { FinalizeDialog } from './finalize-dialog';
import { useAutosave, type SaveState } from './use-autosave';

const SAVE_LABEL: Record<SaveState, string> = {
  idle: 'Sin cambios',
  saving: 'Guardando…',
  saved: 'Guardado',
  error: 'Sin conexión',
};

const SAVE_TONE: Record<SaveState, string> = {
  idle: 'text-ink-muted',
  saving: 'text-brand-ink',
  saved: 'text-ok',
  error: 'text-danger',
};

interface CountScreenProps {
  sessionId: string;
  items: InventoryItem[];
  staff: StaffMember[];
  currentUserId: string;
}

export function CountScreen({ sessionId, items, staff, currentUserId }: CountScreenProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(items.map((item) => [item.id, item.quantity])),
  );
  const [confirming, setConfirming] = useState(false);
  const { state, schedule } = useAutosave(sessionId);

  const visible = useMemo(
    () => (search.trim() === '' ? items : items.filter((item) => matchesSearch(item.name, search))),
    [items, search],
  );

  const totals = useMemo(() => {
    const values = Object.values(quantities);
    return {
      units: values.reduce((sum, value) => sum + value, 0),
      counted: values.filter((value) => value > 0).length,
    };
  }, [quantities]);

  function handleChange(itemId: string, quantity: number) {
    setQuantities((current) => ({ ...current, [itemId]: quantity }));
    schedule(itemId, quantity);
  }

  return (
    // pb-44 reserva la altura de la barra flotante para no tapar la ultima fila.
    <div className="flex flex-col gap-3 pb-44">
      <div className="sticky top-19 z-20 flex items-center gap-2 rounded-card border border-line bg-surface p-2 shadow-soft">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar un pan…"
          aria-label="Buscar producto"
          className="min-h-touch w-full min-w-0 rounded-xl border border-line bg-surface px-3 text-base text-ink"
        />
        <span
          aria-live="polite"
          className={cn('shrink-0 px-1 text-xs font-bold', SAVE_TONE[state])}
        >
          {SAVE_LABEL[state]}
        </span>
      </div>

      {visible.length === 0 ? (
        <p className="glass rounded-card p-8 text-center text-ink-muted">
          No encontramos panes con “{search}”.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-2">
          {visible.map((item) => (
            <CountRow key={item.id} item={item} onChange={handleChange} />
          ))}
        </ul>
      )}

      {/* Fondo opaco, no translucido: sobre una lista densa el desenfoque deja
          entrever las tarjetas y el resumen se vuelve ilegible. */}
      <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-3 sm:px-5 sm:pb-5">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-2 rounded-panel border border-line bg-surface p-3 shadow-float">
          <div className="flex items-center justify-around gap-2 text-center">
            <span className="min-w-0">
              <strong className="block text-xl font-extrabold tabular-nums text-ink">
                {totals.counted}
                <span className="text-sm font-bold text-ink-muted">/{items.length}</span>
              </strong>
              <span className="block text-xs text-ink-muted">Panes</span>
            </span>
            <span className="h-8 w-px bg-line" aria-hidden="true" />
            <span className="min-w-0">
              <strong className="block text-xl font-extrabold tabular-nums text-ink">
                {totals.units}
              </strong>
              <span className="block text-xs text-ink-muted">Unidades</span>
            </span>
          </div>

          <Button size="lg" onClick={() => setConfirming(true)} className="w-full">
            Finalizar reporte
          </Button>
        </div>
      </div>

      {confirming ? (
        <FinalizeDialog
          sessionId={sessionId}
          totals={totals}
          productCount={items.length}
          staff={staff}
          currentUserId={currentUserId}
          onCancel={() => setConfirming(false)}
          onDone={(token) => router.push(`/report/${token}`)}
        />
      ) : null}
    </div>
  );
}
