'use client';

import type { PublicReport } from '@/server/reports/public-report';
import { attachReportImageAction } from './actions';
import { buildReportImage } from './report-image';

interface SaveArgs {
  report: PublicReport;
  sessionId: string;
  dateLabel: string;
  timeLabel: string;
  fileName: string;
}

/**
 * Genera el PNG y lo guarda en Supabase. Un fallo aqui no debe romper la pagina:
 * el reporte ya existe y la imagen puede volver a generarse al compartir.
 */
export async function saveReportImage({
  report,
  sessionId,
  dateLabel,
  timeLabel,
  fileName,
}: SaveArgs): Promise<string | null> {
  try {
    const blob = await buildReportImage({ report, dateLabel, timeLabel });

    const body = new FormData();
    body.append('file', blob, fileName);
    body.append('bucket', 'report-images');

    const response = await fetch('/api/upload', { method: 'POST', body });
    const result = (await response.json()) as { url?: string };

    if (!response.ok || !result.url) {
      return null;
    }

    await attachReportImageAction(sessionId, result.url);
    return result.url;
  } catch {
    return null;
  }
}
