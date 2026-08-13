import type { PublicReport } from '@/server/reports/public-report';

const WIDTH = 1200;
const ROW_HEIGHT = 64;
const TABLE_TOP = 430;
const FOOTER_HEIGHT = 210;

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

/** Recorta para que un nombre largo no se salga del ancho de la columna. */
function clamp(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export interface ImageContext {
  report: PublicReport;
  dateLabel: string;
  timeLabel: string;
}

/** Exportada para poder verificar el contenido sin depender de canvas. */
export function buildReportSvg({ report, dateLabel, timeLabel }: ImageContext): string {
  const rows = report.items
    .map((item, index) => {
      const y = TABLE_TOP + 40 + index * ROW_HEIGHT;
      return `
        <rect x="80" y="${y - 30}" width="1040" height="50" rx="16" fill="#FBF6EB" stroke="#EEE1C9"/>
        <text x="108" y="${y + 3}" font-size="23" font-weight="700" fill="#2C211B">${escapeXml(
          clamp(item.name, 46),
        )}</text>
        <text x="1092" y="${y + 3}" font-size="23" font-weight="800" text-anchor="end" fill="#B97708">${
          item.quantity
        }</text>`;
    })
    .join('');

  const tableHeight = Math.max(report.items.length * ROW_HEIGHT, ROW_HEIGHT);
  const footerY = TABLE_TOP + 40 + tableHeight + 20;
  const height = footerY + FOOTER_HEIGHT;

  const notes = clamp(report.notes ?? 'Sin observaciones.', 110);
  const signature = report.signature ?? report.performedBy;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#FFFAF2"/>
      <stop offset="100%" stop-color="#FFF2DC"/>
    </linearGradient>
    <linearGradient id="brand" x1="0" x2="1">
      <stop offset="0%" stop-color="#DE8600"/>
      <stop offset="100%" stop-color="#7A4520"/>
    </linearGradient>
  </defs>

  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect x="40" y="38" width="1120" height="${height - 76}" rx="32" fill="#FFFFFF" stroke="#EAD9C7" stroke-width="2"/>

  <rect x="80" y="78" width="78" height="78" rx="24" fill="url(#brand)"/>
  <path d="M100 128c0-11 8-19 19-19s19 8 19 19v3a5 5 0 0 1-5 5h-28a5 5 0 0 1-5-5v-3Z" fill="#FFFFFF" opacity="0.95"/>

  <text x="186" y="116" font-size="38" font-weight="800" fill="#2C211B">${escapeXml(
    clamp(report.bakeryName, 30),
  )}</text>
  <text x="186" y="148" font-size="18" fill="#7A6A62">Inventario diario</text>

  <text x="1120" y="110" text-anchor="end" font-size="30" font-weight="800" fill="#2C211B">${escapeXml(
    report.reportNumber,
  )}</text>
  <text x="1120" y="140" text-anchor="end" font-size="18" fill="#7A6A62">${escapeXml(dateLabel)}</text>
  <text x="1120" y="166" text-anchor="end" font-size="18" fill="#7A6A62">${escapeXml(
    timeLabel,
  )} (Colombia)</text>

  <rect x="80" y="206" width="330" height="104" rx="22" fill="#FBF6EB" stroke="#EAD9C7"/>
  <rect x="435" y="206" width="330" height="104" rx="22" fill="#FBF6EB" stroke="#EAD9C7"/>
  <rect x="790" y="206" width="330" height="104" rx="22" fill="#FBF6EB" stroke="#EAD9C7"/>

  <text x="245" y="252" text-anchor="middle" font-size="40" font-weight="800" fill="#2C211B">${
    report.totalReferences
  }</text>
  <text x="245" y="284" text-anchor="middle" font-size="17" fill="#7A6A62">Referencias</text>

  <text x="600" y="252" text-anchor="middle" font-size="40" font-weight="800" fill="#2C211B">${
    report.totalUnits
  }</text>
  <text x="600" y="284" text-anchor="middle" font-size="17" fill="#7A6A62">Unidades</text>

  <text x="955" y="250" text-anchor="middle" font-size="30" font-weight="800" fill="#16803C">Finalizado</text>
  <text x="955" y="284" text-anchor="middle" font-size="17" fill="#7A6A62">Estado</text>

  <text x="80" y="360" font-size="18" font-weight="800" fill="#7A6A62">RESPONSABLE</text>
  <text x="80" y="392" font-size="24" font-weight="700" fill="#2C211B">${escapeXml(
    clamp(report.performedBy, 40),
  )}</text>

  <text x="80" y="${TABLE_TOP}" font-size="17" font-weight="800" fill="#7A6A62">PRODUCTO</text>
  <text x="1092" y="${TABLE_TOP}" text-anchor="end" font-size="17" font-weight="800" fill="#7A6A62">CANTIDAD</text>

  ${rows}

  <rect x="80" y="${footerY}" width="1040" height="96" rx="20" fill="#FBF6EB" stroke="#EAD9C7"/>
  <text x="108" y="${footerY + 34}" font-size="19" font-weight="800" fill="#2C211B">Observaciones</text>
  <text x="108" y="${footerY + 68}" font-size="18" fill="#7A6A62">${escapeXml(notes)}</text>

  <line x1="400" y1="${footerY + 158}" x2="800" y2="${footerY + 158}" stroke="#B3906A" stroke-width="2"/>
  <text x="600" y="${footerY + 150}" text-anchor="middle" font-size="22" font-weight="700" fill="#2C211B">${escapeXml(
    clamp(signature, 40),
  )}</text>
  <text x="600" y="${footerY + 182}" text-anchor="middle" font-size="15" fill="#7A6A62">Firma de quien realizó el conteo</text>
</svg>`;
}

/**
 * Dibuja el SVG en un canvas y devuelve un PNG. Se genera en el navegador
 * porque un render en servidor exigiria un navegador headless que el plan
 * gratuito de despliegue no ofrece.
 */
export async function buildReportImage(context: ImageContext): Promise<Blob> {
  const svg = buildReportSvg(context);
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));

  try {
    const image = new Image();
    image.decoding = 'async';

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('No se pudo dibujar el reporte'));
      image.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;

    const context2d = canvas.getContext('2d');
    if (!context2d) {
      throw new Error('El navegador no permite generar la imagen');
    }
    context2d.drawImage(image, 0, 0);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo crear el PNG'))),
        'image/png',
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
