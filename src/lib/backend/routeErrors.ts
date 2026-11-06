import { apiError } from '@/lib/apiResponse';
import { NextResponse } from 'next/server';
import { BackendOperationError } from './errors';

/** Converts service failures into the stable, backend-independent API shape. */
export function backendRouteError(
  error: unknown,
  operation: string,
): NextResponse {
  if (error instanceof BackendOperationError) {
    return apiError(error.status, error.code);
  }

  console.error(`Error en ${operation}:`, error);
  return apiError(500, 'serverError');
}
