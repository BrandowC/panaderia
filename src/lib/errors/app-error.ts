export const APP_ERROR_CODES = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION',
  'CONFLICT',
  'UNEXPECTED',
] as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[number];

/** Mensajes seguros para mostrar al usuario: nunca revelan detalles internos. */
const USER_MESSAGES: Record<AppErrorCode, string> = {
  UNAUTHENTICATED: 'Tu sesion expiro. Inicia sesion nuevamente.',
  FORBIDDEN: 'No tienes permiso para realizar esta accion.',
  NOT_FOUND: 'No encontramos lo que buscas.',
  VALIDATION: 'Revisa los datos ingresados.',
  CONFLICT: 'Esta accion ya se realizo o entra en conflicto con otra.',
  UNEXPECTED: 'Ocurrio un error inesperado. Intenta de nuevo.',
};

/**
 * `userMessage` se muestra en pantalla; `cause` queda solo en registros del servidor.
 * Separarlos evita filtrar detalles internos al navegador.
 */
export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly userMessage: string;

  constructor(code: AppErrorCode, options?: { userMessage?: string; cause?: unknown }) {
    super(options?.userMessage ?? USER_MESSAGES[code], { cause: options?.cause });
    this.name = 'AppError';
    this.code = code;
    this.userMessage = options?.userMessage ?? USER_MESSAGES[code];
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/** Convierte cualquier valor lanzado en un mensaje presentable sin filtrar internals. */
export function toUserMessage(error: unknown): string {
  return isAppError(error) ? error.userMessage : USER_MESSAGES.UNEXPECTED;
}

export type ActionResult<TData> =
  { ok: true; data: TData } | { ok: false; code: AppErrorCode; message: string };

export function actionSuccess<TData>(data: TData): ActionResult<TData> {
  return { ok: true, data };
}

export function actionFailure<TData>(error: unknown): ActionResult<TData> {
  return {
    ok: false,
    code: isAppError(error) ? error.code : 'UNEXPECTED',
    message: toUserMessage(error),
  };
}
