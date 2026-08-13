import { z } from 'zod';
import { DEFAULT_MAX_QUANTITY } from '@/types';

/** Enteros no negativos. Rechaza decimales, negativos y texto. */
export const quantitySchema = z.coerce
  .number({ error: 'La cantidad debe ser un número.' })
  .int({ error: 'La cantidad debe ser un número entero.' })
  .min(0, { error: 'La cantidad no puede ser negativa.' })
  .max(DEFAULT_MAX_QUANTITY, { error: `La cantidad no puede superar ${DEFAULT_MAX_QUANTITY}.` });

export const updateQuantitySchema = z.object({
  itemId: z.uuid({ error: 'Identificador inválido.' }),
  quantity: quantitySchema,
});

export const finalizeSchema = z.object({
  sessionId: z.uuid({ error: 'Identificador inválido.' }),
  responsibleId: z.uuid({ error: 'Elige quién hizo el conteo.' }),

  /*
   * El trazo llega como data URL de PNG. El limite de tamaño evita que un
   * cliente manipulado envie una imagen enorme; el nombre visible del firmante
   * sale del responsable elegido, no de este campo.
   */
  signatureImage: z
    .string({ error: 'La firma es obligatoria.' })
    .refine((value) => value.startsWith('data:image/png;base64,'), {
      error: 'Firma con el dedo antes de finalizar.',
    })
    .refine((value) => value.length < 400_000, { error: 'La firma es demasiado grande.' }),

  notes: z
    .string()
    .transform((value) => {
      const trimmed = value.trim();
      return trimmed === '' ? null : trimmed;
    })
    .pipe(
      z
        .string()
        .max(500, { error: 'Las observaciones no pueden superar 500 caracteres.' })
        .nullable(),
    )
    .default(null),
});

/** Acepta lo que escribe el usuario y devuelve un entero valido o null. */
export function parseQuantityInput(raw: string): number | null {
  const cleaned = raw.replace(/[^\d]/g, '');
  if (cleaned === '') {
    return 0;
  }
  const value = Number.parseInt(cleaned, 10);
  return Number.isNaN(value) || value > DEFAULT_MAX_QUANTITY ? null : value;
}
