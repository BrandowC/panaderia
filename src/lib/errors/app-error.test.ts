import { describe, expect, it } from 'vitest';
import { actionFailure, actionSuccess, AppError, isAppError, toUserMessage } from './app-error';

describe('AppError', () => {
  it('asigna un mensaje predeterminado en espanol segun el codigo', () => {
    expect(new AppError('FORBIDDEN').userMessage).toBe(
      'No tienes permiso para realizar esta accion.',
    );
  });

  it('permite personalizar el mensaje visible', () => {
    const error = new AppError('VALIDATION', { userMessage: 'La cantidad debe ser un entero.' });
    expect(error.userMessage).toBe('La cantidad debe ser un entero.');
  });

  it('conserva la causa original sin exponerla al usuario', () => {
    const cause = new Error('conexion rechazada en el puerto 5432');
    const error = new AppError('UNEXPECTED', { cause });
    expect(error.cause).toBe(cause);
    expect(error.userMessage).not.toContain('5432');
  });

  it('se reconoce mediante isAppError', () => {
    expect(isAppError(new AppError('NOT_FOUND'))).toBe(true);
    expect(isAppError(new Error('otro'))).toBe(false);
    expect(isAppError(null)).toBe(false);
  });
});

describe('toUserMessage', () => {
  it('oculta los detalles de errores desconocidos', () => {
    const message = toUserMessage(new Error('columna "password_hash" no existe'));
    expect(message).toBe('Ocurrio un error inesperado. Intenta de nuevo.');
    expect(message).not.toContain('password_hash');
  });

  it('tolera valores lanzados que no son errores', () => {
    expect(toUserMessage('texto suelto')).toBe('Ocurrio un error inesperado. Intenta de nuevo.');
    expect(toUserMessage(undefined)).toBe('Ocurrio un error inesperado. Intenta de nuevo.');
  });
});

describe('ActionResult', () => {
  it('envuelve un resultado correcto', () => {
    const result = actionSuccess({ id: 'abc' });
    expect(result).toEqual({ ok: true, data: { id: 'abc' } });
  });

  it('traduce un AppError conservando su codigo', () => {
    const result = actionFailure<null>(new AppError('CONFLICT'));
    expect(result).toEqual({
      ok: false,
      code: 'CONFLICT',
      message: 'Esta accion ya se realizo o entra en conflicto con otra.',
    });
  });

  it('clasifica como UNEXPECTED cualquier error ajeno', () => {
    const result = actionFailure<null>(new Error('fallo interno del driver'));
    expect(result).toEqual({
      ok: false,
      code: 'UNEXPECTED',
      message: 'Ocurrio un error inesperado. Intenta de nuevo.',
    });
  });
});
