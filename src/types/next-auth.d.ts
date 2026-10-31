import type { DefaultSession, DefaultUser } from 'next-auth';
import type { DefaultJWT } from 'next-auth/jwt';
import type { UserRole } from './user';

export type { UserRole } from './user';

// session.user se limita a lo necesario para autenticación y autorización.
// - id:    ancla del JWT.
// - role:  autorización (guard + BFF).
// - error: notificación de sesión expirada.
//
// Los tokens de acceso/refresco viven en el JWT, no se exponen aquí.
//
// DefaultSession['user'] tipa name/email/image pero no los rellenamos:
// los datos de presentación se obtienen del BFF vía GraphQL.
// subscription se removió por la misma razón y no debe reintroducirse.
interface UserProfile {
  id: string;
  role: UserRole;
}

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & UserProfile;
    error?: 'RefreshTokenExpired' | 'RefreshTokenError';
  }

  interface User extends DefaultUser, UserProfile {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    refreshTokenExpires?: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT, Partial<UserProfile> {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    refreshTokenExpires?: number;
    error?: 'RefreshTokenExpired' | 'RefreshTokenError';
  }
}
