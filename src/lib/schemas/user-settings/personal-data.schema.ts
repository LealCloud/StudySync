// src/lib/schemas/user-settings/personal-data.schema.ts
//
// Schema del input de `updatePersonalData(input)` (contrato §5.2 /
// docs/backend-api/_rutas/users-me/personal-data.md).
//
// Forma: input PATCH parcial (decisión A de Fase 3).
//   - Campo omitido (`undefined`) → no se modifica.
//   - `null` → borra (solo donde el contrato lo permite:
//     `documentType`, `documentId`, `phone`, `country`, `address`).
//     `firstName` y `lastName` NO aceptan `null` (422 VALIDATION_ERROR).
//   - Valor → se asigna.
//
// `identityLocked` NO forma parte del schema: es solo lectura y el
// cliente nunca lo envía (reglas-transversales.md §4). La regla
// "campos de identidad bloqueados → 403 FORBIDDEN" vive en el BFF.
//
// La regla "documentType y documentId van juntos o ninguno" NO vive
// aquí: es de UI (§5.2.8 del plan). El schema valida cada campo
// individualmente si está presente.
//
// Los mensajes son claves del namespace `Validation` (i18n),
// no texto final. `resolveError` los traduce.

import { firstNameField, lastNameField } from '@/lib/schemas/fields/auth';
import {
  ADDRESS_MAX_LENGTH,
  ADDRESS_MIN_LENGTH,
  ADDRESS_REGEX,
  DOCUMENT_ID_MAX_LENGTH,
  DOCUMENT_ID_MIN_LENGTH,
  DOCUMENT_ID_REGEX,
  isValidCountryCode,
  isValidE164,
} from '@/lib/schemas/primitives';
import { z } from 'zod';

// TODO(contract): actualizar §3.7 de `docs/backend-api/_rutas/users-me/personal-data.md`
// para documentar `trim()` en `documentId`, `phone`, `country` y `address`
// antes de validar. Decisión del cliente: todo string de entrada se
// normaliza con `trim()` por consistencia con `email`/`firstName`/`lastName`,
// y para que `"   "` no pase el `min(1)`. El backend debe ajustarse a esta
// regla: recibir el valor ya normalizado (el frontend lo envía limpio) y
// aplicar la misma normalización como defensa en profundidad.

/* ============================================================
 * DOCUMENT TYPE
 * ============================================================ */

/**
 * Enum cerrado del contrato: `passport | dni`. Nullable (borra el
 * tipo de documento). Ver §5.2.1 y `_rutas/users-me/personal-data.md`.
 */
const documentTypeSchema = z.enum(['passport', 'dni'], {
  message: 'documentType.invalid',
});

/* ============================================================
 * DOCUMENT ID
 * ============================================================ */

/**
 * 1-30 caracteres alfanuméricos + guion. Nullable (borra el número).
 * Regex: `^[A-Za-z0-9-]+$`. Ver §5.2.7.
 */
const documentIdSchema = z
  .string()
  .trim()
  .min(DOCUMENT_ID_MIN_LENGTH, 'documentId.min')
  .max(DOCUMENT_ID_MAX_LENGTH, 'documentId.max')
  .refine((value) => DOCUMENT_ID_REGEX.test(value), {
    message: 'documentId.invalid',
  });

/* ============================================================
 * PHONE
 * ============================================================ */

/**
 * E.164 estricto: `+` seguido de 8-16 caracteres totales,
 * primer dígito tras `+` distinto de 0. Nullable (borra el teléfono).
 * Regex: `^\+[1-9]\d{1,14}$`. Ver §5.2.7.
 */
const phoneSchema = z
  .string()
  .trim()
  .refine((value) => isValidE164(value), {
    message: 'phone.invalid',
  });

/* ============================================================
 * COUNTRY
 * ============================================================ */

/**
 * ISO 3166-1 alpha-2 en mayúsculas. Nullable (borra el país).
 * Regex: `^[A-Z]{2}$`. El catálogo vive en
 * `src/config/countries.ts`; el schema solo valida el formato.
 * Ver §5.2.7.
 */
const countrySchema = z
  .string()
  .trim()
  .refine((value) => isValidCountryCode(value), {
    message: 'country.invalid',
  });

/* ============================================================
 * ADDRESS
 * ============================================================ */

/**
 * 1-200 caracteres. Letras Unicode, dígitos, espacios y `.,-#/°`.
 * Nullable (borra la dirección). Ver §5.2.7.
 */
const addressSchema = z
  .string()
  .trim()
  .min(ADDRESS_MIN_LENGTH, 'address.min')
  .max(ADDRESS_MAX_LENGTH, 'address.max')
  .refine((value) => ADDRESS_REGEX.test(value), {
    message: 'address.invalid',
  });

/* ============================================================
 * SCHEMA PÚBLICO
 * ============================================================ */

/**
 * Reglas de null por campo (contrato §5.2.3):
 *   - firstName / lastName: NO null. Reutilizan `firstNameField` /
 *     `lastNameField` de `fields/auth.ts` (mismas reglas que el
 *     registro: 2-100, regex `^[\p{L}\s'.-]+$`).
 *   - documentType / documentId / phone / country / address: null
 *     permitido (borra el valor).
 */
export const personalDataSchema = z
  .object({
    firstName: firstNameField.optional(),
    lastName: lastNameField.optional(),
    documentType: documentTypeSchema.nullable().optional(),
    documentId: documentIdSchema.nullable().optional(),
    phone: phoneSchema.nullable().optional(),
    country: countrySchema.nullable().optional(),
    address: addressSchema.nullable().optional(),
  })
  .superRefine((data, ctx) => {
    const hasDocumentType =
      data.documentType !== null && data.documentType !== undefined;
    const hasDocumentId =
      data.documentId !== null && data.documentId !== undefined;

    if (hasDocumentType !== hasDocumentId) {
      ctx.addIssue({
        code: 'custom',
        path: ['documentId'],
        message: 'documentId.invalid',
      });
    }
  });

export type PersonalDataInput = z.infer<typeof personalDataSchema>;
