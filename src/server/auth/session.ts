import 'server-only';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
}

/**
 * Devuelve el usuario o null. Usa getUser(), que valida el token contra el
 * servidor de Supabase; getSession() lee la cookie sin verificarla y es
 * manipulable desde el navegador.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, is_active')
    .eq('id', user.id)
    .maybeSingle();

  // Una cuenta desactivada conserva credenciales validas pero pierde el acceso.
  if (!profile || profile.is_active !== true) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? '',
    displayName: profile.display_name,
  };
}

/** Exige sesion valida. Redirige al login si no la hay. */
export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}
