'use client';

import { useState } from 'react';
import { ProductImage } from '@/components/ui/product-image';
import { cn } from '@/lib/utils/cn';
import type { InventoryItem } from '@/server/repositories/inventory';
import { DEFAULT_MAX_QUANTITY } from '@/types';
import { parseQuantityInput } from './schemas';

interface CountRowProps {
  item: InventoryItem;
  onChange: (itemId: string, quantity: number) => void;
}

/**
 * Tarjeta con la foto grande y un unico campo de cantidad debajo.
 * Sin botones de mas y menos: en una panaderia se teclea la cifra completa
 * ("42 mogollas"), no se pulsa cuarenta y dos veces.
 */
export function CountRow({ item, onChange }: CountRowProps) {
  const [value, setValue] = useState(item.quantity);

  function commit(next: number) {
    const clamped = Math.min(Math.max(next, 0), DEFAULT_MAX_QUANTITY);
    setValue(clamped);
    onChange(item.id, clamped);
  }

  const counted = value > 0;

  return (
    <li
      className={cn(
        'glass overflow-hidden rounded-card transition-colors',
        counted ? 'border-brand/60' : null,
      )}
    >
      {/* 16/10 en vez de 4/3: deja ver la foto sin que solo quepan dos filas. */}
      <ProductImage src={item.imageUrl} alt="" className="aspect-16/10 w-full" />

      <div className="flex flex-col gap-2 p-2.5">
        <p
          lang="es"
          className="line-clamp-2 min-h-9 text-sm font-bold leading-tight text-ink hyphens-auto"
        >
          {item.name}
        </p>

        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onFocus={(event) => event.target.select()}
          onChange={(event) => {
            const parsed = parseQuantityInput(event.target.value);
            if (parsed !== null) commit(parsed);
          }}
          aria-label={`Cantidad de ${item.name}`}
          className={cn(
            'h-14 w-full rounded-xl border-2 bg-surface text-center text-3xl font-extrabold tabular-nums',
            counted ? 'border-brand bg-brand/8 text-brand-ink' : 'border-line text-ink',
          )}
        />
      </div>
    </li>
  );
}
