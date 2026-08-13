import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { readClientEnv } from '@/lib/env/client';

/**
 * Cliente de servidor ligado a las cookies de la peticion. Sigue usando la clave
 * anonima, por lo que RLS continua aplicandose: es la capa de defensa real.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const env = readClientEnv();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Los Server Components no pueden escribir cookies; el middleware
          // ya renovo la sesion en esa misma peticion.
        }
      },
    },
  });
}
