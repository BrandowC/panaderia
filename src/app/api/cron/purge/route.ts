import { NextResponse } from 'next/server';
import { readServerEnv } from '@/lib/env/server';
import { purgeOldReports } from '@/server/repositories/retention';

export const dynamic = 'force-dynamic';

const RETENTION_DAYS = 60;

/**
 * Borra los conteos finalizados hace mas de 60 dias. Lo invoca el cron de
 * Vercel una vez al dia. Exige `CRON_SECRET` para que nadie mas pueda
 * dispararlo desde fuera.
 */
export async function GET(request: Request) {
  const expected = readServerEnv().CRON_SECRET;

  if (!expected) {
    return NextResponse.json({ message: 'Limpieza no configurada.' }, { status: 503 });
  }

  if (request.headers.get('authorization') !== `Bearer ${expected}`) {
    return NextResponse.json({ message: 'No autorizado.' }, { status: 401 });
  }

  try {
    const deleted = await purgeOldReports(RETENTION_DAYS);
    return NextResponse.json({ deleted, retentionDays: RETENTION_DAYS });
  } catch (error) {
    console.error(
      'Fallo la limpieza de reportes antiguos',
      error instanceof Error ? error.message : 'desconocido',
    );
    return NextResponse.json({ message: 'No se pudo limpiar.' }, { status: 500 });
  }
}
