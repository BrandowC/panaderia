'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhotoPicker } from '@/components/ui/photo-picker';
import type { ActionResult } from '@/lib/errors/app-error';
import type { Product } from '@/server/repositories/products';
import { createProductAction, updateProductAction } from './actions';

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" isLoading={pending} className="w-full">
      {isEdit ? 'Guardar cambios' : 'Agregar pan'}
    </Button>
  );
}

interface ProductFormProps {
  product?: Product;
  onSaved?: () => void;
}

export function ProductForm({ product, onSaved }: ProductFormProps) {
  const isEdit = product !== undefined;

  const [state, formAction] = useActionState<ActionResult<Product> | null, FormData>(
    isEdit ? updateProductAction : createProductAction,
    null,
  );

  useEffect(() => {
    if (state?.ok === true && isEdit) {
      onSaved?.();
    }
  }, [state, isEdit, onSaved]);

  /*
   * Al crear, cambiar la `key` remonta los campos vacios. Evita reiniciar el
   * estado desde un efecto, que provoca renders en cascada.
   */
  const resetKey = !isEdit && state?.ok === true ? state.data.id : 'nuevo';

  return (
    <>
      <ProductFormFields
        key={resetKey}
        product={product}
        isEdit={isEdit}
        action={formAction}
        errorMessage={state?.ok === false ? state.message : null}
      />

      {!isEdit && state?.ok === true ? (
        <p role="status" className="mt-3 text-sm font-bold text-ok">
          Se agregó “{state.data.name}”.
        </p>
      ) : null}
    </>
  );
}

function ProductFormFields({
  product,
  isEdit,
  action,
  errorMessage,
}: {
  product?: Product;
  isEdit: boolean;
  action: (formData: FormData) => void;
  errorMessage: string | null;
}) {
  const [photo, setPhoto] = useState<string | null>(product?.imageUrl ?? null);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <input type="hidden" name="imageUrl" value={photo ?? ''} />

      <PhotoPicker label="Foto del pan" bucket="product-photos" value={photo} onChange={setPhoto} />

      <Input
        label="Nombre del pan"
        name="name"
        defaultValue={product?.name}
        required
        maxLength={80}
        autoComplete="off"
      />

      <Input
        label="Orden en la lista"
        name="sortOrder"
        type="number"
        inputMode="numeric"
        min={0}
        max={9999}
        defaultValue={product?.sortOrder ?? 0}
        hint="Los números menores aparecen primero."
      />

      {errorMessage ? (
        <p role="alert" className="text-sm font-bold text-danger">
          {errorMessage}
        </p>
      ) : null}

      <SubmitButton isEdit={isEdit} />
    </form>
  );
}
