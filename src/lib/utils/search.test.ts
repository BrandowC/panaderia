import { describe, expect, it } from 'vitest';
import { matchesSearch, normalizeForSearch } from './search';

describe('normalizeForSearch', () => {
  it('quita acentos', () => {
    expect(normalizeForSearch('Pan aliñado')).toBe('pan alinado');
    expect(normalizeForSearch('Almojábana')).toBe('almojabana');
  });

  it('pasa a minusculas y recorta', () => {
    expect(normalizeForSearch('  CAÑA  ')).toBe('cana');
  });
});

describe('matchesSearch', () => {
  it('encuentra el producto aunque se escriba sin acento', () => {
    expect(matchesSearch('Pan aliñado', 'alinado')).toBe(true);
    expect(matchesSearch('Almojábana', 'almojabana')).toBe(true);
  });

  it('encuentra el producto aunque se escriba con acento', () => {
    expect(matchesSearch('Pan alinado', 'aliñado')).toBe(true);
  });

  it('ignora mayusculas', () => {
    expect(matchesSearch('Pandebono', 'PANDE')).toBe(true);
  });

  it('encuentra coincidencias parciales en medio del nombre', () => {
    expect(matchesSearch('Pan de queso', 'queso')).toBe(true);
  });

  it('no devuelve falsos positivos', () => {
    expect(matchesSearch('Croissant', 'mogolla')).toBe(false);
  });

  it('con termino vacio coincide con todo', () => {
    expect(matchesSearch('Croissant', '')).toBe(true);
  });
});
