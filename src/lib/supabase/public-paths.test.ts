import { describe, expect, it } from 'vitest';
import { isPublicPath } from './public-paths';

describe('isPublicPath', () => {
  it('permite el login sin sesion', () => {
    expect(isPublicPath('/login')).toBe(true);
  });

  it('permite el reporte publico sin sesion', () => {
    expect(isPublicPath('/report/token-largo-impredecible')).toBe(true);
  });

  it('permite la raiz, que decide a donde redirigir', () => {
    expect(isPublicPath('/')).toBe(true);
  });

  it('protege el inventario', () => {
    expect(isPublicPath('/inventario')).toBe(false);
  });

  it('protege la administracion y sus subrutas', () => {
    expect(isPublicPath('/admin')).toBe(false);
    expect(isPublicPath('/admin/usuarios')).toBe(false);
  });

  it('no confunde una ruta privada que empieza parecido a una publica', () => {
    expect(isPublicPath('/reportes-internos')).toBe(false);
  });
});
