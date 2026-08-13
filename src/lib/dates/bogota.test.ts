import { describe, expect, it } from 'vitest';
import {
  BOGOTA_TIME_ZONE,
  buildReportFileName,
  buildReportFileStamp,
  formatBogotaDate,
  formatBogotaDateTime,
  formatBogotaLongDate,
  formatBogotaTime,
} from './bogota';

describe('zona horaria de Bogota', () => {
  it('usa America/Bogota como zona oficial', () => {
    expect(BOGOTA_TIME_ZONE).toBe('America/Bogota');
  });

  it('convierte un instante UTC a la fecha civil colombiana', () => {
    const date = new Date('2026-08-05T18:30:00Z');
    expect(formatBogotaDate(date)).toBe('2026-08-05');
    expect(formatBogotaTime(date)).toBe('13:30');
  });

  it('mantiene el dia anterior cuando en UTC ya cambio la fecha', () => {
    // 03:00 UTC del 6 de agosto siguen siendo las 22:00 del 5 en Bogota.
    const date = new Date('2026-08-06T03:00:00Z');
    expect(formatBogotaDate(date)).toBe('2026-08-05');
    expect(formatBogotaTime(date)).toBe('22:00');
  });

  it('resuelve la medianoche exacta de Bogota', () => {
    const date = new Date('2026-08-06T05:00:00Z');
    expect(formatBogotaDate(date)).toBe('2026-08-06');
    expect(formatBogotaTime(date)).toBe('00:00');
  });

  it('resuelve el ultimo minuto del dia en Bogota', () => {
    const date = new Date('2026-08-06T04:59:00Z');
    expect(formatBogotaDate(date)).toBe('2026-08-05');
    expect(formatBogotaTime(date)).toBe('23:59');
  });

  it('no aplica horario de verano en ninguna epoca del ano', () => {
    const enero = new Date('2026-01-15T17:00:00Z');
    const julio = new Date('2026-07-15T17:00:00Z');
    expect(formatBogotaTime(enero)).toBe('12:00');
    expect(formatBogotaTime(julio)).toBe('12:00');
  });

  it('cruza correctamente el cambio de ano', () => {
    const date = new Date('2027-01-01T04:00:00Z');
    expect(formatBogotaDate(date)).toBe('2026-12-31');
  });

  it('usa formato de 24 horas en la fecha y hora legibles', () => {
    const date = new Date('2026-08-05T23:45:00Z');
    const formatted = formatBogotaDateTime(date);
    expect(formatted).toContain('18:45');
    expect(formatted.toLowerCase()).not.toContain('p. m.');
  });

  it('escribe la fecha larga en espanol', () => {
    const date = new Date('2026-08-05T18:30:00Z');
    expect(formatBogotaLongDate(date)).toBe('5 de agosto de 2026');
  });
});

describe('nombre de archivo del reporte', () => {
  it('genera el sufijo AAAA-MM-DD_HH-mm exigido', () => {
    const date = new Date('2026-08-05T18:30:00Z');
    expect(buildReportFileStamp(date)).toBe('2026-08-05_13-30');
  });

  it('genera el nombre completo del PDF', () => {
    const date = new Date('2026-08-05T18:30:00Z');
    expect(buildReportFileName(date)).toBe('inventario-panaderia_2026-08-05_13-30.pdf');
  });

  it('nombra el archivo con el dia de Bogota, no con el de UTC', () => {
    const date = new Date('2026-08-06T02:15:00Z');
    expect(buildReportFileName(date)).toBe('inventario-panaderia_2026-08-05_21-15.pdf');
  });

  it('produce un nombre sin caracteres invalidos para el sistema de archivos', () => {
    const name = buildReportFileName(new Date('2026-08-05T18:30:00Z'));
    expect(name).not.toMatch(/[:*?"<>|]/);
  });
});
