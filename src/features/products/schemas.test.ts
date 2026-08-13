import { describe, expect, it } from 'vitest';
import { createProductSchema, updateProductSchema } from './schemas';

const BASE = { name: 'Pan de queso', imageUrl: '', sortOrder: 10 };

describe('createProductSchema', () => {
  it('acepta un producto valido', () => {
    const result = createProductSchema.parse(BASE);
    expect(result.name).toBe('Pan de queso');
    expect(result.sortOrder).toBe(10);
  });

  it('normaliza espacios repetidos y de los extremos', () => {
    const result = createProductSchema.parse({ ...BASE, name: '  Pan   de    coco  ' });
    expect(result.name).toBe('Pan de coco');
  });

  it('convierte la imagen vacia en null', () => {
    expect(createProductSchema.parse({ ...BASE, imageUrl: '' }).imageUrl).toBeNull();
  });

  it('acepta una URL de imagen https', () => {
    const result = createProductSchema.parse({
      ...BASE,
      imageUrl: 'https://images.example.com/pan.jpg',
    });
    expect(result.imageUrl).toBe('https://images.example.com/pan.jpg');
  });

  it('rechaza javascript: como URL de imagen', () => {
    const result = createProductSchema.safeParse({
      ...BASE,
      imageUrl: 'javascript:alert(document.cookie)',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza data: como URL de imagen', () => {
    const result = createProductSchema.safeParse({
      ...BASE,
      imageUrl: 'data:text/html,<script>alert(1)</script>',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza un nombre demasiado corto', () => {
    const result = createProductSchema.safeParse({ ...BASE, name: 'a' });
    expect(result.success).toBe(false);
  });

  it('rechaza un nombre de solo espacios', () => {
    expect(createProductSchema.safeParse({ ...BASE, name: '     ' }).success).toBe(false);
  });

  it('rechaza un nombre que supera 80 caracteres', () => {
    expect(createProductSchema.safeParse({ ...BASE, name: 'x'.repeat(81) }).success).toBe(false);
  });

  it('rechaza un orden negativo', () => {
    expect(createProductSchema.safeParse({ ...BASE, sortOrder: -1 }).success).toBe(false);
  });

  it('rechaza un orden decimal', () => {
    expect(createProductSchema.safeParse({ ...BASE, sortOrder: 1.5 }).success).toBe(false);
  });

  it('convierte el orden enviado como texto por el formulario', () => {
    expect(createProductSchema.parse({ ...BASE, sortOrder: '30' }).sortOrder).toBe(30);
  });

  it('ignora campos extra para evitar mass assignment', () => {
    const result = createProductSchema.parse({
      ...BASE,
      is_active: false,
      created_by: 'otro-usuario',
      normalized_name: 'inyectado',
    });
    expect(result).not.toHaveProperty('is_active');
    expect(result).not.toHaveProperty('created_by');
    expect(result).not.toHaveProperty('normalized_name');
  });
});

describe('updateProductSchema', () => {
  it('exige un identificador con formato UUID', () => {
    expect(updateProductSchema.safeParse({ ...BASE, id: 'no-es-uuid' }).success).toBe(false);
  });

  it('acepta un UUID valido', () => {
    const result = updateProductSchema.safeParse({
      ...BASE,
      id: '3f2504e0-4f89-11d3-9a0c-0305e82c3301',
    });
    expect(result.success).toBe(true);
  });
});
