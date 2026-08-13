'use server';

import { revalidatePath } from 'next/cache';
import { actionFailure, actionSuccess, AppError, type ActionResult } from '@/lib/errors/app-error';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/server/auth/session';
import { recordAudit } from '@/server/repositories/audit';
import { createAccount, deleteAccount, updateAccount } from '@/server/repositories/users';
import { createUserSchema, updateUserSchema, userIdSchema } from './schemas';

function firstIssue(issues: { message: string }[]): string {
  return issues[0]?.message ?? 'Revisa los datos ingresados.';
}

export async function createUserAction(
  _previous: ActionResult<{ email: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ email: string }>> {
  try {
    const actor = await requireUser();
    const parsed = createUserSchema.safeParse({
      displayName: formData.get('displayName') ?? '',
      email: formData.get('email') ?? '',
      password: formData.get('password') ?? '',
      photoUrl: formData.get('photoUrl') ?? '',
    });

    if (!parsed.success) {
      throw new AppError('VALIDATION', { userMessage: firstIssue(parsed.error.issues) });
    }

    const account = await createAccount(parsed.data);

    await recordAudit({
      actorId: actor.id,
      action: 'USER_CREATED',
      entityType: 'profile',
      entityId: account.id,
    });

    revalidatePath('/empleados');
    return actionSuccess({ email: parsed.data.email });
  } catch (error) {
    return actionFailure(error);
  }
}

export async function updateUserAction(
  _previous: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  try {
    const actor = await requireUser();
    const parsed = updateUserSchema.safeParse({
      userId: formData.get('userId') ?? '',
      displayName: formData.get('displayName') ?? '',
      photoUrl: formData.get('photoUrl') ?? '',
      password: formData.get('password') ?? '',
    });

    if (!parsed.success) {
      throw new AppError('VALIDATION', { userMessage: firstIssue(parsed.error.issues) });
    }

    await updateAccount(parsed.data);

    await recordAudit({
      actorId: actor.id,
      action: 'USER_UPDATED',
      entityType: 'profile',
      entityId: parsed.data.userId,
    });

    revalidatePath('/empleados');
    return actionSuccess(null);
  } catch (error) {
    return actionFailure(error);
  }
}

export async function deleteUserAction(
  _previous: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  try {
    const actor = await requireUser();
    const parsed = userIdSchema.safeParse({ userId: formData.get('userId') ?? '' });

    if (!parsed.success) {
      throw new AppError('VALIDATION', { userMessage: firstIssue(parsed.error.issues) });
    }

    if (parsed.data.userId === actor.id) {
      throw new AppError('FORBIDDEN', { userMessage: 'No puedes eliminar tu propia cuenta.' });
    }

    const supabase = await createSupabaseServerClient();
    await deleteAccount(supabase, parsed.data.userId);

    await recordAudit({
      actorId: actor.id,
      action: 'USER_DELETED',
      entityType: 'profile',
      entityId: parsed.data.userId,
    });

    revalidatePath('/empleados');
    return actionSuccess(null);
  } catch (error) {
    return actionFailure(error);
  }
}
