import { describe, expect, it } from 'vitest';
import { finalizeSchema, parseQuantityInput, quantitySchema } from './schemas';

describe('quantitySchema', () => {
  it('acepta cero', () => {
    expect(quantitySchema.parse(0)).toBe(0);
  });

  it('acepta enteros positivos', () => {
    expect(quantitySchema.parse(42)).toBe(42);
  });

  it('acepta el maximo permitido', () => {
    expect(quantitySchema.parse(99999)).toBe(99999);
  });

  it('rechaza cantidades negativas', () => {
    expect(quantitySchema.safeParse(-1).success).toBe(false);
  });

  it('rechaza decimales', () => {
    expect(quantitySchema.safeParse(2.5).success).toBe(false);
  });

  it('rechaza por encima del maximo', () => {
    expect(quantitySchema.safeParse(100000).success).toBe(false);
  });

  it('rechaza texto no numerico', () => {
    expect(quantitySchema.safeParse('muchos').success).toBe(false);
  });

  it('convierte numeros enviados como texto', () => {
    expect(quantitySchema.parse('25')).toBe(25);
  });
});

describe('parseQuantityInput', () => {
  it('interpreta digitos normales', () => {
    expect(parseQuantityInput('45')).toBe(45);
  });

  it('trata el campo vacio como cero', () => {
    expect(parseQuantityInput('')).toBe(0);
  });

  it('descarta letras pegadas al numero', () => {
    expect(parseQuantityInput('12abc')).toBe(12);
  });

  it('descarta el signo menos para impedir negativos', () => {
    expect(parseQuantityInput('-5')).toBe(5);
  });

  it('descarta separadores decimales', () => {
    expect(parseQuantityInput('2.5')).toBe(25);
  });

  it('elimina ceros a la izquierda', () => {
    expect(parseQuantityInput('007')).toBe(7);
  });

  it('devuelve null si supera el maximo, para no truncar en silencio', () => {
    expect(parseQuantityInput('123456')).toBeNull();
  });

  it('trata una entrada de solo simbolos como cero', () => {
    expect(parseQuantityInput('$$$')).toBe(0);
  });
});

describe('finalizeSchema', () => {
  const id = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
  const staff = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
  const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==';
  const BASE = { sessionId: id, responsibleId: staff, signatureImage: PNG, notes: '' };

  it('acepta un cierre completo', () => {
    const result = finalizeSchema.parse(BASE);
    expect(result.responsibleId).toBe(staff);
    expect(result.signatureImage).toBe(PNG);
  });

  it('acepta observaciones vacias como null', () => {
    expect(finalizeSchema.parse({ ...BASE, notes: '   ' }).notes).toBeNull();
  });

  it('recorta las observaciones', () => {
    expect(finalizeSchema.parse({ ...BASE, notes: '  faltó harina  ' }).notes).toBe('faltó harina');
  });

  it('rechaza observaciones demasiado largas', () => {
    expect(finalizeSchema.safeParse({ ...BASE, notes: 'x'.repeat(501) }).success).toBe(false);
  });

  it('exige elegir un responsable', () => {
    expect(finalizeSchema.safeParse({ ...BASE, responsibleId: '' }).success).toBe(false);
  });

  it('exige una firma trazada', () => {
    expect(finalizeSchema.safeParse({ ...BASE, signatureImage: '' }).success).toBe(false);
  });

  it('rechaza una firma que no sea PNG', () => {
    const result = finalizeSchema.safeParse({
      ...BASE,
      signatureImage: 'data:text/html,<script>alert(1)</script>',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza una firma desproporcionada', () => {
    const huge = 'data:image/png;base64,' + 'A'.repeat(400_000);
    expect(finalizeSchema.safeParse({ ...BASE, signatureImage: huge }).success).toBe(false);
  });

  it('exige un identificador de conteo valido', () => {
    expect(finalizeSchema.safeParse({ ...BASE, sessionId: 'abc' }).success).toBe(false);
  });
});
