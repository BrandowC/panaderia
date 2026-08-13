'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { startInventoryAction } from './actions';

export function StartInventoryButton({ hasDraft }: { hasDraft: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await startInventoryAction();
      if (result.ok) {
        router.push(`/inventario/${result.data.sessionId}`);
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button size="lg" onClick={handleClick} isLoading={isPending} className="w-full">
        {hasDraft ? 'Continuar conteo' : 'Iniciar conteo'}
      </Button>

      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
