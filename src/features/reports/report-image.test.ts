import { describe, expect, it } from 'vitest';
import { buildReportSvg } from './report-image';

const BASE = {
  report: {
    sessionId: '3f2504e0-4f89-11d3-9a0c-0305e82c3301',
    reportNumber: 'INV-20260806-001',
    generatedAt: '2026-08-06T18:30:00.000Z',
    performedBy: 'María Fernanda',
    signature: 'María Fernanda',
    signatureImage: null,
    notes: 'Faltó harina.',
    bakeryName: 'Panadería Dulce Hogar',
    logoUrl: null,
    imageUrl: null,
    items: [
      { name: 'Pan jirafa', imageUrl: null, quantity: 12 },
      { name: 'Cuca', imageUrl: null, quantity: 8 },
    ],
    totalReferences: 2,
    totalUnits: 20,
  },
  dateLabel: '6 de agosto de 2026',
  timeLabel: '13:30',
};

describe('buildReportSvg', () => {
  it('incluye los datos visibles del reporte', () => {
    const svg = buildReportSvg(BASE);
    expect(svg).toContain('INV-20260806-001');
    expect(svg).toContain('Panadería Dulce Hogar');
    expect(svg).toContain('Pan jirafa');
    expect(svg).toContain('6 de agosto de 2026');
    expect(svg).toContain('13:30');
  });

  it('muestra los totales', () => {
    const svg = buildReportSvg(BASE);
    expect(svg).toContain('>2<');
    expect(svg).toContain('>20<');
  });

  it('incluye la firma', () => {
    expect(buildReportSvg(BASE)).toContain('Firma de quien realizó el conteo');
  });

  it('escapa caracteres que romperian el XML', () => {
    const svg = buildReportSvg({
      ...BASE,
      report: { ...BASE.report, bakeryName: 'Pan & <script>alert(1)</script>' },
    });
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&amp;');
    expect(svg).toContain('&lt;script&gt;');
  });

  it('recorta nombres muy largos para que no desborden la columna', () => {
    const svg = buildReportSvg({
      ...BASE,
      report: {
        ...BASE.report,
        items: [{ name: 'x'.repeat(120), imageUrl: null, quantity: 1 }],
      },
    });
    expect(svg).toContain('…');
    expect(svg).not.toContain('x'.repeat(120));
  });

  it('crece en alto segun la cantidad de productos', () => {
    const readHeight = (svg: string) => Number(/height="(\d+)"/.exec(svg)?.[1] ?? 0);

    const pocos = readHeight(buildReportSvg(BASE));
    const muchos = readHeight(
      buildReportSvg({
        ...BASE,
        report: {
          ...BASE.report,
          items: Array.from({ length: 15 }, (_, index) => ({
            name: `Pan ${index}`,
            imageUrl: null,
            quantity: index,
          })),
        },
      }),
    );

    expect(muchos).toBeGreaterThan(pocos);
  });

  it('usa un texto por defecto cuando no hay observaciones', () => {
    const svg = buildReportSvg({ ...BASE, report: { ...BASE.report, notes: null } });
    expect(svg).toContain('Sin observaciones.');
  });

  it('cae al responsable cuando no hay firma', () => {
    const svg = buildReportSvg({ ...BASE, report: { ...BASE.report, signature: null } });
    expect(svg).toContain('María Fernanda');
  });
});
