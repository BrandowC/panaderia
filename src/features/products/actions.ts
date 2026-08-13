'use server';

import { revalidatePath } from 'next/cache';
import { actionFailure, actionSuccess, AppError, type ActionResult } from '@/lib/errors/app-error';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/server/auth/session';
import { recordAudit } from '@/server/repositories/audit';
import {
  createProduct,
  deleteProduct,
  updateProduct,
  type Product,
} from '@/server/repositories/products';
import { createProductSchema, productIdSchema, updateProductSchema } from './schemas';

function firstIssue(issues: { message: string }[]): string {
  return issues[0]?.message ?? 'Revisa los datos ingresados.';
}

function readForm(formData: FormData) {
  return {
    name: formData.get('name') ?? '',
    imageUrl: formData.get('imageUrl') ?? '',
    sortOrder: formData.get('sortOrder') ?? 0,
  };
}

export async function createProductAction(
  _previous: ActionResult<Product> | null,
  formData: FormData,
): Promise<ActionResult<Product>> {
  try {
    // La autorizacion se verifica en el servidor aunque la UI ya oculte el formulario.
    const actor = await requireUser();
    const parsed = createProductSchema.safeParse(readForm(formData));

    if (!parsed.success) {
      throw new AppError('VALIDATION', { userMessage: firstIssue(parsed.error.issues) });
    }

    const supabase = await createSupabaseServerClient();
    const product = await createProduct(supabase, parsed.data, actor.id);

    await recordAudit({
      actorId: actor.id,
      action: 'PRODUCT_CREATED',
      entityType: 'product',
      entityId: product.id,
      metadata: { name: product.name },
    });

    revalidatePath('/panes');
    return actionSuccess(product);
  } catch (error) {
    return actionFailure(error);
  }
}

export async function updateProductAction(
  _previous: ActionResult<Product> | null,
  formData: FormData,
): Promise<ActionResult<Product>> {
  try {
    const actor = await requireUser();
    const parsed = updateProductSchema.safeParse({
      ...readForm(formData),
      id: formData.get('id') ?? '',
    });

    if (!parsed.success) {
      throw new AppError('VALIDATION', { userMessage: firstIssue(parsed.error.issues) });
    }

    const supabase = await createSupabaseServerClient();
    const product = await updateProduct(supabase, parsed.data);

    await recordAudit({
      actorId: actor.id,
      action: 'PRODUCT_UPDATED',
      entityType: 'product',
      entityId: product.id,
      metadata: { name: product.name },
    });

    revalidatePath('/panes');
    return actionSuccess(product);
  } catch (error) {
    return actionFailure(error);
  }
}

export async function deleteProductAction(
  _previous: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  try {
    const actor = await requireUser();
    const parsed = productIdSchema.safeParse({ id: formData.get('id') ?? '' });

    if (!parsed.success) {
      throw new AppError('VALIDATION', { userMessage: firstIssue(parsed.error.issues) });
    }

    const supabase = await createSupabaseServerClient();
    await deleteProduct(supabase, parsed.data.id);

    await recordAudit({
      actorId: actor.id,
      action: 'PRODUCT_DELETED',
      entityType: 'product',
      entityId: parsed.data.id,
    });

    revalidatePath('/panes');
    return actionSuccess(null);
  } catch (error) {
    return actionFailure(error);
  }
}
