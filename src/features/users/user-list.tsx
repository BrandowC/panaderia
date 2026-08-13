'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import type { ActionResult } from '@/lib/errors/app-error';
import type { StaffMember } from '@/server/repositories/users';
import { deleteUserAction } from './actions';
import { UserForm } from './user-form';

export function UserList({
  staff,
  currentUserId,
}: {
  staff: StaffMember[];
  currentUserId: string;
}) {
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <ul className="flex flex-col gap-2">
      {staff.map((member) => {
        const isSelf = member.id === currentUserId;

        return (
          <li key={member.id} className="glass rounded-card p-3 shadow-soft">
            <div className="flex items-center gap-3">
              <Avatar member={member} />

              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-ink">{member.displayName}</p>
                {isSelf ? <p className="truncate text-sm text-ink-muted">Tu cuenta</p> : null}
              </div>

              <button
                type="button"
                onClick={() => setEditing(editing === member.id ? null : member.id)}
                className="pressable min-h-touch shrink-0 rounded-xl border border-line-strong px-3 text-sm font-bold text-secondary"
              >
                {editing === member.id ? 'Cerrar' : 'Editar'}
              </button>

              {/* Nadie puede eliminarse a si mismo: dejaria la panaderia sin acceso. */}
              {isSelf ? null : <DeleteUserButton userId={member.id} name={member.displayName} />}
            </div>

            {editing === member.id ? (
              <div className="mt-4 border-t border-line pt-4">
                <UserForm user={member} onSaved={() => setEditing(null)} />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function Avatar({ member }: { member: StaffMember }) {
  if (member.photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- la URL viene de Supabase Storage
      <img
        src={member.photoUrl}
        alt=""
        className="size-12 shrink-0 rounded-full border border-line object-cover"
      />
    );
  }

  return (
    <span
      className="grid size-12 shrink-0 place-items-center rounded-full bg-linear-135 from-secondary to-brand text-base font-extrabold text-white"
      aria-hidden="true"
    >
      {member.displayName.charAt(0).toUpperCase()}
    </span>
  );
}

function DeleteSubmit() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="pressable min-h-touch rounded-xl bg-danger px-3 text-sm font-bold text-white disabled:opacity-60"
    >
      {pending ? '…' : 'Sí, eliminar'}
    </button>
  );
}

function DeleteUserButton({ userId, name }: { userId: string; name: string }) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction] = useActionState<ActionResult<null> | null, FormData>(
    deleteUserAction,
    null,
  );

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Eliminar a ${name}`}
        className="pressable min-h-touch shrink-0 rounded-xl border border-danger/40 px-3 text-sm font-bold text-danger"
      >
        Eliminar
      </button>
    );
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <form action={formAction} className="flex items-center gap-1.5">
        <input type="hidden" name="userId" value={userId} />
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="min-h-touch px-2 text-sm text-ink-muted"
        >
          No
        </button>
        <DeleteSubmit />
      </form>

      {state?.ok === false ? (
        <p role="alert" className="text-xs text-danger">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
