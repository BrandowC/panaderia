'use client';

import { useState, useSyncExternalStore } from 'react';
import type { PublicReport } from '@/server/reports/public-report';
import { buildReportImage } from './report-image';

interface ShareBarProps {
  report: PublicReport;
  dateLabel: string;
  timeLabel: string;
  fileName: string;
}

/** Valores del navegador que no existen en el servidor; nunca cambian tras montar. */
const noopSubscribe = () => () => {};

function isMobile(): boolean {
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent);
}

function download(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export function ShareBar({ report, dateLabel, timeLabel, fileName }: ShareBarProps) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const url = useSyncExternalStore(
    noopSubscribe,
    () => window.location.href,
    () => '',
  );

  const message = `${report.bakeryName} — Reporte ${report.reportNumber}: ${report.totalUnits} unidades. ${url}`;

  async function getImage(): Promise<Blob> {
    // La imagen guardada al finalizar se reutiliza; solo se dibuja si falta.
    return report.imageUrl
      ? await fetch(report.imageUrl).then((response) => response.blob())
      : await buildReportImage({ report, dateLabel, timeLabel });
  }

  /** En el celular el selector del sistema permite elegir el contacto y envía la imagen. */
  async function shareOnPhone() {
    const blob = await getImage();
    const file = new File([blob], fileName, { type: 'image/png' });

    if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text: message });
      return;
    }

    if (typeof navigator.share === 'function') {
      await navigator.share({ text: message, url });
      return;
    }

    download(blob, fileName);
    setNote('Se descargó la imagen para que la envíes.');
  }

  /**
   * En computador se abre WhatsApp Web. No acepta archivos por enlace, asi que
   * la imagen se descarga y el usuario la arrastra al chat.
   */
  async function shareOnDesktop() {
    const blob = await getImage();
    download(blob, fileName);

    window.open(`https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
    setNote('Se descargó la imagen. Arrástrala al chat de WhatsApp Web.');
  }

  async function handleShare() {
    setBusy(true);
    setNote(null);

    try {
      await (isMobile() ? shareOnPhone() : shareOnDesktop());
    } catch {
      // Cancelar el selector del sistema no es un error que deba mostrarse.
      setNote(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="no-print mt-4" aria-label="Compartir reporte">
      <button
        type="button"
        onClick={handleShare}
        disabled={busy}
        className="pressable min-h-14 w-full rounded-2xl bg-linear-135 from-brand to-brand-soft text-base font-extrabold text-on-brand shadow-brand disabled:opacity-60"
      >
        {busy ? 'Preparando imagen…' : 'Compartir por WhatsApp'}
      </button>

      <p aria-live="polite" className="mt-2 text-center text-sm text-ink-muted">
        {note ?? ''}
      </p>
    </section>
  );
}
