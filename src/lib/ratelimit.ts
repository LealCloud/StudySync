import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ==========================================
// TIPOS Y CONTRATOS
// ==========================================

export interface RateLimitResult {
  success: boolean; // ¿Petición permitida?
  limit: number; // Límite máximo
  remaining: number; // Peticiones restantes
  reset: number; // Timestamp de reinicio (segundos)
  pending?: Promise<unknown>; // Para operaciones asíncronas
}

interface LimiterService {
  limit: (
    identifier: string,
    maxRequests?: number,
    windowDuration?: string,
  ) => Promise<RateLimitResult>;
}

// ==========================================
// ESTADO GLOBAL Y LIMPIEZA
// ==========================================

/** Mapa de memoria: identificador -> { contador, tiempoReinicio } */
const memoryMap = new Map<string, { count: number; resetTime: number }>();

/** Limpieza automática cada 5 minutos para evitar memory leak */
const CLEANUP_INTERVAL = 5 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  let deletedCount = 0;

  for (const [key, value] of memoryMap.entries()) {
    if (now > value.resetTime) {
      memoryMap.delete(key);
      deletedCount++;
    }
  }

  if (deletedCount > 0) {
    console.debug(
      `🧹 [RATE LIMIT] Limpiadas ${deletedCount} entradas expiradas`,
    );
  }
}, CLEANUP_INTERVAL);

// ==========================================
// IMPLEMENTACIÓN EN MEMORIA (FALLBACK)
// ==========================================

/** Rate limiter en memoria RAM - Rápido pero no persistente */
const memoryLimiter: LimiterService = {
  async limit(
    identifier: string,
    maxRequests = 10,
    windowDuration = '10 m',
  ): Promise<RateLimitResult> {
    const now = Date.now();

    // Convertir string a milisegundos (ej: "10 m" -> 600000)
    let windowMs = 10 * 60 * 1000; // default: 10 minutos

    if (windowDuration.includes('s')) {
      windowMs = parseInt(windowDuration, 10) * 1000;
    } else if (windowDuration.includes('m')) {
      windowMs = parseInt(windowDuration, 10) * 60 * 1000;
    } else if (windowDuration.includes('h')) {
      windowMs = parseInt(windowDuration, 10) * 60 * 60 * 1000;
    } else if (windowDuration.includes('d')) {
      windowMs = parseInt(windowDuration, 10) * 24 * 60 * 60 * 1000;
    }

    // Obtener o crear registro para este identificador
    let record = memoryMap.get(identifier);

    if (!record || now > record.resetTime) {
      // Nueva ventana: iniciar contador en 1
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      memoryMap.set(identifier, record);
    } else {
      // Ventana activa: incrementar contador
      record.count += 1;
    }

    // Evaluar si la petición está dentro del límite
    const success = record.count <= maxRequests;
    const remaining = Math.max(0, maxRequests - record.count);

    return {
      success,
      limit: maxRequests,
      remaining,
      reset: Math.ceil(record.resetTime / 1000),
    };
  },
};

// ==========================================
// IMPLEMENTACIÓN CON REDIS (PRODUCCIÓN)
// ==========================================

/** Rate limiter con Redis - Persistente y escalable */
let redisLimiter: LimiterService | null = null;

const hasRedisConfig =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

if (hasRedisConfig) {
  try {
    const redis = Redis.fromEnv();

    redisLimiter = {
      async limit(
        identifier: string,
        maxRequests = 10,
        windowDuration = '10 m',
      ): Promise<RateLimitResult> {
        type WindowUnit = Parameters<typeof Ratelimit.fixedWindow>[1];

        // ⚠️ NOTA: Se crea nueva instancia en cada llamada (optimizable)
        const limiter = new Ratelimit({
          redis: redis,
          limiter: Ratelimit.fixedWindow(
            maxRequests,
            windowDuration as WindowUnit,
          ),
          analytics: true,
        });

        const result = await limiter.limit(identifier);

        return {
          success: result.success,
          limit: result.limit,
          remaining: result.remaining,
          reset: result.reset,
          pending: result.pending,
        };
      },
    };

    console.info('🟢 [RATE LIMIT] Usando Upstash Redis');
  } catch (error) {
    console.warn('⚠️ [RATE LIMIT] Error en Redis, usando memoria:', error);
    redisLimiter = null;
  }
} else {
  console.info('🟡 [RATE LIMIT] Usando almacenamiento en memoria');
}

// ==========================================
// EXPORTADOR PRINCIPAL
// ==========================================

/**
 * Aplica rate limiting con fallback automático
 * Prioriza Redis (producción) y cae a memoria si no está disponible
 *
 * @param identifier - Identificador único (IP, email, etc.)
 * @param maxRequests - Máximo de peticiones permitidas
 * @param windowStr - Duración de la ventana (ej: "10 m", "1 h")
 * @returns RateLimitResult con estado del rate limiting
 */
export const checkRateLimit = async (
  identifier: string,
  maxRequests = 10,
  windowStr = '10 m',
): Promise<RateLimitResult> => {
  // Validar inputs
  if (!identifier || typeof identifier !== 'string') {
    throw new Error('El identificador debe ser un string no vacío');
  }

  if (maxRequests <= 0) {
    throw new Error('maxRequests debe ser mayor que 0');
  }

  // Intentar Redis primero (producción)
  if (redisLimiter) {
    try {
      return await redisLimiter.limit(identifier, maxRequests, windowStr);
    } catch (error) {
      console.error('⚠️ [RATE LIMIT] Error en Redis, usando memoria:', error);
    }
  }

  // Fallback a memoria (desarrollo o error)
  return await memoryLimiter.limit(identifier, maxRequests, windowStr);
};

// ==========================================
// UTILIDADES
// ==========================================

/** Obtiene estadísticas del rate limiter para debugging */
export const getRateLimitStats = () => ({
  memoryEntries: memoryMap.size,
  redisAvailable: !!redisLimiter,
});

/** Limpia manualmente el caché de memoria (útil para tests) */
export const clearMemoryCache = () => {
  memoryMap.clear();
  console.info('🧹 [RATE LIMIT] Cache de memoria limpiado');
};


