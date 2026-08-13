import { beforeEach, describe, expect, it, vi } from 'vitest';

const getUser = vi.fn();
const maybeSingle = vi.fn();
const redirectMock = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});

vi.mock('server-only', () => ({}));

vi.mock('next/navigation', () => ({
  redirect: (path: string) => redirectMock(path),
}));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: async () => ({
    auth: { getUser },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle }),
      }),
    }),
  }),
}));

const { getCurrentUser, requireUser } = await import('./session');

function signedInAs(profile: { display_name: string; is_active: boolean } | null) {
  getUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'a@panaderia.co' } } });
  maybeSingle.mockResolvedValue({ data: profile });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getCurrentUser', () => {
  it('devuelve null cuando no hay sesion', async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    expect(await getCurrentUser()).toBeNull();
  });

  it('devuelve el usuario con su rol cuando el perfil esta activo', async () => {
    signedInAs({ display_name: 'Ana', is_active: true });

    expect(await getCurrentUser()).toEqual({
      id: 'user-1',
      email: 'a@panaderia.co',
      displayName: 'Ana',
    });
  });

  it('niega el acceso a un usuario desactivado aunque su token siga siendo valido', async () => {
    signedInAs({ display_name: 'Ana', is_active: false });
    expect(await getCurrentUser()).toBeNull();
  });

  it('niega el acceso cuando no existe perfil asociado', async () => {
    signedInAs(null);
    expect(await getCurrentUser()).toBeNull();
  });
});

describe('requireUser', () => {
  it('redirige al login cuando no hay sesion', async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    await expect(requireUser()).rejects.toThrow('REDIRECT:/login');
    expect(redirectMock).toHaveBeenCalledWith('/login');
  });

  it('deja pasar a un usuario activo', async () => {
    signedInAs({ display_name: 'Ana', is_active: true });
    await expect(requireUser()).resolves.toMatchObject({ displayName: 'Ana' });
  });
});
