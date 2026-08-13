'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { SignaturePad } from '@/components/ui/signature-pad';
import type { ActionResult } from '@/lib/errors/app-error';
import type { StaffMember } from '@/server/repositories/users';
import { finalizeInventoryAction } from './actions';

interface FinalizeDialogProps {
  sessionId: string;
  totals: { units: number; counted: number };
  productCount: number;
  staff: StaffMember[];
  currentUserId: string;
  onCancel: () => void;
  onDone: (token: string) => void;
}

function ConfirmButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" isLoading={pending} className="w-full">
      Sí, finalizar
    </Button>
  );
}

export function FinalizeDialog({
  sessionId,
  totals,
  productCount,
  staff,
  currentUserId,
  onCancel,
  onDone,
}: FinalizeDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [state, formAction] = useActionState<
    ActionResult<{ token: string; reportNumber: string }> | null,
    FormData
  >(finalizeInventoryAction, null);

  useEffect(() => {
    if (state?.ok === true) {
      onDone(state.data.token);
    }
  }, [state, onDone]);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const missing = productCount - totals.counted;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-black/50 p-0 backdrop-blur-sm sm:place-items-center sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="finalize-title"
        tabIndex={-1}
        className="slide-up glass-strong max-h-[92dvh] w-full max-w-md overflow-auto rounded-t-panel p-5 shadow-float sm:rounded-panel"
      >
        <h2 id="finalize-title" className="text-xl font-extrabold text-ink">
          ¿Finalizar el conteo?
        </h2>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-bg-tint p-3 text-center">
            <strong className="block text-2xl font-extrabold tabular-nums text-ink">
              {totals.counted}
            </strong>
            <span className="text-xs text-ink-muted">Panes</span>
          </div>
          <div className="rounded-xl bg-bg-tint p-3 text-center">
            <strong className="block text-2xl font-extrabold tabular-nums text-ink">
              {totals.units}
            </strong>
            <span className="text-xs text-ink-muted">Unidades</span>
          </div>
        </div>

        {missing > 0 ? (
          <p className="mt-3 rounded-xl border border-brand/30 bg-brand/8 p-3 text-sm text-ink-muted">
            {missing} {missing === 1 ? 'pan quedó' : 'panes quedaron'} en cero. Si es correcto,
            continúa.
          </p>
        ) : null}

        <form action={formAction} className="mt-4 flex flex-col gap-3">
          <input type="hidden" name="sessionId" value={sessionId} />

          {/* El responsable se elige de la lista de personal: nunca se escribe a mano. */}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-ink">¿Quién hizo el conteo?</span>
            <select
              name="responsibleId"
              defaultValue={currentUserId}
              required
              className="min-h-touch w-full rounded-xl border border-line bg-surface px-3 text-base text-ink"
            >
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.displayName}
                </option>
              ))}
            </select>
          </label>

          <input type="hidden" name="signatureImage" value={signatureImage ?? ''} />

          <SignaturePad onChange={setSignatureImage} />

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-ink">Observaciones (opcional)</span>
            <textarea
              name="notes"
              rows={2}
              maxLength={500}
              placeholder="Ejemplo: faltó producción de pan integral…"
              className="w-full rounded-xl border border-line bg-surface p-3 text-base text-ink"
            />
          </label>

          <p className="text-sm font-bold text-ink">Después no podrás modificarlo.</p>

          {state?.ok === false ? (
            <p role="alert" className="text-sm font-bold text-danger">
              {state.message}
            </p>
          ) : null}

          <ConfirmButton />

          <Button variant="ghost" onClick={onCancel} className="w-full">
            Seguir contando
          </Button>
        </form>
      </div>
    </div>
  );
}
