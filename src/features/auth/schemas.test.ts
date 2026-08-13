import { describe, expect, it } from 'vitest';
import { loginSchema } from './schemas';

describe('loginSchema', () => {
  it('acepta credenciales validas', () => {
    const result = loginSchema.safeParse({
      email: 'empleado@panaderia.co',
      password: 'contrasena-segura',
    });
    expect(result.success).toBe(true);
  });

  it('normaliza el correo a minusculas y sin espacios', () => {
    const result = loginSchema.parse({
      email: '  Empleado@Panaderia.CO  ',
      password: 'contrasena-segura',
    });
    expect(result.email).toBe('empleado@panaderia.co');
  });

  it('rechaza un correo mal formado', () => {
    const result = loginSchema.safeParse({ email: 'sin-arroba', password: 'contrasena-segura' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Escribe un correo valido.');
  });

  it('exige una longitud minima de contrasena', () => {
    const result = loginSchema.safeParse({ email: 'a@b.co', password: 'corta' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain('al menos 8 caracteres');
  });

  it('rechaza contrasenas por encima del limite de bcrypt', () => {
    const result = loginSchema.safeParse({ email: 'a@b.co', password: 'x'.repeat(73) });
    expect(result.success).toBe(false);
  });

  it('rechaza valores ausentes', () => {
    expect(loginSchema.safeParse({}).success).toBe(false);
  });

  it('ignora campos adicionales para evitar mass assignment', () => {
    const result = loginSchema.parse({
      email: 'a@b.co',
      password: 'contrasena-segura',
      role: 'ADMIN',
      is_active: true,
    });
    expect(result).not.toHaveProperty('role');
    expect(result).not.toHaveProperty('is_active');
  });
});
