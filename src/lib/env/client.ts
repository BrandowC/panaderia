import { z } from 'zod';

/**
 * Next.js sustituye `process.env.NEXT_PUBLIC_*` en tiempo de compilacion solo cuando
 * la propiedad se escribe literalmente. Un acceso dinamico devolveria undefined en el
 * navegador, por eso el objeto se construye campo por campo.
 */
/** Un `error` unico por campo garantiza que el mensaje nombre la variable ausente. */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({
    error: 'NEXT_PUBLIC_SUPABASE_URL debe ser una URL valida',
  }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string({ error: 'NEXT_PUBLIC_SUPABASE_ANON_KEY es obligatoria' })
    .min(1, { error: 'NEXT_PUBLIC_SUPABASE_ANON_KEY es obligatoria' }),
  NEXT_PUBLIC_SITE_URL: z.url({ error: 'NEXT_PUBLIC_SITE_URL debe ser una URL valida' }),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

export function parseClientEnv(source: Record<string, string | undefined>): ClientEnv {
  const result = clientEnvSchema.safeParse(source);

  if (!result.success) {
    const details = result.error.issues.map((issue) => `- ${issue.message}`).join('\n');
    throw new Error(`Variables de entorno publicas invalidas:\n${details}`);
  }

  return result.data;
}

export function readClientEnv(): ClientEnv {
  return parseClientEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });
}
