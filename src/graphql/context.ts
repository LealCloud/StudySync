import type { BackendClient } from '@/lib/backend/client';
import type { Session } from 'next-auth';

/**
 * Autorización por rol:
 * - El helper `requireRole` (src/graphql/auth.ts) bloquea con `403` antes
 *   de llamar al backend.
 * - La matriz de autorización vive en BACKEND_API.md §10.
 * - Aplicado a: Account mutations, Courses, Certificates, Billing,
 *   Security.disableTwoFactor.
 */
export interface GraphQLContext {
  session: Session | null;
  backend: BackendClient;
}
