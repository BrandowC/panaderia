'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { actionFailure, actionSuccess, AppError, type ActionResult } from '@/lib/errors/app-error';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { loginSchema } from './schemas';

export async function loginAction(
  _previous: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return actionFailure(
      new AppError('VALIDATION', { userMessage: firstIssue?.message ?? 'Revisa los datos.' }),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    /*
     * Mensaje deliberadamente ambiguo: distinguir "correo no existe" de
     * "contrasena incorrecta" permitiria enumerar las cuentas registradas.
     */
    return actionFailure(
      new AppError('UNAUTHENTICATED', {
        userMessage: 'Correo o contrasena incorrectos.',
        cause: error,
      }),
    );
  }

  revalidatePath('/', 'layout');
  return actionSuccess(null);
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
