import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CreateUserInput, UpdateUserInput } from '@/features/users/schemas';
import { AppError } from '@/lib/errors/app-error';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export interface StaffMember {
  id: string;
  displayName: string;
  isActive: boolean;
  photoUrl: string | null;
}

interface ProfileRow {
  id: string;
  display_name: string;
  is_active: boolean;
  photo_url: string | null;
}

function toStaff(row: ProfileRow): StaffMember {
  return {
    id: row.id,
    displayName: row.display_name,
    isActive: row.is_active,
    photoUrl: row.photo_url,
  };
}

export async function listStaff(supabase: SupabaseClient): Promise<StaffMember[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, is_active, photo_url')
    .eq('is_active', true)
    .order('display_name');

  if (error) {
    throw new AppError('UNEXPECTED', { cause: error });
  }

  return (data as ProfileRow[]).map(toStaff);
}

/**
 * Crear cuentas exige service_role, por eso vive en la capa de servidor y nunca
 * en `features`. Quien llame debe haber verificado antes el rol de administrador.
 */
export async function createAccount(input: CreateUserInput): Promise<{ id: string }> {
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { display_name: input.displayName },
  });

  if (error || !data.user) {
    const alreadyExists = /already|registered|exists/i.test(error?.message ?? '');
    throw new AppError(alreadyExists ? 'CONFLICT' : 'UNEXPECTED', {
      userMessage: alreadyExists
        ? 'Ya existe una cuenta con ese correo.'
        : 'No se pudo crear el usuario.',
      cause: error,
    });
  }

  await admin.from('profiles').update({ photo_url: input.photoUrl }).eq('id', data.user.id);

  return { id: data.user.id };
}

export async function updateAccount(input: UpdateUserInput): Promise<void> {
  const admin = createSupabaseAdminClient();

  const { error } = await admin
    .from('profiles')
    .update({
      display_name: input.displayName,
      photo_url: input.photoUrl,
    })
    .eq('id', input.userId);

  if (error) {
    throw new AppError('UNEXPECTED', { cause: error });
  }

  // La contraseña solo se toca cuando el administrador escribio una nueva.
  if (input.password !== null) {
    const { error: passwordError } = await admin.auth.admin.updateUserById(input.userId, {
      password: input.password,
    });

    if (passwordError) {
      throw new AppError('UNEXPECTED', {
        userMessage: 'Se guardaron los datos, pero no se pudo cambiar la contraseña.',
        cause: passwordError,
      });
    }
  }
}

/**
 * Borra la cuenta si el empleado nunca hizo un conteo. Si ya firmó reportes, la
 * base la oculta en lugar de borrarla para no dejar reportes sin responsable.
 */
export async function deleteAccount(supabase: SupabaseClient, userId: string): Promise<void> {
  const { data, error } = await supabase.rpc('delete_user_account', { p_user_id: userId });

  if (error) {
    throw new AppError('FORBIDDEN', {
      userMessage: 'No se pudo eliminar el usuario.',
      cause: error,
    });
  }

  // Si el perfil se borro del todo, la credencial de acceso tambien debe irse.
  if (data === 'DELETED') {
    const admin = createSupabaseAdminClient();
    await admin.auth.admin.deleteUser(userId);
  }
}
