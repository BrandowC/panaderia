import { z } from 'zod';

const nameSchema = z
  .string({ error: 'El nombre es obligatorio.' })
  .transform((value) => value.trim().replace(/\s+/g, ' '))
  .pipe(
    z
      .string()
      .min(2, { error: 'El nombre debe tener al menos 2 caracteres.' })
      .max(80, { error: 'El nombre no puede superar 80 caracteres.' }),
  );

/** Solo URLs http(s): un `javascript:` en el catalogo seria XSS almacenado. */
const imageUrlSchema = z
  .string()
  .transform((value) => (value.trim() === '' ? null : value.trim()))
  .pipe(
    z
      .url({ error: 'La imagen no es válida.' })
      .refine((value) => /^https?:\/\//i.test(value), {
        error: 'La imagen debe empezar por http:// o https://',
      })
      .nullable(),
  );

export const createProductSchema = z.object({
  name: nameSchema,
  imageUrl: imageUrlSchema.default(null),
  sortOrder: z.coerce
    .number({ error: 'El orden debe ser un número.' })
    .int({ error: 'El orden debe ser un número entero.' })
    .min(0, { error: 'El orden no puede ser negativo.' })
    .max(9999, { error: 'El orden no puede superar 9999.' })
    .default(0),
});

export const updateProductSchema = createProductSchema.extend({
  id: z.uuid({ error: 'Identificador inválido.' }),
});

export const productIdSchema = z.object({
  id: z.uuid({ error: 'Identificador inválido.' }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
