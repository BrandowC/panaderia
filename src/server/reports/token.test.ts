import { describe, expect, it } from 'vitest';
import { generatePublicToken, hashPublicToken } from './token';

describe('generatePublicToken', () => {
  it('produce tokens suficientemente largos para no ser adivinables', () => {
    // 32 bytes en base64url ocupan 43 caracteres.
    expect(generatePublicToken().length).toBeGreaterThanOrEqual(43);
  });

  it('usa alfabeto seguro para URL', () => {
    expect(generatePublicToken()).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('nunca repite un token', () => {
    const tokens = new Set(Array.from({ length: 500 }, () => generatePublicToken()));
    expect(tokens.size).toBe(500);
  });
});

describe('hashPublicToken', () => {
  it('devuelve un SHA-256 en hexadecimal', () => {
    expect(hashPublicToken('token-de-prueba')).toMatch(/^[a-f0-9]{64}$/);
  });

  it('es determinista', () => {
    expect(hashPublicToken('abc')).toBe(hashPublicToken('abc'));
  });

  it('cambia por completo ante una diferencia minima', () => {
    expect(hashPublicToken('abc')).not.toBe(hashPublicToken('abd'));
  });

  it('no permite recuperar el token original', () => {
    const token = generatePublicToken();
    expect(hashPublicToken(token)).not.toContain(token);
  });
});
