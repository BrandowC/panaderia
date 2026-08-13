import type { Metadata } from 'next';
import Link from 'next/link';
import { BreadIcon, CountIcon, ReportIcon, UsersIcon } from '@/components/shell/nav-icons';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { formatBogotaDateTime, formatBogotaLongDate } from '@/lib/dates/bogota';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/server/auth/session';
import { findDraftSession, listSessionItems } from '@/server/repositories/inventory';

export const metadata: Metadata = {
  title: 'Resumen | Inventario de Panadería',
};

interface LatestReportRow {
  finalized_at: string | null;
  signature: string | null;
  public_reports: { report_number: string }[] | null;
}

export default async function InventoryHomePage({
  searchParams,
}: {
  searchParams: Promise<{ 'sin-productos'?: string }>;
}) {
  const params = await searchParams;
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const [draft, productsResult, staffResult, reportsResult, latestResult] = await Promise.all([
    findDraftSession(supabase, user.id),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase
      .from('inventory_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'FINALIZED'),
    supabase
      .from('inventory_sessions')
      .select('finalized_at, signature, public_reports(report_number)')
      .eq('status', 'FINALIZED')
      .order('finalized_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const activeProducts = productsResult.count ?? 0;
  const activeStaff = staffResult.count ?? 0;
  const totalReports = reportsResult.count ?? 0;
  const latest = latestResult.data as LatestReportRow | null;

  const draftItems = draft ? await listSessionItems(supabase, draft.id) : [];
  const draftUnits = draftItems.reduce((sum, item) => sum + item.quantity, 0);
  const draftCounted = draftItems.filter((item) => item.quantity > 0).length;
  const progress =
    draftItems.length === 0 ? 0 : Math.round((draftCounted / draftItems.length) * 100);

  return (
    <div className="flex flex-col gap-5">
      <header className="rise-in">
        <p className="text-xs font-extrabold uppercase tracking-widest text-brand-ink">
          Panel principal
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          Hola, {user.displayName.split(' ')[0]}
        </h1>
        <p className="text-sm text-ink-muted">{formatBogotaLongDate(new Date())}</p>
      </header>

      {params['sin-productos'] === '1' ? (
        <p
          role="alert"
          className="rounded-card border border-danger/30 bg-danger/8 p-4 text-sm text-ink"
        >
          No hay panes en el catálogo todavía. Pide a la administración que los cree antes de
          contar.
        </p>
      ) : null}

      {/* Accion principal arriba del todo: es lo que se hace cada dia. */}
      <Card aura>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>{draft ? 'Conteo en curso' : 'Conteo de hoy'}</CardTitle>
            <CardDescription className="mt-1">
              {draft
                ? `${draftCounted} de ${draftItems.length} panes · ${draftUnits} unidades`
                : 'Registra las cantidades de cada pan elaborado.'}
            </CardDescription>
          </div>
          <span
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-bg-tint text-brand-ink"
            aria-hidden="true"
          >
            <CountIcon />
          </span>
        </div>

        {draft ? (
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-bg-tint"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Avance del conteo"
          >
            <div
              className="h-full rounded-full bg-linear-135 from-brand to-brand-soft transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : null}

        <Link
          href="/inventario/contar"
          className="pressable mt-4 inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-linear-135 from-brand to-brand-soft px-6 text-lg font-bold text-on-brand shadow-brand"
        >
          {draft ? 'Continuar conteo' : 'Iniciar conteo'}
        </Link>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricTile icon={<BreadIcon />} value={activeProducts} label="Panes" />
        <MetricTile icon={<ReportIcon />} value={totalReports} label="Reportes" />
        <MetricTile icon={<UsersIcon />} value={activeStaff} label="Empleados" />
      </div>

      <Card interactive>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>Último reporte</CardTitle>
            {latest?.public_reports?.[0] ? (
              <>
                <p className="mt-1 font-mono text-sm font-bold text-ink">
                  {latest.public_reports[0].report_number}
                </p>
                <CardDescription>
                  {latest.finalized_at
                    ? formatBogotaDateTime(new Date(latest.finalized_at))
                    : 'Sin fecha'}
                  {latest.signature ? ` · ${latest.signature}` : ''}
                </CardDescription>
              </>
            ) : (
              <CardDescription className="mt-1">
                Cuando finalices un conteo aparecerá aquí.
              </CardDescription>
            )}
          </div>

          <span
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-bg-tint text-brand-ink"
            aria-hidden="true"
          >
            <ReportIcon />
          </span>
        </div>

        <Link
          href="/historial"
          className="pressable mt-4 inline-flex min-h-touch items-center rounded-xl border border-line bg-bg-tint px-4 font-bold text-secondary"
        >
          Ver todos los reportes
        </Link>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <QuickLink href="/panes" icon={<BreadIcon />} title="Panes" hint="Crear y editar" />
        <QuickLink
          href="/empleados"
          icon={<UsersIcon />}
          title="Empleados"
          hint="Cuentas y accesos"
        />
      </div>
    </div>
  );
}

function MetricTile({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="glass flex flex-col items-center rounded-card p-3 text-center shadow-soft">
      <span
        className="grid size-9 place-items-center rounded-xl bg-bg-tint text-brand-ink"
        aria-hidden="true"
      >
        {icon}
      </span>
      <strong className="mt-2 text-xl font-extrabold tabular-nums text-ink">{value}</strong>
      <span className="text-xs text-ink-muted">{label}</span>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  hint,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <Link href={href} className="lift glass flex items-center gap-3 rounded-card p-4 shadow-soft">
      <span
        className="grid size-11 shrink-0 place-items-center rounded-xl bg-bg-tint text-brand-ink"
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="min-w-0">
        <strong className="block truncate font-bold text-ink">{title}</strong>
        <span className="block truncate text-sm text-ink-muted">{hint}</span>
      </span>
    </Link>
  );
}
