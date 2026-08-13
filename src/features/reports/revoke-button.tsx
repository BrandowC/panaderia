'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import type { ActionResult } from '@/lib/errors/app-error';
import { revokeReportAction } from './actions';

function ConfirmSubmit() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="pressable min-h-touch rounded-xl bg-danger px-3 text-sm font-semibold text-white disabled:opacity-60"
    >
      {pending ? '...' : 'Sí, revocar'}
    </button>
  );
}

export function RevokeButton({ reportId }: { reportId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction] = useActionState<ActionResult<null> | null, FormData>(
    revokeReportAction,
    null,
  );

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="pressable min-h-touch rounded-xl border border-line-strong px-3 text-sm font-semibold text-ink"
      >
        Revocar
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="reportId" value={reportId} />
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="min-h-touch px-2 text-sm text-ink-muted"
        >
          Cancelar
        </button>
        <ConfirmSubmit />
      </form>

      {state?.ok === false ? (
        <p role="alert" className="text-xs text-danger">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
