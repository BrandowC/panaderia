'use client';

import { createBrowserClient } from '@supabase/ssr';
import { readClientEnv } from '@/lib/env/client';

/** Cliente del navegador: usa la clave anonima y queda sujeto a RLS. */
export function createSupabaseBrowserClient() {
  const env = readClientEnv();
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
