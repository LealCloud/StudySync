export const BACKEND_ERROR_CODE = {
  RATE_LIMITED: 'RATE_LIMITED',
  INVALID_RESET_TOKEN: 'INVALID_RESET_TOKEN',
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

export type BackendErrorCode =
  (typeof BACKEND_ERROR_CODE)[keyof typeof BACKEND_ERROR_CODE];

export interface RestBackendResponse<T = unknown> {
  status: number;
  ok: boolean;
  body: T | null;
}

export function readBackendErrorCode(body: unknown): string | null {
  if (!body || typeof body !== 'object' || !('error' in body)) return null;

  const error = body.error;
  if (!error || typeof error !== 'object' || !('code' in error)) return null;

  const { code } = error;
  return typeof code === 'string' && code.length > 0 ? code : null;
}

export function isBackendRateLimited(response: RestBackendResponse): boolean {
  return (
    response.status === 429 ||
    readBackendErrorCode(response.body) === BACKEND_ERROR_CODE.RATE_LIMITED
  );
}

export function isInvalidResetToken(response: RestBackendResponse): boolean {
  return (
    response.status === 400 &&
    readBackendErrorCode(response.body) ===
      BACKEND_ERROR_CODE.INVALID_RESET_TOKEN
  );
}
