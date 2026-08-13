import { z } from 'zod';

export const loginSchema = z.object({
  // El recorte precede a la validacion: en Zod 4 el formato se comprueba antes
  // de cualquier transformacion posterior, y un espacio pegado invalidaria el correo.
  email: z
    .string({ error: 'Escribe un correo valido.' })
    .transform((value) => value.trim().toLowerCase())
    .pipe(z.email({ error: 'Escribe un correo valido.' })),
  password: z
    .string({ error: 'La contrasena es obligatoria.' })
    .min(8, { error: 'La contrasena debe tener al menos 8 caracteres.' })
    .max(72, { error: 'La contrasena no puede superar 72 caracteres.' }),
});

export type LoginInput = z.infer<typeof loginSchema>;
