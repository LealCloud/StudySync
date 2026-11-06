// Singleton de PrismaClient para el runtime de Next.js.
//
// Motivo del singleton: en desarrollo, el HMR de Next.js re-evalúa
// los módulos en cada cambio. Sin este patrón, cada re-evaluación
// crearía un PrismaClient nuevo y agotaría el pool de conexiones a
// PostgreSQL (P2024: Timed out fetching a new connection).
//
// Guardamos la instancia en `globalThis.prisma` para que sobreviva
// a las recargas de módulos. En producción (`NODE_ENV === 'production'`)
// el módulo se evalúa una sola vez por proceso y el `globalThis` no
// hace falta, pero mantener el mismo camino simplifica el código.
//
// Referencia oficial:
// https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices

import 'server-only';

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// En desarrollo mostramos queries para depurar; en producción, solo
// errores y warnings. Ajustable si el ruido es excesivo.
const logLevels: ('query' | 'error' | 'warn')[] =
  process.env.NODE_ENV === 'development'
    ? ['query', 'warn', 'error']
    : ['warn', 'error'];

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: logLevels,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
