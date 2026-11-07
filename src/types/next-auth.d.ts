import type { DefaultSession, DefaultUser } from 'next-auth';
import type { DefaultJWT } from 'next-auth/jwt';
import type { UserRole } from './user';

export type { UserRole } from './user';

// session.user se limita a lo necesario para autenticación y autorización.
// - id:    ancla del JWT.
// - role:  autorización (guard + BFF).
//
// Los tokens externos ya no existen (Auth.js puro).
// `session.error` se elimina: Auth.js redirige solo.
//
// DefaultSession['user'] tipa name/email/image pero no los rellenamos:
// los datos de presentación se obtienen del BFF vía GraphQL.
interface UserProfile {
  id: string;
  role: UserRole;
}

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & UserProfile;
  }

  interface User extends DefaultUser, UserProfile {}
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT, Partial<UserProfile> {}
}
