const UNKNOWN_IP = 'unknown';

/**
 * Obtiene la IP del cliente desde las cabeceras del proxy.
 * Acepta cualquier objeto con `headers` (NextRequest o Request), así sirve
 * tanto en route handlers como en `authorize` de Auth.js.
 */
export function getClientIp(request: { headers: Headers }): string {
  const forwardedFor = request.headers
    .get('x-forwarded-for')
    ?.split(',')[0]
    ?.trim();

  return forwardedFor || request.headers.get('x-real-ip')?.trim() || UNKNOWN_IP;
}