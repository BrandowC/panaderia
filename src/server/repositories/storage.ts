import 'server-only';

import { AppError } from '@/lib/errors/app-error';
import { readClientEnv } from '@/lib/env/client';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type PhotoBucket = 'product-photos' | 'user-photos' | 'report-images';

/**
 * Sube con la sesion del usuario, no con service_role: las politicas de Storage
 * vuelven a comprobar que sea administrador activo.
 */
export async function uploadPhoto(bucket: PhotoBucket, path: string, file: File): Promise<string> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    cacheControl: '31536000',
    upsert: false,
  });

  if (error) {
    throw new AppError('UNEXPECTED', { cause: error });
  }

  const env = readClientEnv();
  return `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}
