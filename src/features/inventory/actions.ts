'use server';

import { revalidatePath } from 'next/cache';
import { actionFailure, actionSuccess, AppError, type ActionResult } from '@/lib/errors/app-error';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/server/auth/session';
import { recordAudit } from '@/server/repositories/audit';
import {
  createSessionWithSnapshot,
  findDraftSession,
  updateItemQuantity,
} from '@/server/repositories/inventory';
import { uploadSignature } from '@/server/repositories/signatures';
import { generatePublicToken, hashPublicToken } from '@/server/reports/token';
import { finalizeSchema, updateQuantitySchema } from './schemas';

export async function startInventoryAction(): Promise<ActionResult<{ sessionId: string }>> {
  try {
    const user = await requireUser();
    const supabase = await createSupabaseServerClient();

    // Recuperar el borrador en curso evita crear conteos duplicados.
    const existing = await findDraftSession(supabase, user.id);
    if (existing) {
      return actionSuccess({ sessionId: existing.id });
    }

    const session = await createSessionWithSnapshot(supabase, user.id);

    await recordAudit({
      actorId: user.id,
      action: 'INVENTORY_STARTED',
      entityType: 'inventory_session',
      entityId: session.id,
    });

    revalidatePath('/inventario');
    return actionSuccess({ sessionId: session.id });
  } catch (error) {
    return actionFailure(error);
  }
}

export async function updateQuantityAction(
  itemId: string,
  quantity: number,
): Promise<ActionResult<null>> {
  try {
    await requireUser();
    const parsed = updateQuantitySchema.safeParse({ itemId, quantity });

    if (!parsed.success) {
      throw new AppError('VALIDATION', {
        userMessage: parsed.error.issues[0]?.message ?? 'Cantidad invalida.',
      });
    }

    const supabase = await createSupabaseServerClient();
    await updateItemQuantity(supabase, parsed.data.itemId, parsed.data.quantity);

    return actionSuccess(null);
  } catch (error) {
    return actionFailure(error);
  }
}

export async function finalizeInventoryAction(
  _previous: ActionResult<{ token: string; reportNumber: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ token: string; reportNumber: string }>> {
  try {
    const user = await requireUser();
    const parsed = finalizeSchema.safeParse({
      sessionId: formData.get('sessionId') ?? '',
      responsibleId: formData.get('responsibleId') ?? '',
      signatureImage: formData.get('signatureImage') ?? '',
      notes: formData.get('notes') ?? '',
    });

    if (!parsed.success) {
      throw new AppError('VALIDATION', {
        userMessage: parsed.error.issues[0]?.message ?? 'Datos invalidos.',
      });
    }

    const token = generatePublicToken();
    const supabase = await createSupabaseServerClient();

    // La firma va a Storage: guardar el data URL en la tabla la haria crecer
    // varios cientos de kilobytes por conteo.
    const signatureUrl = await uploadSignature(parsed.data.sessionId, parsed.data.signatureImage);

    // La finalizacion y la creacion del reporte ocurren en una sola transaccion
    // dentro de Postgres: no puede quedar un conteo cerrado sin reporte.
    const { data, error } = await supabase.rpc('finalize_inventory_session', {
      p_session_id: parsed.data.sessionId,
      p_token_hash: hashPublicToken(token),
      p_notes: parsed.data.notes,
      p_responsible_id: parsed.data.responsibleId,
      p_signature: null,
      p_signature_image: signatureUrl,
    });

    if (error) {
      throw new AppError('CONFLICT', {
        userMessage: 'No se pudo finalizar el conteo. Revisa que tenga productos.',
        cause: error,
      });
    }

    const result = (data as { out_report_number: string; out_already_finalized: boolean }[])[0];

    if (!result) {
      throw new AppError('UNEXPECTED');
    }

    // Si ya estaba finalizado, el token nuevo no se guardo: no sirve para abrir el reporte.
    if (result.out_already_finalized) {
      throw new AppError('CONFLICT', {
        userMessage: 'Este conteo ya fue finalizado. Búscalo en el historial.',
      });
    }

    await recordAudit({
      actorId: user.id,
      action: 'INVENTORY_FINALIZED',
      entityType: 'inventory_session',
      entityId: parsed.data.sessionId,
      metadata: { reportNumber: result.out_report_number },
    });

    revalidatePath('/inventario');
    return actionSuccess({ token, reportNumber: result.out_report_number });
  } catch (error) {
    return actionFailure(error);
  }
}
