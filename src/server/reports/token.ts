import 'server-only';

import { createHash, randomBytes } from 'node:crypto';

/**
 * 32 bytes = 256 bits de entropia criptografica. Adivinar un token es inviable
 * y la tabla guarda solo su hash, de modo que ni un volcado revela enlaces.
 */
export function generatePublicToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashPublicToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
