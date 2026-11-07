import { authenticateUser } from '@/lib/domain/auth';
import { getClientIp } from '@/lib/clientIp';
import { checkRateLimit } from '@/lib/ratelimit';
import { loginSchema } from '@/lib/schemas/auth/login.schema';
import type { UserRole } from '@/types/next-auth';
import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

// ============================================================
// CONSTANTES Y CONFIGURACIÓN
// ============================================================

// Auth.js renueva el JWT automáticamente mientras la sesión esté
// activa. El TTL de 7 días se conserva para no cambiar el
// comportamiento de los usuarios (ver D-4.1, D-4.2).
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 días = 604 800 s

// ============================================================
// ERRORES DE LOGIN CON CÓDIGO
// Auth.js propaga `code` al cliente cuando se usa signIn con
// redirect: false, de modo que el formulario puede traducirlo.
// ============================================================
class RateLimitedError extends CredentialsSignin {
  code = 'rateLimited';
}

// ============================================================
// LOGS ESTRUCTURADOS (JSON en una sola línea)
// ============================================================
interface LogMeta {
  [key: string]: string | number | boolean | object | undefined;
}

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

      // Flujo del login por credenciales:
      //   0) rate limit por IP
      //   1) validación del payload con Zod
      //   2) rate limit por email
      //   3) authenticateUser(email, password) → bcrypt.compare
      //   4) devolver { id, role } a Auth.js
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
          const normalizedEmail = email.toLowerCase();

          // 2. Rate limit adicional por email
          const emailLimitResult = await checkRateLimit(
            `login-email:${normalizedEmail}`,
            5,
            '10 m',
          );
          if (!emailLimitResult.success) {
            logger.error('Rate limit excedido por email', { email });
            throw new RateLimitedError();
          }

          // 3. authenticateUser → bcrypt.compare
          const user = await authenticateUser(normalizedEmail, password);

          logger.info('Autenticación exitosa', {
            email: normalizedEmail,
            id: user.id,
            rol: user.role,
          });

          // 4. Auth.js firma el JWT con { id, role } en callbacks.jwt.
          return { id: user.id, role: user.role };
        } catch (error) {
          // Los CredentialsSignin ya llevan su propio código; se
          // relanzan tal cual para que el cliente los reciba.
          if (error instanceof CredentialsSignin) throw error;

          // Cualquier otro fallo (BackendOperationError 401, red,
          // Prisma caído) → credenciales inválidas.
          logger.error('Error interno en authorize', {
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
    // En el primer login, copia id y role al JWT firmado.
    // En peticiones posteriores, devuelve el token tal cual
    // (Auth.js renueva la sesión automáticamente por maxAge).
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as UserRole;
      }
      return token;
    },

    // session.user se limita a { id, role }. Sin error, sin tokens.
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as UserRole;
      return session;
    },
  },
});
