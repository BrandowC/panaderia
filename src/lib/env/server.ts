import 'server-only';
import { z } from 'zod';
import { parseClientEnv, type ClientEnv } from './client';

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z
    .string({ error: 'SUPABASE_SERVICE_ROLE_KEY es obligatoria' })
    .min(1, { error: 'SUPABASE_SERVICE_ROLE_KEY es obligatoria' }),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Solo existe en produccion: protege el endpoint de limpieza automatica.
  CRON_SECRET: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema> & ClientEnv;

export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  const result = serverEnvSchema.safeParse(source);

  if (!result.success) {
    const details = result.error.issues.map((issue) => `- ${issue.message}`).join('\n');
    throw new Error(`Variables de entorno del servidor invalidas:\n${details}`);
  }

  return { ...parseClientEnv(source), ...result.data };
}

let cachedEnv: ServerEnv | null = null;

export function readServerEnv(): ServerEnv {
  cachedEnv ??= parseServerEnv(process.env);
  return cachedEnv;
}
