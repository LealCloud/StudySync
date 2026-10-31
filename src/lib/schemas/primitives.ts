/**
 * Fuente única de verdad de las reglas de validación del contrato
 * `docs/BACKEND_API.md` (v1.3).
 *
 * Se usan en tres lugares:
 *   - los schemas Zod del cliente (`src/lib/schemas/**`)
 *   - los resolvers del BFF cuando validan antes de llamar al backend
 *   - el `MockBackendClient` para replicar el comportamiento del backend
 *
 * Ninguna de estas funciones debe divergir del contrato. Si cambia una
 * regla en `BACKEND_API.md`, se cambia acá y se propaga sola.
 */

/* ============================================================
 * CONSTANTES DE LONGITUD
 * ============================================================ */

export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 100;
export const EMAIL_MAX_LENGTH = 254;
export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 15;
export const INTEREST_MAX_COUNT = 20;
export const INTEREST_MIN_LENGTH = 1;
export const INTEREST_MAX_LENGTH = 40;
export const BIO_TITLE_MIN_LENGTH = 1;
export const BIO_TITLE_MAX_LENGTH = 100;
export const BIO_DESCRIPTION_MIN_LENGTH = 1;
export const BIO_DESCRIPTION_MAX_LENGTH = 500;
export const DOCUMENT_ID_MIN_LENGTH = 1;
export const DOCUMENT_ID_MAX_LENGTH = 30;
export const ADDRESS_MIN_LENGTH = 1;
export const ADDRESS_MAX_LENGTH = 200;
export const PHONE_MIN_LENGTH = 8;
export const PHONE_MAX_LENGTH = 16;
export const SUBJECT_MIN_LENGTH = 5;
export const SUBJECT_MAX_LENGTH = 150;
export const MESSAGE_MIN_LENGTH = 20;
export const MESSAGE_MAX_LENGTH = 2000;

/* ============================================================
 * ENUMS / CATÁLOGOS
 * ============================================================ */

/** Locales soportados por el frontend. BACKEND_API.md §8 / §8.1. */
export const SUPPORTED_LANGUAGES = ['es', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Temas soportados. BACKEND_API.md §8 / §8.1. */
export const SUPPORTED_THEMES = ['system', 'light', 'dark'] as const;
export type SupportedTheme = (typeof SUPPORTED_THEMES)[number];

/**
 * Planes asignables por API. `enterprise` queda fuera:
 * se contrata por el formulario de contacto. BACKEND_API.md §6.
 */
export const ASSIGNABLE_PLANS = ['free', 'premium'] as const;
export type AssignablePlan = (typeof ASSIGNABLE_PLANS)[number];

/* ============================================================
 * REGEX
 * ============================================================ */

/**
 * Nombre/apellido: letras Unicode, espacios, apóstrofes, guiones y puntos.
 * BACKEND_API.md §3.4, §3.7.
 */
export const NAME_REGEX = /^[\p{L}\s'.-]+$/u;

/**
 * Contraseña: al menos una minúscula, una mayúscula y un carácter especial.
 * La longitud la valida cada schema por separado (min/max).
 * BACKEND_API.md §3.4, §3.8.
 */
export const PASSWORD_COMPLEXITY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};:'",.<>/?\\|`~])/;

/**
 * Código 2FA: exactamente 6 dígitos numéricos.
 * BACKEND_API.md §3.8, §8.2.14.
 */
export const TWO_FACTOR_CODE_REGEX = /^\d{6}$/;

/**
 * Número de documento: alfanumérico + guion.
 * BACKEND_API.md §3.7.
 */
export const DOCUMENT_ID_REGEX = /^[A-Za-z0-9-]+$/;

/**
 * País ISO 3166-1 alpha-2 en mayúsculas.
 * BACKEND_API.md §3.7.
 */
export const COUNTRY_REGEX = /^[A-Z]{2}$/;

/**
 * Dirección: letras, dígitos, espacios y `.,-#/°`.
 * BACKEND_API.md §3.7.
 */
export const ADDRESS_REGEX = /^[\p{L}\p{N}\s.,\-/#°]+$/u;

/**
 * Asunto de contacto: no admite `<`, `>`, `{` ni `}`.
 * BACKEND_API.md §3.4.
 */
export const SUBJECT_FORBIDDEN_REGEX = /^[^<>{}]*$/;

/**
 * Mensaje de contacto: no admite `<` ni `>`.
 * BACKEND_API.md §3.4.
 */
export const MESSAGE_FORBIDDEN_REGEX = /^[^<>]*$/;

/**
 * Data URI de imagen con payload base64.
 * BACKEND_API.md §3.6.
 */
export const DATA_URI_IMAGE_REGEX =
  /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/;

/**
 * URL absoluta http(s). BACKEND_API.md §3.6.
 */
export const ABSOLUTE_HTTP_URL_REGEX = /^https?:\/\/[^\s]+$/i;

/* ============================================================
 * HELPERS DE VALIDACIÓN
 * ============================================================ */

/** Nombre/apellido válido: 2-100 chars, solo letras y los signos permitidos. */
export function isValidName(value: string): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length < NAME_MIN_LENGTH || trimmed.length > NAME_MAX_LENGTH) {
    return false;
  }
  return NAME_REGEX.test(trimmed);
}

/** Email con formato válido y hasta 254 caracteres. No normaliza. */
export function isValidEmail(value: string): boolean {
  if (typeof value !== 'string') return false;
  if (value.length > EMAIL_MAX_LENGTH) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Normaliza un email al formato que espera el backend:
 * `trim` + `toLowerCase`. No valida; para eso usar `isValidEmail`.
 * BACKEND_API.md §3.4.
 */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Contraseña válida según el contrato v1.3: 6-15 caracteres,
 * al menos una minúscula, una mayúscula y un carácter especial.
 */
export function isValidPassword(value: string): boolean {
  if (typeof value !== 'string') return false;
  if (
    value.length < PASSWORD_MIN_LENGTH ||
    value.length > PASSWORD_MAX_LENGTH
  ) {
    return false;
  }
  return PASSWORD_COMPLEXITY_REGEX.test(value);
}

/** Teléfono E.164: `+` seguido de 8-16 caracteres totales. */
export function isValidE164(value: string): boolean {
  if (typeof value !== 'string') return false;
  if (value.length < PHONE_MIN_LENGTH || value.length > PHONE_MAX_LENGTH) {
    return false;
  }
  return /^\+[1-9]\d{1,14}$/.test(value);
}

/** Código de país ISO 3166-1 alpha-2 en mayúsculas. */
export function isValidCountryCode(value: string): boolean {
  if (typeof value !== 'string') return false;
  return COUNTRY_REGEX.test(value);
}

/** Zona horaria IANA válida (delegado a `Intl`). */
export function isValidTimezone(value: string): boolean {
  if (typeof value !== 'string' || value.length === 0) return false;
  try {
    Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** Código 2FA de 6 dígitos. */
export function isValidTwoFactorCode(value: string): boolean {
  if (typeof value !== 'string') return false;
  return TWO_FACTOR_CODE_REGEX.test(value);
}

/** Número de documento: 1-30 alfanumérico + guion. */
export function isValidDocumentId(value: string): boolean {
  if (typeof value !== 'string') return false;
  if (
    value.length < DOCUMENT_ID_MIN_LENGTH ||
    value.length > DOCUMENT_ID_MAX_LENGTH
  ) {
    return false;
  }
  return DOCUMENT_ID_REGEX.test(value);
}

/** Asunto de contacto: 5-150, sin `<`, `>`, `{` ni `}`. */
export function isValidContactSubject(value: string): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (
    trimmed.length < SUBJECT_MIN_LENGTH ||
    trimmed.length > SUBJECT_MAX_LENGTH
  ) {
    return false;
  }
  return SUBJECT_FORBIDDEN_REGEX.test(trimmed);
}

/** Mensaje de contacto: 20-2000, sin `<` ni `>`. */
export function isValidContactMessage(value: string): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (
    trimmed.length < MESSAGE_MIN_LENGTH ||
    trimmed.length > MESSAGE_MAX_LENGTH
  ) {
    return false;
  }
  return MESSAGE_FORBIDDEN_REGEX.test(trimmed);
}

/** Locale soportado (`es` | `en`). */
export function isValidLanguage(value: unknown): value is SupportedLanguage {
  return (
    typeof value === 'string' &&
    (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
  );
}

/** Tema soportado (`system` | `light` | `dark`). */
export function isValidTheme(value: unknown): value is SupportedTheme {
  return (
    typeof value === 'string' &&
    (SUPPORTED_THEMES as readonly string[]).includes(value)
  );
}

/** Plan asignable por API (`free` | `premium`). */
export function isAssignablePlan(value: unknown): value is AssignablePlan {
  return (
    typeof value === 'string' &&
    (ASSIGNABLE_PLANS as readonly string[]).includes(value)
  );
}

/**
 * `image` acepta:
 *   - URL absoluta `http(s)`
 *   - URL protocol-relative (`//…`)
 *   - data URI de imagen con payload base64
 *   - `null` (sin imagen)
 * BACKEND_API.md §3.6.
 */
export function isValidProfileImage(value: unknown): value is string | null {
  if (value === null) return true;
  if (typeof value !== 'string' || value.length === 0) return false;
  if (value.startsWith('//')) return true;
  if (value.startsWith('data:')) return DATA_URI_IMAGE_REGEX.test(value);
  return ABSOLUTE_HTTP_URL_REGEX.test(value);
}
