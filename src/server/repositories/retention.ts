import 'server-only';

import { AppError } from '@/lib/errors/app-error';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * Borra los conteos finalizados hace mas de `days` dias. Usa service_role
 * porque lo invoca un cron sin sesion de usuario, y por eso vive en la capa
 * de servidor y no en una ruta.
 */
export async function purgeOldReports(days: number): Promise<number> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc('purge_old_reports', { p_days: days });

  if (error) {
    throw new AppError('UNEXPECTED', { cause: error });
  }

  return typeof data === 'number' ? data : 0;
}
