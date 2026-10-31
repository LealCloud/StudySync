import { GraphQLError } from 'graphql';
import type { GraphQLContext } from './context';
import type { UserRole } from '@/types/user';

export function requireAuth(context: GraphQLContext) {
  if (!context.session?.user) {
    throw new Error('Unauthorized');
  }

  return context.session.user;
}

/**
 * Exige que el usuario autenticado tenga uno de los roles permitidos.
 * Responde `403 FORBIDDEN` si el rol no está permitido.
 *
 * La matriz de autorización vive en BACKEND_API.md §10.
 * El BFF bloquea con `403` antes de llamar al backend; el backend
 * vuelve a validar como defensa en profundidad.
 */
export function requireRole(
  context: GraphQLContext,
  allowedRoles: readonly UserRole[],
) {
  const user = requireAuth(context);

  if (!allowedRoles.includes(user.role)) {
    throw new GraphQLError('Forbidden', {
      extensions: { code: 'FORBIDDEN', status: 403 },
    });
  }

  return user;
}
