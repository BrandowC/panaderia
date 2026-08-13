import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { isAppError } from '@/lib/errors/app-error';
import { requireUser } from '@/server/auth/session';
import { uploadPhoto, type PhotoBucket } from '@/server/repositories/storage';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_BUCKETS = new Set<PhotoBucket>(['product-photos', 'user-photos', 'report-images']);
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * El tipo y el tamano se validan en servidor: el cliente comprime por comodidad,
 * pero cualquiera puede llamar a este endpoint con otro contenido.
 */
export async function POST(request: Request) {
  try {
    await requireUser();

    const form = await request.formData();
    const file = form.get('file');
    const bucket = String(form.get('bucket') ?? '');

    if (!(file instanceof File)) {
      return NextResponse.json({ message: 'Archivo no recibido.' }, { status: 400 });
    }

    if (!ALLOWED_BUCKETS.has(bucket as PhotoBucket)) {
      return NextResponse.json({ message: 'Destino inválido.' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { message: 'Solo se aceptan imágenes JPG, PNG o WEBP.' },
        { status: 400 },
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ message: 'La imagen supera 5 MB.' }, { status: 400 });
    }

    const extension =
      file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const url = await uploadPhoto(bucket as PhotoBucket, `${randomUUID()}.${extension}`, file);

    return NextResponse.json({ url });
  } catch (error) {
    if (isAppError(error) && error.code === 'FORBIDDEN') {
      return NextResponse.json({ message: 'No autorizado.' }, { status: 403 });
    }

    console.error('Fallo al subir la foto', error instanceof Error ? error.message : 'desconocido');
    return NextResponse.json({ message: 'No se pudo subir la foto.' }, { status: 500 });
  }
}
