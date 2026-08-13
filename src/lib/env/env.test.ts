import { describe, expect, it } from 'vitest';
import { parseClientEnv } from './client';

const VALID = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://demo.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'clave-anonima-de-prueba',
  NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
};

describe('parseClientEnv', () => {
  it('acepta una configuracion completa', () => {
    expect(parseClientEnv(VALID)).toEqual(VALID);
  });

  it('falla con un mensaje claro cuando falta una variable', () => {
    expect(() =>
      parseClientEnv({ ...VALID, NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined }),
    ).toThrowError(/NEXT_PUBLIC_SUPABASE_ANON_KEY es obligatoria/);
  });

  it('nombra la variable ausente cuando la clave no existe', () => {
    const { NEXT_PUBLIC_SITE_URL: _omitida, ...sinSitio } = VALID;
    expect(() => parseClientEnv(sinSitio)).toThrowError(/NEXT_PUBLIC_SITE_URL/);
  });

  it('rechaza una URL mal formada', () => {
    expect(() =>
      parseClientEnv({ ...VALID, NEXT_PUBLIC_SUPABASE_URL: 'no-es-una-url' }),
    ).toThrowError(/NEXT_PUBLIC_SUPABASE_URL debe ser una URL valida/);
  });

  it('rechaza una clave anonima vacia', () => {
    expect(() => parseClientEnv({ ...VALID, NEXT_PUBLIC_SUPABASE_ANON_KEY: '' })).toThrowError(
      /NEXT_PUBLIC_SUPABASE_ANON_KEY es obligatoria/,
    );
  });

  it('no expone valores de entorno en el mensaje de error', () => {
    try {
      parseClientEnv({ ...VALID, NEXT_PUBLIC_SUPABASE_URL: 'invalida' });
      expect.unreachable('deberia haber lanzado');
    } catch (error) {
      expect((error as Error).message).not.toContain('clave-anonima-de-prueba');
    }
  });

  it('ignora variables privadas del servidor', () => {
    const parsed = parseClientEnv({ ...VALID, SUPABASE_SERVICE_ROLE_KEY: 'secreto' });
    expect(parsed).not.toHaveProperty('SUPABASE_SERVICE_ROLE_KEY');
  });
});
