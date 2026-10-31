/**
 * Códigos de error que cualquier ruta API puede devolver.
 * Cada ruta los extiende con los suyos (ver auth-errors.ts, contact-errors.ts).
 * Sin dependencias de Next: se puede importar desde el cliente.
 */
export const COMMON_ERROR_CODES = [
  'rateLimited',
  'invalidData',
  'serverError',
  'unavailable',
] as const;

export type CommonErrorCode = (typeof COMMON_ERROR_CODES)[number];

/**
 * Lee el `code` de un cuerpo de error y lo valida contra la lista permitida.
 * Devuelve null si no existe o no es uno de los códigos esperados.
 */
export function readErrorCode<const T extends readonly string[]>(
  body: unknown,
  allowed: T,
): T[number] | null {
  if (!body || typeof body !== 'object' || !('code' in body)) return null;

  const { code } = body;

  return typeof code === 'string' &&
    (allowed as readonly string[]).includes(code)
    ? (code as T[number])
    : null;
}
