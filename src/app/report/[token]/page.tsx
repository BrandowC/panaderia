import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BrandMark } from '@/components/shell/brand-mark';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { ProductImage } from '@/components/ui/product-image';
import { ReportImageSaver } from '@/features/reports/report-image-saver';
import { ShareBar } from '@/features/reports/share-bar';
import { buildReportImageName, formatBogotaLongDate, formatBogotaTime } from '@/lib/dates/bogota';
import { getPublicReport } from '@/server/reports/public-report';

export const metadata: Metadata = {
  title: 'Reporte de inventario',
  // Un enlace compartido no debe terminar indexado por un buscador.
  robots: { index: false, follow: false },
};

export default async function PublicReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const report = await getPublicReport(token);

  // Misma respuesta para token inexistente, invalido o revocado: no se filtra
  // cual de los tres casos ocurrio.
  if (!report) {
    notFound();
  }

  const generatedAt = new Date(report.generatedAt);

  return (
    <main className="mx-auto w-full max-w-2xl px-3 py-5 sm:px-5 print:max-w-none print:px-0 print:py-0">
      <div className="no-print mb-3 flex justify-end">
        <ThemeToggle />
      </div>

      <article className="glass-strong rounded-panel p-5 shadow-float sm:p-7 print:rounded-none print:border-0 print:bg-white print:shadow-none">
        <header className="flex flex-col gap-4 border-b-2 border-secondary pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark className="size-13" />
            <div className="min-w-0">
              <h1 className="truncate text-xl font-extrabold text-ink sm:text-2xl">
                {report.bakeryName}
              </h1>
              <p className="text-sm text-ink-muted">Reporte de conteo</p>
            </div>
          </div>

          <div className="shrink-0 sm:text-right">
            <strong className="block font-mono text-base font-extrabold text-ink">
              {report.reportNumber}
            </strong>
            <p className="text-sm text-ink-muted">{formatBogotaLongDate(generatedAt)}</p>
            <p className="text-sm text-ink-muted">{formatBogotaTime(generatedAt)} (Colombia)</p>
            <p className="text-sm text-ink-muted">Responsable: {report.performedBy}</p>
          </div>
        </header>

        <div className="my-5 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-bg-tint p-3 text-center">
            <strong className="block text-xl font-extrabold tabular-nums text-ink sm:text-2xl">
              {report.totalReferences}
            </strong>
            <span className="text-xs text-ink-muted">Referencias</span>
          </div>
          <div className="rounded-xl bg-bg-tint p-3 text-center">
            <strong className="block text-xl font-extrabold tabular-nums text-ink sm:text-2xl">
              {report.totalUnits}
            </strong>
            <span className="text-xs text-ink-muted">Unidades</span>
          </div>
          <div className="rounded-xl bg-bg-tint p-3 text-center">
            <strong className="block text-base font-extrabold text-ok sm:text-lg">
              Finalizado
            </strong>
            <span className="text-xs text-ink-muted">Estado</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Productos contados y sus cantidades</caption>
            <thead>
              <tr className="border-b border-line text-left">
                <th
                  scope="col"
                  className="py-2 text-xs font-extrabold uppercase tracking-wider text-ink-muted"
                >
                  Producto
                </th>
                <th
                  scope="col"
                  className="py-2 text-right text-xs font-extrabold uppercase tracking-wider text-ink-muted"
                >
                  Cantidad
                </th>
              </tr>
            </thead>
            <tbody>
              {report.items.map((item) => (
                <tr key={item.name} className="border-b border-line/50">
                  <td className="py-2.5 pr-2">
                    <span className="flex items-center gap-2">
                      <ProductImage
                        src={item.imageUrl}
                        alt=""
                        className="size-9 shrink-0 rounded-lg"
                      />
                      <span className="font-bold wrap-break-word text-ink">{item.name}</span>
                    </span>
                  </td>
                  <td className="py-2.5 text-right text-base font-extrabold tabular-nums text-brand-ink">
                    {item.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-line-strong">
                <th scope="row" className="py-3 text-left font-bold text-ink">
                  Total de referencias
                </th>
                <td className="py-3 text-right font-extrabold tabular-nums text-ink">
                  {report.totalReferences}
                </td>
              </tr>
              <tr>
                <th scope="row" className="pb-3 text-left font-bold text-ink">
                  Total de unidades
                </th>
                <td className="pb-3 text-right text-lg font-extrabold tabular-nums text-ink">
                  {report.totalUnits}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <section className="mt-4 border-t border-line pt-4">
          <h2 className="text-sm font-extrabold text-ink-muted">Observaciones</h2>
          <p className="mt-1 whitespace-pre-wrap text-sm text-ink">
            {report.notes ?? 'Sin observaciones.'}
          </p>
        </section>

        <section className="mt-5 border-t border-line pt-5">
          {report.signatureImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- la URL viene de Supabase Storage
            <img
              src={report.signatureImage}
              alt="Firma del responsable"
              // El trazo es negro: en modo noche se invierte para que se vea.
              className="mx-auto h-20 object-contain dark:invert"
            />
          ) : (
            <p className="pb-1 text-center font-semibold text-ink">{report.signature ?? ''}</p>
          )}

          <p className="mx-auto max-w-xs border-t border-line-strong pt-1 text-center text-sm font-semibold text-ink">
            {report.performedBy}
          </p>
          <p className="mt-1 text-center text-xs text-ink-muted">
            Firma de quien realizó el conteo
          </p>
        </section>
      </article>

      <ReportImageSaver
        report={report}
        sessionId={report.sessionId}
        dateLabel={formatBogotaLongDate(generatedAt)}
        timeLabel={formatBogotaTime(generatedAt)}
        fileName={buildReportImageName(generatedAt)}
      />

      <ShareBar
        report={report}
        dateLabel={formatBogotaLongDate(generatedAt)}
        timeLabel={formatBogotaTime(generatedAt)}
        fileName={buildReportImageName(generatedAt)}
      />
    </main>
  );
}
