export const BOGOTA_TIME_ZONE = 'America/Bogota';

const LOCALE = 'es-CO';

/**
 * Colombia no aplica horario de verano (UTC-5 fijo), pero el formateo se delega
 * siempre a Intl para no codificar ese desfase en la aplicacion.
 */
function partsInBogota(date: Date): Record<string, string> {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BOGOTA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const parts: Record<string, string> = {};
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== 'literal') {
      parts[part.type] = part.value;
    }
  }
  return parts;
}

function requirePart(parts: Record<string, string>, key: string): string {
  const value = parts[key];
  if (value === undefined) {
    throw new Error(`No se pudo obtener el componente de fecha "${key}" en ${BOGOTA_TIME_ZONE}`);
  }
  return value;
}

/** Fecha civil en Bogota como `YYYY-MM-DD`. */
export function formatBogotaDate(date: Date): string {
  const parts = partsInBogota(date);
  return `${requirePart(parts, 'year')}-${requirePart(parts, 'month')}-${requirePart(parts, 'day')}`;
}

/** Hora civil en Bogota como `HH:mm`. */
export function formatBogotaTime(date: Date): string {
  const parts = partsInBogota(date);
  return `${requirePart(parts, 'hour')}:${requirePart(parts, 'minute')}`;
}

/** Fecha y hora legibles para el usuario, por ejemplo `5/08/2026, 21:30`. */
export function formatBogotaDateTime(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: BOGOTA_TIME_ZONE,
    dateStyle: 'short',
    timeStyle: 'short',
    hourCycle: 'h23',
  }).format(date);
}

/** Fecha extensa para encabezados de reporte, por ejemplo `5 de agosto de 2026`. */
export function formatBogotaLongDate(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: BOGOTA_TIME_ZONE,
    dateStyle: 'long',
  }).format(date);
}

/**
 * Sufijo del PDF exigido por el proyecto: `AAAA-MM-DD_HH-mm` en hora de Bogota.
 * Nombre final esperado: `inventario-panaderia_<sufijo>.pdf`.
 */
export function buildReportFileStamp(date: Date): string {
  return `${formatBogotaDate(date)}_${formatBogotaTime(date).replace(':', '-')}`;
}

export function buildReportFileName(date: Date): string {
  return `inventario-panaderia_${buildReportFileStamp(date)}.pdf`;
}

/** Nombre del PNG del reporte, con la misma marca de tiempo que el PDF. */
export function buildReportImageName(date: Date): string {
  return `inventario-panaderia_${buildReportFileStamp(date)}.png`;
}
