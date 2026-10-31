import { apiError } from '@/lib/apiResponse';
import { NextResponse } from 'next/server';
import { BackendOperationError } from './errors';
import { RestBackendNotConfiguredError } from './rest/client';

/** Converts service failures into the stable, backend-independent API shape. */
export function backendRouteError(
  error: unknown,
  operation: string,
): NextResponse {
  if (error instanceof BackendOperationError) {
    return apiError(error.status, error.code);
  }

  if (error instanceof RestBackendNotConfiguredError) {
    console.error('API_BASE_URL no configurada');
    return apiError(500, 'serverError');
  }

  console.error(`Error en ${operation}:`, error);
  return apiError(500, 'serverError');
}
