import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { readServerEnv } from '@/lib/env/server';

/**
 * PELIGRO: este cliente usa service_role y OMITE por completo las politicas RLS.
 * Usalo solo para operaciones que un administrador ya autorizo en el servidor
 * (crear usuarios, escribir auditoria). Nunca lo importes desde componentes.
 * `server-only` hace fallar la compilacion si llega al navegador.
 */
export function createSupabaseAdminClient() {
  const env = readServerEnv();

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
