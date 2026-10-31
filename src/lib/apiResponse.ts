import { NextResponse } from 'next/server';

/**
 * Respuesta de error con código en vez de texto: el cliente la traduce
 * según su idioma. Indica el tipo de códigos de la ruta con el genérico:
 *   apiError<ContactErrorCode>(429, 'rateLimited')
 */
export function apiError<C extends string>(
  status: number,
  code: C,
  extra?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json({ status, code, ...extra }, { status });
}

export function apiOk<T extends Record<string, unknown>>(
  data?: T,
): NextResponse {
  return NextResponse.json({ status: 200, ...data }, { status: 200 });
}
