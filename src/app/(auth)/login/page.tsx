import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { BrandMark } from '@/components/shell/brand-mark';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { LoginForm } from '@/features/auth/login-form';
import { getCurrentUser } from '@/server/auth/session';

export const metadata: Metadata = {
  title: 'Iniciar sesión | Inventario de Panadería',
};

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect('/inventario');
  }

  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <section className="rise-in aura-card glass-strong w-full max-w-lg rounded-panel p-7 shadow-float sm:p-9">
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-glass px-3.5 py-2 text-xs font-extrabold uppercase tracking-widest text-brand-ink">
            <BrandMark className="size-5" />
            Acceso al sistema
          </span>

          <h1 className="mt-5 text-4xl font-extrabold leading-none tracking-tight text-ink sm:text-5xl">
            Bienvenido
          </h1>

          <p className="mt-3 mb-7 leading-relaxed text-ink-muted">
            Ingresa con la cuenta que te entregó la administración para registrar el conteo del día.
          </p>

          <LoginForm />

          <p className="mt-6 border-t border-dashed border-line pt-5 text-center text-sm text-ink-muted">
            ¿No tienes acceso? Solicítalo a la administración de la panadería.
          </p>
        </div>
      </section>
    </main>
  );
}
