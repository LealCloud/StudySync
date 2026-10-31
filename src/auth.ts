import { createPublicBackendClient } from '@/lib/backend';
import { getClientIp } from '@/lib/clientIp';
import { checkRateLimit } from '@/lib/ratelimit';
import { loginSchema } from '@/lib/schemas/auth/login.schema';
import type { UserRole } from '@/types/next-auth';
import NextAuth, { CredentialsSignin } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

// ============================================================
// CONSTANTES Y CONFIGURACIÓN
// ============================================================

// Rol permitido tal como lo devuelve el backend.
const UserRoleSchema = z.enum(['student', 'teacher', 'admin']);

// Metadatos aceptados por el logger estructurado.
interface LogMeta {
  [key: string]: string | number | boolean | object | undefined;
}

// Debe coincidir con el TTL del refresh token en el backend.
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 días = 604 800 s

// Renovar el access token un poco antes de que caduque.
const REFRESH_MARGIN_MS = 30_000; // 30 s

// Par de tokens devuelto por /auth/login y /auth/refresh.
//
// token:            access token utilizado para autenticarse contra el backend.
// refreshToken:     credencial usada exclusivamente por Auth.js para pedir
//                   nuevos access tokens.
// expiresIn:        vida útil del access token en segundos.
// refreshExpiresIn: vida útil del refresh token en segundos.
const TokenPairSchema = z.object({
  token: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().positive(),
  refreshExpiresIn: z.number().positive(),
});

// ============================================================
// ERRORES DE LOGIN CON CÓDIGO
// Auth.js propaga `code` al cliente cuando se usa signIn con
// redirect: false, de modo que el formulario puede traducirlo.
// Cualquier otro fallo se trata como credenciales inválidas
// devolviendo null desde authorize.
// ============================================================
class RateLimitedError extends CredentialsSignin {
  code = 'rateLimited';
}

class UnavailableError extends CredentialsSignin {
  code = 'unavailable';
}

// Campos que Auth.js y el BFF necesitan de la respuesta de login.
// El resto de datos de presentación (nombre, correo, imagen, suscripción)
// se obtiene del BFF vía GraphQL, no de la sesión.
interface LoginSuccessResponse {
  status: 200;
  message: string;
  data: {
    id: string;
    role: UserRole;
    token: string;
    refreshToken: string;
    expiresIn: number;
    refreshExpiresIn: number;
  };
}

// ============================================================
// LOGS ESTRUCTURADOS (JSON en una sola línea)
// ============================================================
const logger = {
  info: (message: string, meta?: LogMeta) => {
    console.log(
      JSON.stringify({
        level: 'info',
        service: 'auth-credentials',
        timestamp: new Date().toISOString(),
        message,
        ...meta,
      }),
    );
  },
  error: (message: string, meta?: LogMeta) => {
    console.error(
      JSON.stringify({
        level: 'error',
        service: 'auth-credentials',
        timestamp: new Date().toISOString(),
        message,
        ...meta,
      }),
    );
  },
};

// Type guard: comprueba que la respuesta tiene la forma mínima que
// necesita el flujo de autenticación antes de acceder a sus campos.
const isLoginSuccessResponse = (
  value: unknown,
): value is LoginSuccessResponse => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const response = value as Partial<LoginSuccessResponse>;
  const data = response.data;

  if (response.status !== 200 || !data) return false;

  const role = UserRoleSchema.safeParse(data.role);

  return (
    typeof data.id === 'string' &&
    role.success &&
    typeof data.token === 'string' &&
    typeof data.refreshToken === 'string' &&
    typeof data.expiresIn === 'number' &&
    data.expiresIn > 0 &&
    typeof data.refreshExpiresIn === 'number' &&
    data.refreshExpiresIn > 0
  );
};

// ============================================================
// RENOVACIÓN DE TOKENS
// ============================================================
// Evita que varias peticiones concurrentes usen el mismo refresh
// token a la vez: la primera lanza la petición y las demás esperan
// su resultado.
const refreshInFlight = new Map<string, Promise<JWT>>();

// Llama a /auth/refresh y devuelve un JWT actualizado.
// - Si no hay refreshToken → error de configuración.
// - Si el refresh ya caducó o el backend responde 401/403 → sesión terminada.
// - Si el fallo es transitorio (red, 5xx, formato raro) → se conserva el
//   token actual y se reintentará en la próxima petición.
async function requestRefresh(token: JWT): Promise<JWT> {
  if (!token.refreshToken) {
    return {
      ...token,
      error: 'RefreshTokenError',
    };
  }

  if (token.refreshTokenExpires && Date.now() >= token.refreshTokenExpires) {
    return {
      ...token,
      error: 'RefreshTokenExpired',
    };
  }

  try {
    const res = await createPublicBackendClient().auth.refresh(
      token.refreshToken,
    );

    // Refresh token inválido, expirado o revocado.
    // La sesión ya no puede continuar.
    if (res.status === 401 || res.status === 403) {
      logger.info('Refresh token rechazado por el backend');

      return {
        ...token,
        error: 'RefreshTokenExpired',
      };
    }

    // Error temporal del backend.
    // Conservamos el token para poder reintentar.
    if (!res.ok) {
      logger.error('Fallo temporal al renovar el token', {
        status: res.status,
      });

      return token;
    }

    const parsed = TokenPairSchema.safeParse(
      (res.body as { data?: unknown } | null)?.data,
    );

    if (!parsed.success) {
      logger.error('Respuesta de refresh con formato inesperado');

      return token;
    }

    const now = Date.now();

    return {
      ...token,

      // Nuevo access token.
      accessToken: parsed.data.token,

      // El backend puede rotar el refresh token.
      refreshToken: parsed.data.refreshToken,

      accessTokenExpires: now + parsed.data.expiresIn * 1000,

      refreshTokenExpires: now + parsed.data.refreshExpiresIn * 1000,

      error: undefined,
    };
  } catch (error) {
    logger.error('Error de red al renovar el token', {
      error: error instanceof Error ? error.message : 'Desconocido',
    });

    return token;
  }
}

// Deduplica llamadas concurrentes al refresh usando el refreshToken
// como clave. Esto es importante si el backend utiliza refresh-token
// rotation: dos refresh simultáneos podrían intentar consumir el mismo
// refresh token y provocar que uno de ellos sea rechazado.
function refreshAccessToken(token: JWT): Promise<JWT> {
  const key = token.refreshToken ?? '';
  const pending = refreshInFlight.get(key);
  if (pending) return pending;

  const promise = requestRefresh(token).finally(() =>
    refreshInFlight.delete(key),
  );
  refreshInFlight.set(key, promise);
  return promise;
}

// ============================================================
// CONFIGURACIÓN DE NEXT-AUTH
// ============================================================
export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE,
  },
  providers: [
    Credentials({
      name: 'Credenciales',
      credentials: {
        email: { label: 'Correo', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },

      // Flujo completo del login por credenciales:
      //   0) rate limit por IP
      //   1) validación del payload con Zod
      //   2) rate limit por email
      //   3) POST /auth/login a través del cliente REST compartido
      //   4) parseo y validación de la respuesta
      //   5) validación del rol
      //   6) validación del par de tokens
      //   7) construcción del objeto usuario para Auth.js
      async authorize(credentials, request) {
        try {
          // 0. Rate limit por IP
          const ip = getClientIp(request);

          const limitResult = await checkRateLimit(
            `login-ip:${ip}`,
            10,
            '10 m',
          );

          if (!limitResult.success) {
            logger.error('Rate limit excedido por IP', { ip });
            throw new RateLimitedError();
          }

          // 1. Validación de formato con Zod
          const result = loginSchema.safeParse(credentials);
          if (!result.success) {
            logger.info('Validación de Zod fallida en login');
            return null;
          }

          const { email, password } = result.data;

          // 2. Rate limit adicional por email
          const emailLimitResult = await checkRateLimit(
            `login-email:${email.toLowerCase()}`,
            5,
            '10 m',
          );
          if (!emailLimitResult.success) {
            logger.error('Rate limit excedido por email', { email });
            throw new RateLimitedError();
          }

          // 3. Llamada al backend a través del cliente REST compartido.
          let response: Awaited<
            ReturnType<
              ReturnType<typeof createPublicBackendClient>['auth']['login']
            >
          >;
          try {
            response = await createPublicBackendClient().auth.login({
              email,
              password,
            });
          } catch (error) {
            logger.error('Error de conexión o timeout con el backend externo', {
              email,
              error: error instanceof Error ? error.message : 'Desconocido',
            });
            throw new UnavailableError();
          }

          // 4. Parseo defensivo: si el cuerpo no es JSON válido se decide
          //    entre credenciales inválidas (4xx) o backend caído (5xx).
          const data: unknown = response.body;

          if (!response.ok || !isLoginSuccessResponse(data)) {
            logger.error('Credenciales rechazadas por el backend externo', {
              status: response.status,
              email,
            });
            if (response.status >= 500) throw new UnavailableError();
            return null;
          }

          // 5. Validar que el rol devuelto esté entre los permitidos.
          const roleParse = UserRoleSchema.safeParse(data.data.role);
          if (!roleParse.success) {
            logger.error('Rol inválido devuelto por el backend', {
              role: data.data.role,
              id: data.data.id,
            });
            return null;
          }

          const role: UserRole = roleParse.data;

          // 6. Sin par de tokens no hay sesión válida.
          const tokens = TokenPairSchema.safeParse(data.data);

          if (!tokens.success) {
            logger.error('El backend no devolvió el par de tokens esperado', {
              id: data.data.id,
            });

            throw new UnavailableError();
          }

          logger.info('Autenticación exitosa con backend externo', {
            email,
            id: data.data.id,
            rol: role,
          });

          // 7. Objeto usuario que Auth.js guardará en el JWT.
          // Solo lleva lo necesario para autenticación y autorización.
          // Los datos de presentación (nombre, correo, imagen, suscripción)
          // se obtienen del BFF vía GraphQL, no de la sesión.
          const now = Date.now();
          return {
            id: String(data.data.id),
            role,
            accessToken: tokens.data.token,
            refreshToken: tokens.data.refreshToken,
            accessTokenExpires: now + tokens.data.expiresIn * 1000,
            refreshTokenExpires: now + tokens.data.refreshExpiresIn * 1000,
          };
        } catch (error) {
          // Los CredentialsSignin ya llevan su propio código; se relanzan
          // tal cual para que el cliente los reciba.
          if (error instanceof CredentialsSignin) throw error;

          logger.error('Error interno crítico en authorize', {
            error: error instanceof Error ? error.message : 'Desconocido',
          });
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    // jwt se ejecuta en cada petición:
    //  - Al iniciar sesión rellena el token con los datos del usuario.
    //  - Si ya hay un error de refresh, no reintenta.
    //  - Si el access token sigue vigente (con margen), lo deja tal cual.
    //  - En caso contrario, lanza la renovación.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpires = user.accessTokenExpires;
        token.refreshTokenExpires = user.refreshTokenExpires;
        token.error = undefined;
        return token;
      }

      if (token.error) return token;

      if (
        token.accessTokenExpires &&
        Date.now() < token.accessTokenExpires - REFRESH_MARGIN_MS
      ) {
        return token;
      }

      return refreshAccessToken(token);
    },

    // session.user se limita a lo necesario para autenticación y autorización:
    //   - id:    ancla del JWT.
    //   - role:  autorización (guard + BFF).
    //   - error: notificación de sesión expirada.
    //
    // Los tokens de acceso y refresco viven en el JWT, no se exponen aquí.
    // Los datos de presentación (nombre, correo, imagen, suscripción) se
    // obtienen del BFF vía GraphQL.
    //
    // id y role están garantizados por `authorize` (única fuente del JWT);
    // no se añaden guards porque el tipo Session ya los declara obligatorios
    // y Auth.js rechaza cualquier JWT que no venga de este flujo.
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as UserRole;
      session.error = token.error;
      return session;
    },
  },
  events: {
    // Al cerrar sesión, revoca el refresh token en el backend para que
    // no pueda reutilizarse. Si falla, solo se registra: la sesión local
    // ya se destruyó de todas formas.
    async signOut(message) {
      if (!('token' in message) || !message.token?.refreshToken) return;
      try {
        await createPublicBackendClient().auth.logout(
          message.token.refreshToken,
        );
      } catch {
        logger.error('No se pudo revocar el refresh token en el backend');
      }
    },
  },
});
