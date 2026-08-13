import type { Metadata } from 'next';
import { ReportIcon } from '@/components/shell/nav-icons';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { RevokeButton } from '@/features/reports/revoke-button';
import { formatBogotaDateTime } from '@/lib/dates/bogota';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/server/auth/session';

export const metadata: Metadata = {
  title: 'Reportes | Inventario de Panadería',
};

interface HistoryRow {
  id: string;
  finalized_at: string | null;
  notes: string | null;
  public_reports: { id: string; report_number: string; is_revoked: boolean }[] | null;
}

export default async function HistoryPage() {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  // RLS decide el alcance: el empleado ve los suyos, el administrador todos.
  const { data } = await supabase
    .from('inventory_sessions')
    .select('id, finalized_at, notes, public_reports(id, report_number, is_revoked)')
    .eq('status', 'FINALIZED')
    .order('finalized_at', { ascending: false })
    .limit(50);

  const sessions = (data ?? []) as HistoryRow[];

  return (
    <div className="flex flex-col gap-5">
      <header className="rise-in">
        <p className="text-xs font-extrabold uppercase tracking-widest text-brand-ink">Historial</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Reportes</h1>
        <p className="text-sm text-ink-muted">Conteos finalizados de la panadería.</p>
      </header>

      {sessions.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <span
              className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-bg-tint text-brand-ink"
              aria-hidden="true"
            >
              <ReportIcon />
            </span>
            <CardTitle>Todavía no hay reportes</CardTitle>
            <CardDescription className="mt-1">
              Cuando finalices un conteo aparecerá aquí.
            </CardDescription>
          </div>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {sessions.map((session) => {
            const report = session.public_reports?.[0];

            return (
              <li key={session.id} className="glass rounded-card p-4 shadow-soft">
                <div className="flex items-center gap-3">
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-xl bg-bg-tint text-brand-ink"
                    aria-hidden="true"
                  >
                    <ReportIcon />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-sm font-extrabold text-ink">
                      {report?.report_number ?? 'Sin reporte'}
                    </p>
                    <p className="truncate text-sm text-ink-muted">
                      {session.finalized_at
                        ? formatBogotaDateTime(new Date(session.finalized_at))
                        : 'Sin fecha'}
                    </p>
                  </div>

                  {report?.is_revoked === true ? (
                    <span className="shrink-0 rounded-lg border border-line bg-bg-tint px-2.5 py-1.5 text-xs font-bold text-ink-muted">
                      Revocado
                    </span>
                  ) : report ? (
                    <RevokeButton reportId={report.id} />
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
