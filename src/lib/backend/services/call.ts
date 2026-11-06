import { BackendOperationError } from '../errors';
import { isBackendRateLimited, type RestBackendResponse } from '../http';

// TODO(phase-c6): eliminar este wrapper cuando services/* se reescriba
// sobre la capa de dominio. Hoy es un alias de fn() para no tocar
// services/auth.ts ni services/contact.ts en esta fase.
export async function callBackend<T>(
  fn: () => Promise<RestBackendResponse<T>>,
): Promise<RestBackendResponse<T>> {
  return fn();
}

export function assertNotRateLimited(response: RestBackendResponse): void {
  if (isBackendRateLimited(response)) {
    throw new BackendOperationError(429, 'rateLimited');
  }
}

export function unexpectedBackendStatus(
  operation: string,
  status: number,
): never {
  console.error(`Respuesta inesperada del backend (${operation}):`, status);
  throw new BackendOperationError(502, 'serverError');
}
