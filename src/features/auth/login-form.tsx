'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ActionResult } from '@/lib/errors/app-error';
import { loginAction } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" isLoading={pending} className="mt-2 w-full">
      Entrar
    </Button>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [state, formAction] = useActionState<ActionResult<null> | null, FormData>(
    loginAction,
    null,
  );

  useEffect(() => {
    if (state?.ok === true) {
      router.replace('/inventario');
    }
  }, [state, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <Input
        label="Correo electrónico"
        name="email"
        type="email"
        placeholder="correo@panaderia.com"
        autoComplete="username"
        inputMode="email"
        autoCapitalize="none"
        spellCheck={false}
        required
      />

      <div className="relative">
        <Input
          label="Contraseña"
          name="password"
          type={visible ? 'text' : 'password'}
          placeholder="Tu contraseña"
          autoComplete="current-password"
          className="pr-13"
          required
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          className="pressable absolute right-1 bottom-0 grid size-11 place-items-center rounded-xl text-ink-muted"
        >
          <EyeIcon crossed={visible} />
        </button>
      </div>

      {state?.ok === false ? (
        <p role="alert" className="text-sm font-bold text-danger">
          {state.message}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className="size-5"
      aria-hidden="true"
    >
      <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
      {crossed ? <path d="m4 20 16-16" /> : null}
    </svg>
  );
}
