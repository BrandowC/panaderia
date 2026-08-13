'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { actionFailure, actionSuccess, AppError, type ActionResult } from '@/lib/errors/app-error';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/server/auth/session';
import { recordAudit } from '@/server/repositories/audit';

const revokeSchema = z.object({
  reportId: z.uuid({ error: 'Identificador invalido.' }),
});

/**
 * Revocar no borra el reporte: lo marca como inaccesible. El historial se
 * conserva y el enlace compartido deja de resolver.
 */
export async function revokeReportAction(
  _previous: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  try {
    const actor = await requireUser();
    const parsed = revokeSchema.safeParse({ reportId: formData.get('reportId') ?? '' });

    if (!parsed.success) {
      throw new AppError('VALIDATION');
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('public_reports')
      .update({ is_revoked: true, revoked_at: new Date().toISOString(), revoked_by: actor.id })
      .eq('id', parsed.data.reportId)
      .select('report_number')
      .maybeSingle();

    if (error) {
      throw new AppError('UNEXPECTED', { cause: error });
    }

    if (!data) {
      throw new AppError('NOT_FOUND', { userMessage: 'No encontramos ese reporte.' });
    }

    await recordAudit({
      actorId: actor.id,
      action: 'REPORT_REVOKED',
      entityType: 'public_report',
      entityId: parsed.data.reportId,
      metadata: { reportNumber: data.report_number },
    });

    revalidatePath('/historial');
    return actionSuccess(null);
  } catch (error) {
    return actionFailure(error);
  }
}

const attachSchema = z.object({
  sessionId: z.uuid({ error: 'Identificador inválido.' }),
  imageUrl: z
    .url({ error: 'La imagen no es válida.' })
    .refine((value) => /^https?:\/\//i.test(value), { error: 'La imagen debe ser http(s).' }),
});

/**
 * Asocia el PNG generado en el navegador al reporte. La base solo la acepta una
 * vez, de modo que la imagen de un reporte compartido no se puede sustituir.
 */
export async function attachReportImageAction(
  sessionId: string,
  imageUrl: string,
): Promise<ActionResult<null>> {
  try {
    await requireUser();
    const parsed = attachSchema.safeParse({ sessionId, imageUrl });

    if (!parsed.success) {
      throw new AppError('VALIDATION');
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc('attach_report_image', {
      p_session_id: parsed.data.sessionId,
      p_image_url: parsed.data.imageUrl,
    });

    if (error) {
      throw new AppError('UNEXPECTED', { cause: error });
    }

    return actionSuccess(null);
  } catch (error) {
    return actionFailure(error);
  }
}
