/**
 * Normaliza para buscar sin acentos ni mayusculas: "alinado" debe encontrar
 * "Pan aliñado", porque el teclado movil rara vez acentua.
 */
export function normalizeForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export function matchesSearch(haystack: string, needle: string): boolean {
  return normalizeForSearch(haystack).includes(normalizeForSearch(needle));
}
