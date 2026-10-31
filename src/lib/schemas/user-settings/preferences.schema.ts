// Schema del input de `updatePreferences(input)` (contrato §5.4 /
// docs/backend-api/_rutas/users-me/preferences.md).
//
// Forma: input PATCH parcial.
//   - Campo omitido (`undefined`) → no se modifica.
//   - `null` → RECHAZADO. Preferences es la excepción a la regla
//     general del contrato (§8.2.16): todos los campos son
//     obligatorios en la respuesta y no tienen estado "vacío" válido.
//     El BFF también lo rechaza con `422 VALIDATION_ERROR`; este
//     schema lo hace imposible en el cliente.
//   - Valor → se asigna.
//
// Objetos anidados (`notifications`, `accessibility`): PATCH parcial
// dentro de PATCH parcial. Enviar `{ email: true }` no modifica
// `push` ni `inApp`. Enviar `{}` equivale a omitir el objeto.
// Enviar `null` → rechazado (regla de la excepción).
//
// Los mensajes son claves del namespace `Validation` (i18n),
// no texto final. `resolveError` los traduce.

import { isValidTimezone } from '@/lib/schemas/primitives';
import { z } from 'zod';

/* ============================================================
 * ENUMS
 * ============================================================ */

/**
 * Locales soportados por el frontend (`es | en`).
 * BACKEND_API.md §8 / §8.2.16. El BFF también lo valida.
 */
const languageSchema = z.enum(['es', 'en'], {
  message: 'preferences.language.invalid',
});

/**
 * Temas soportados (`system | light | dark`).
 * BACKEND_API.md §8 / §8.2.16.
 */
const themeSchema = z.enum(['system', 'light', 'dark'], {
  message: 'preferences.theme.invalid',
});

/* ============================================================
 * TIMEZONE
 * ============================================================ */

/**
 * Zona horaria IANA válida (delegado a `Intl`).
 * BACKEND_API.md §8 / §8.2.16.
 */
// TODO(contract): actualizar §8.2.16 de `docs/backend-api/_rutas/users-me/preferences.md`
// para documentar `trim()` en `timezone` antes de validar. Decisión del
// cliente: todo string de entrada se normaliza con `trim()` por
// consistencia. El backend debe ajustarse a esta regla: recibir el valor
// ya normalizado y aplicar la misma normalización como defensa en
// profundidad. `timezone` es case-sensitive (`America/Bogota` ≠
// `america/bogota`), así que NO se aplica `toLowerCase()`.
const timezoneSchema = z
  .string()
  .trim()
  .refine((value) => isValidTimezone(value), {
    message: 'preferences.timezone.invalid',
  });

/* ============================================================
 * NOTIFICACIONES
 * ============================================================ */

/**
 * `NotificationPreferencesInput`: 3 booleanos opcionales.
 * Enviar `{}` no modifica ningún subcampo. Enviar `null` → rechazado.
 */
const notificationPreferencesSchema = z.object({
  email: z
    .boolean({ message: 'preferences.notifications.email.invalid' })
    .optional(),
  push: z
    .boolean({ message: 'preferences.notifications.push.invalid' })
    .optional(),
  inApp: z
    .boolean({ message: 'preferences.notifications.inApp.invalid' })
    .optional(),
});

/* ============================================================
 * ACCESIBILIDAD
 * ============================================================ */

/**
 * `AccessibilityPreferencesInput`: 2 booleanos opcionales.
 * Enviar `{}` no modifica ningún subcampo. Enviar `null` → rechazado.
 */
const accessibilityPreferencesSchema = z.object({
  reducedMotion: z
    .boolean({ message: 'preferences.accessibility.reducedMotion.invalid' })
    .optional(),
  highContrast: z
    .boolean({ message: 'preferences.accessibility.highContrast.invalid' })
    .optional(),
});

/* ============================================================
 * SCHEMA PÚBLICO
 * ============================================================ */

/**
 * Nota: no se usa `.nullable()` ni `.nullish()` en ningún campo,
 * ni en los objetos anidados. El contrato §8.2.16 rechaza `null`
 * con `422`; el schema lo refleja dejando el tipo como
 * `T | undefined` (nunca `null`).
 */
export const preferencesSchema = z.object({
  language: languageSchema.optional(),
  theme: themeSchema.optional(),
  timezone: timezoneSchema.optional(),
  notifications: notificationPreferencesSchema.optional(),
  accessibility: accessibilityPreferencesSchema.optional(),
});

export type PreferencesInput = z.infer<typeof preferencesSchema>;
export type NotificationPreferencesInput = z.infer<
  typeof notificationPreferencesSchema
>;
export type AccessibilityPreferencesInput = z.infer<
  typeof accessibilityPreferencesSchema
>;
