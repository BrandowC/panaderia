'use client';

import { useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  /** Obligatoria: la accesibilidad no puede depender solo del placeholder. */
  label: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, className, required, ...props }: InputProps) {
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-bold text-ink">
        {label}
        {required === true ? (
          <span className="ml-1 text-danger" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      {hint ? (
        <p id={hintId} className="text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}

      <input
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy === '' ? undefined : describedBy}
        className={cn(
          'min-h-touch w-full min-w-0 rounded-2xl border bg-surface px-4 text-base text-ink',
          'transition-[border-color,box-shadow] placeholder:text-ink-muted/55',
          'focus:outline-none focus-visible:outline-none',
          error
            ? 'border-danger focus:shadow-[0_0_0_4px_rgb(201_30_47/0.14)]'
            : 'border-line focus:border-brand focus:shadow-[0_0_0_4px_rgb(222_134_0/0.14)]',
          className,
        )}
        {...props}
      />

      {error ? (
        <p id={errorId} role="alert" className="text-sm font-bold text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
