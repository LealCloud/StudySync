// docs/backend-api/_rutas/users-me/privacy.md).
//
// Forma: input PATCH parcial.
//   - Campo omitido (`undefined`) → no se modifica.
//   - `null` → RECHAZADO. Privacy es la excepción a la regla general
//     del contrato (§8.2.18): todos los campos son obligatorios en la
//     respuesta y no tienen estado "vacío" válido. El BFF también lo
//     rechaza con `422 VALIDATION_ERROR`; este schema lo hace imposible
//     en el cliente.
//   - Valor → se asigna.
//
// Los mensajes son claves del namespace `Validation` (i18n),
// no texto final. `resolveError` los traduce.

import { z } from 'zod';

/* ============================================================
 * ENUM ProfileVisibility
 * ============================================================ */

/**
 * Enum cerrado del contrato: `everyone | authenticated | nobody`.
 * Ver §5.5.1 y `_rutas/users-me/privacy.md`.
 */
const profileVisibilitySchema = z.enum(
  ['everyone', 'authenticated', 'nobody'],
  { message: 'privacy.visibility.invalid' },
);

/* ============================================================
 * SCHEMA PÚBLICO
 * ============================================================ */

/**
 * Nota: no se usa `.nullish()` ni `.nullable()` en ningún campo.
 * El contrato §8.2.18 rechaza `null` con `422`; el schema lo refleja
 * dejando el tipo como `T | undefined` (nunca `null`).
 */
export const privacySchema = z.object({
  profileVisibility: profileVisibilitySchema.optional(),
  emailVisibility: profileVisibilitySchema.optional(),
  phoneVisibility: profileVisibilitySchema.optional(),
  allowDirectMessages: z
    .boolean({ message: 'privacy.allowDirectMessages.invalid' })
    .optional(),
});

export type PrivacyInput = z.infer<typeof privacySchema>;
