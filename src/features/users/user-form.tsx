'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhotoPicker } from '@/components/ui/photo-picker';
import type { ActionResult } from '@/lib/errors/app-error';
import type { StaffMember } from '@/server/repositories/users';
import { createUserAction, updateUserAction } from './actions';

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" isLoading={pending} className="w-full">
      {isEdit ? 'Guardar cambios' : 'Crear empleado'}
    </Button>
  );
}

interface UserFormProps {
  user?: StaffMember;
  onSaved?: () => void;
}

export function UserForm({ user, onSaved }: UserFormProps) {
  const isEdit = user !== undefined;

  const [createState, createFormAction] = useActionState<
    ActionResult<{ email: string }> | null,
    FormData
  >(createUserAction, null);

  const [updateState, updateFormAction] = useActionState<ActionResult<null> | null, FormData>(
    updateUserAction,
    null,
  );

  const state = isEdit ? updateState : createState;

  useEffect(() => {
    if (state?.ok === true && isEdit) {
      onSaved?.();
    }
  }, [state, isEdit, onSaved]);

  /*
   * Al crear una cuenta, cambiar la `key` remonta los campos vacios. Evita
   * reiniciar el estado desde un efecto, que provoca renders en cascada.
   */
  const resetKey = !isEdit && createState?.ok === true ? createState.data.email : 'nuevo';

  return (
    <>
      <UserFormFields
        key={resetKey}
        user={user}
        isEdit={isEdit}
        action={isEdit ? updateFormAction : createFormAction}
        errorMessage={state?.ok === false ? state.message : null}
      />

      {!isEdit && createState?.ok === true ? (
        <p role="status" className="mt-3 text-sm font-bold text-ok">
          Se creó la cuenta de {createState.data.email}.
        </p>
      ) : null}
    </>
  );
}

function UserFormFields({
  user,
  isEdit,
  action,
  errorMessage,
}: {
  user?: StaffMember;
  isEdit: boolean;
  action: (formData: FormData) => void;
  errorMessage: string | null;
}) {
  const [photo, setPhoto] = useState<string | null>(user?.photoUrl ?? null);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {user ? <input type="hidden" name="userId" value={user.id} /> : null}
      <input type="hidden" name="photoUrl" value={photo ?? ''} />

      <PhotoPicker
        label="Foto del empleado"
        bucket="user-photos"
        value={photo}
        onChange={setPhoto}
        shape="circle"
      />

      <Input
        label="Nombre completo"
        name="displayName"
        defaultValue={user?.displayName}
        required
        maxLength={80}
        autoComplete="off"
      />

      {isEdit ? null : (
        <Input
          label="Correo"
          name="email"
          type="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          autoComplete="off"
        />
      )}

      <Input
        label={isEdit ? 'Nueva contraseña' : 'Contraseña'}
        name="password"
        type="text"
        required={!isEdit}
        minLength={8}
        hint={
          isEdit
            ? 'Déjala vacía para no cambiarla.'
            : 'Mínimo 8 caracteres. Entrégasela al empleado.'
        }
        autoComplete="off"
      />

      {errorMessage ? (
        <p role="alert" className="text-sm font-bold text-danger">
          {errorMessage}
        </p>
      ) : null}

      <SubmitButton isEdit={isEdit} />
    </form>
  );
}
