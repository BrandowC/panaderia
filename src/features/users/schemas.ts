import { z } from 'zod';

const displayNameSchema = z
  .string({ error: 'El nombre es obligatorio.' })
  .transform((value) => value.trim().replace(/\s+/g, ' '))
  .pipe(
    z
      .string()
      .min(2, { error: 'El nombre debe tener al menos 2 caracteres.' })
      .max(80, { error: 'El nombre no puede superar 80 caracteres.' }),
  );

const emailSchema = z
  .string({ error: 'El correo es obligatorio.' })
  .transform((value) => value.trim().toLowerCase())
  .pipe(z.email({ error: 'Escribe un correo válido.' }));

// 8 caracteres es el minimo de Supabase Auth.
const passwordSchema = z
  .string({ error: 'La contraseña es obligatoria.' })
  .min(8, { error: 'La contraseña debe tener al menos 8 caracteres.' })
  .max(72, { error: 'La contraseña no puede superar 72 caracteres.' });

const photoSchema = z
  .string()
  .transform((value) => (value.trim() === '' ? null : value.trim()))
  .pipe(z.url({ error: 'La foto no es válida.' }).nullable());

export const createUserSchema = z.object({
  displayName: displayNameSchema,
  email: emailSchema,
  password: passwordSchema,
  photoUrl: photoSchema.default(null),
});

/** Al editar, la contraseña vacia significa "no cambiarla". */
export const updateUserSchema = z.object({
  userId: z.uuid({ error: 'Identificador inválido.' }),
  displayName: displayNameSchema,
  photoUrl: photoSchema.default(null),
  password: z
    .string()
    .transform((value) => (value.trim() === '' ? null : value))
    .pipe(passwordSchema.nullable())
    .default(null),
});

export const userIdSchema = z.object({
  userId: z.uuid({ error: 'Identificador inválido.' }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
