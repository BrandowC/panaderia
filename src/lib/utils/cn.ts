type ClassValue = string | number | null | undefined | false;

/** Une clases condicionales. Suficiente mientras no exista conflicto real de utilidades. */
export function cn(...values: ClassValue[]): string {
  return values.filter((value): value is string | number => Boolean(value)).join(' ');
}
