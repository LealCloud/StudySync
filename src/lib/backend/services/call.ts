import { BackendOperationError } from '../errors';
import { isBackendRateLimited, type RestBackendResponse } from '../http';
import { RestBackendUnavailableError } from '../rest/client';

export async function callBackend<T>(
  fn: () => Promise<RestBackendResponse<T>>,
): Promise<RestBackendResponse<T>> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof RestBackendUnavailableError) {
      throw new BackendOperationError(503, 'unavailable');
    }
    throw error;
  }
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
