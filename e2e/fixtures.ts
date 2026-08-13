import { readFileSync } from 'node:fs';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function readEnvFile(): Record<string, string> {
  const raw = readFileSync('.env.local', 'utf8');
  const entries = raw
    .split('\n')
    .filter((line) => line.includes('=') && !line.trim().startsWith('#'))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()] as const;
    });
  return Object.fromEntries(entries);
}

const env = readEnvFile();

export const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_ROLE = env.SUPABASE_SERVICE_ROLE_KEY ?? '';

export function adminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
}

export interface TestUser {
  id: string;
  email: string;
  password: string;
}

/** Crea un usuario desechable. Las pruebas nunca dependen de cuentas reales. */
export async function createTestUser(displayName: string): Promise<TestUser> {
  const admin = adminClient();
  const email = `e2e.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@ejemplo.test`;
  const password = 'ClaveDePrueba123!';

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });

  if (error || !data.user) {
    throw new Error(`No se pudo crear el usuario de prueba: ${error?.message}`);
  }

  return { id: data.user.id, email, password };
}

export async function deleteTestUser(userId: string): Promise<void> {
  const admin = adminClient();
  await admin.from('inventory_sessions').delete().eq('performed_by', userId);
  await admin.auth.admin.deleteUser(userId);
}

export async function deleteTestProducts(namePrefix: string): Promise<void> {
  const admin = adminClient();
  await admin.from('products').delete().like('name', `${namePrefix}%`);
}
