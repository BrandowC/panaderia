'use client';

import { useActionState, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { ProductImage } from '@/components/ui/product-image';
import type { ActionResult } from '@/lib/errors/app-error';
import { matchesSearch } from '@/lib/utils/search';
import type { Product } from '@/server/repositories/products';
import { deleteProductAction } from './actions';
import { ProductForm } from './product-form';

export function ProductList({ products }: { products: Product[] }) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);

  const visible = useMemo(
    () =>
      search.trim() === ''
        ? products
        : products.filter((product) => matchesSearch(product.name, search)),
    [products, search],
  );

  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar un pan…"
        aria-label="Buscar producto"
        className="min-h-touch w-full min-w-0 rounded-2xl border border-line bg-surface px-4 text-base text-ink"
      />

      {visible.length === 0 ? (
        <p className="glass rounded-card p-8 text-center text-ink-muted">
          {products.length === 0
            ? 'Todavía no hay panes. Crea el primero con el formulario de arriba.'
            : `No encontramos panes que coincidan con “${search}”.`}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((product) => (
            <li key={product.id} className="glass rounded-card p-3 shadow-soft">
              <div className="flex items-center gap-3">
                <ProductImage
                  src={product.imageUrl}
                  alt=""
                  className="size-14 shrink-0 rounded-xl"
                />

                <p className="min-w-0 flex-1 truncate font-bold text-ink">{product.name}</p>

                <button
                  type="button"
                  onClick={() => setEditing(editing?.id === product.id ? null : product)}
                  className="pressable min-h-touch shrink-0 rounded-xl border border-line-strong px-3 text-sm font-bold text-secondary"
                >
                  {editing?.id === product.id ? 'Cerrar' : 'Editar'}
                </button>

                <DeleteProductButton productId={product.id} name={product.name} />
              </div>

              {editing?.id === product.id ? (
                <div className="mt-4 border-t border-line pt-4">
                  <ProductForm product={product} onSaved={() => setEditing(null)} />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm text-ink-muted" aria-live="polite">
        {visible.length} {visible.length === 1 ? 'pan' : 'panes'}
      </p>
    </div>
  );
}

function DeleteSubmit() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="pressable min-h-touch rounded-xl bg-danger px-3 text-sm font-bold text-white disabled:opacity-60"
    >
      {pending ? '…' : 'Sí, eliminar'}
    </button>
  );
}

function DeleteProductButton({ productId, name }: { productId: string; name: string }) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction] = useActionState<ActionResult<null> | null, FormData>(
    deleteProductAction,
    null,
  );

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Eliminar ${name}`}
        className="pressable min-h-touch shrink-0 rounded-xl border border-danger/40 px-3 text-sm font-bold text-danger"
      >
        Eliminar
      </button>
    );
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <form action={formAction} className="flex items-center gap-1.5">
        <input type="hidden" name="id" value={productId} />
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="min-h-touch px-2 text-sm text-ink-muted"
        >
          No
        </button>
        <DeleteSubmit />
      </form>

      {state?.ok === false ? (
        <p role="alert" className="text-xs text-danger">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
