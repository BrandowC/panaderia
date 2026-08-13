import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // El texto va en cacao, no en blanco: sobre el naranja de marca da 5.61:1 frente a 2.79:1.
  primary: 'bg-linear-135 from-brand to-brand-soft text-on-brand shadow-brand hover:brightness-105',
  secondary: 'bg-bg-tint text-secondary border border-line hover:bg-surface',
  ghost: 'bg-transparent text-ink-muted hover:bg-bg-tint',
  danger: 'bg-danger/10 text-danger border border-danger/30 hover:bg-danger/15',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'min-h-touch px-3 text-sm rounded-xl',
  md: 'min-h-touch px-4 text-base rounded-2xl',
  lg: 'min-h-14 px-6 text-lg rounded-2xl',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const isDisabled = disabled === true || isLoading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      className={cn(
        'pressable inline-flex items-center justify-center gap-2 font-bold leading-tight',
        'text-center wrap-break-word disabled:cursor-not-allowed disabled:opacity-60',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    >
      {isLoading ? 'Procesando...' : children}
    </button>
  );
}
