import 'server-only';

import { AppError } from '@/lib/errors/app-error';
import { readClientEnv } from '@/lib/env/client';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const BUCKET = 'signatures';
const PREFIX = 'data:image/png;base64,';

/**
 * Guarda el trazo de la firma como PNG. Se almacena en Storage y no en la tabla
 * porque un data URL ocupa cientos de kilobytes por conteo.
 */
export async function uploadSignature(sessionId: string, dataUrl: string): Promise<string> {
  if (!dataUrl.startsWith(PREFIX)) {
    throw new AppError('VALIDATION', { userMessage: 'La firma no es válida.' });
  }

  const bytes = Buffer.from(dataUrl.slice(PREFIX.length), 'base64');
  const supabase = await createSupabaseServerClient();
  const path = `${sessionId}.png`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: 'image/png',
    cacheControl: '31536000',
    upsert: true,
  });

  if (error) {
    throw new AppError('UNEXPECTED', {
      userMessage: 'No se pudo guardar la firma.',
      cause: error,
    });
  }

  const env = readClientEnv();
  return `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}
