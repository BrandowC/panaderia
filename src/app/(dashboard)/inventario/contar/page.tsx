import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CountScreen } from '@/features/inventory/count-screen';
import { formatBogotaLongDate } from '@/lib/dates/bogota';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/server/auth/session';
import { listStaff } from '@/server/repositories/users';
import {
  createSessionWithSnapshot,
  findDraftSession,
  listSessionItems,
} from '@/server/repositories/inventory';

export const metadata: Metadata = {
  title: 'Contar panes | Inventario de Panadería',
};

/**
 * Entrada unica al conteo: recupera el borrador abierto o crea uno nuevo.
 * Asi el empleado nunca ve dos conteos ni pierde el que tenia en curso.
 */
export default async function CountPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  let session = await findDraftSession(supabase, user.id);

  if (!session) {
    try {
      session = await createSessionWithSnapshot(supabase, user.id);
    } catch {
      redirect('/inventario?sin-productos=1');
    }
  }

  const [items, staff] = await Promise.all([
    listSessionItems(supabase, session.id),
    listStaff(supabase),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <header className="rise-in">
        <p className="text-xs font-extrabold uppercase tracking-widest text-brand-ink">
          Conteo diario
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          Inventario de hoy
        </h1>
        <p className="text-sm text-ink-muted">
          {formatBogotaLongDate(new Date())} · Los cambios se guardan solos.
        </p>
      </header>

      <CountScreen sessionId={session.id} items={items} staff={staff} currentUserId={user.id} />
    </div>
  );
}
