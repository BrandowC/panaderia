'use client';

import { useEffect, useRef } from 'react';
import type { PublicReport } from '@/server/reports/public-report';
import { saveReportImage } from './save-report-image';

interface ReportImageSaverProps {
  report: PublicReport;
  sessionId: string;
  dateLabel: string;
  timeLabel: string;
  fileName: string;
}

/**
 * Guarda la imagen la primera vez que se abre el reporte recien creado.
 * No dibuja nada: la pagina publica ya muestra el contenido. La generacion vive
 * en el navegador porque el render de SVG a PNG necesita canvas.
 */
export function ReportImageSaver(props: ReportImageSaverProps) {
  const started = useRef(false);

  useEffect(() => {
    if (started.current || props.report.imageUrl !== null) {
      return;
    }
    started.current = true;
    void saveReportImage(props);
  }, [props]);

  return null;
}
