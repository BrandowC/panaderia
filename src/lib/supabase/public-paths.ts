const PUBLIC_PREFIXES = ['/login', '/report', '/_next', '/favicon.ico'] as const;

/**
 * El reporte publico y el login deben abrirse sin sesion. Todo lo demas es privado.
 * La coincidencia exige el segmento completo: un prefijo suelto dejaria abierta
 * una futura ruta privada como `/reportes-internos`.
 */
export function isPublicPath(pathname: string): boolean {
  if (pathname === '/') {
    return true;
  }

  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
