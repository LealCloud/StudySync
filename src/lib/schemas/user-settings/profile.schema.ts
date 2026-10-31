// Schema del input de `updateProfile(input)` (contrato §3.6 / §5.1).
//
// Forma: input PATCH parcial (decisión A de Fase 3).
//   - Campo omitido (`undefined`) → no se modifica.
//   - `null` → borra (solo donde el contrato lo permite: `bio`,
//     `bio.title`, `bio.description`, `interests`, `image`).
//   - Valor → se asigna.
//
// El schema NO exige "al menos un campo". Esa regla es de UI
// (botón de guardar deshabilitado si no hay cambios).
//
// Los mensajes son claves del namespace `Validation` (i18n),
// no texto final. `resolveError` los traduce.

import {
  BIO_DESCRIPTION_MAX_LENGTH,
  BIO_DESCRIPTION_MIN_LENGTH,
  BIO_TITLE_MAX_LENGTH,
  BIO_TITLE_MIN_LENGTH,
  INTEREST_MAX_COUNT,
  INTEREST_MAX_LENGTH,
  INTEREST_MIN_LENGTH,
  isValidProfileImage,
} from '@/lib/schemas/primitives';
import { z } from 'zod';

/* ============================================================
 * BIO
 * ============================================================ */

// TODO(contract): actualizar §3.6 de `docs/backend-api/_rutas/users-me/profile.md`
// para documentar `trim()` en `bio.title` y `bio.description` antes de
// validar. Decisión del cliente: todo string de entrada se normaliza con
// `trim()` por consistencia con `email`/`firstName`/`lastName`, y para que
// `"   "` no pase el `min(1)` y se guarde como bio vacía. El backend debe
// ajustarse a esta regla: recibir el valor ya normalizado y aplicar la misma
// normalización como defensa en profundidad.
const bioTitleSchema = z
  .string()
  .trim()
  .min(BIO_TITLE_MIN_LENGTH, 'bio.title.min')
  .max(BIO_TITLE_MAX_LENGTH, 'bio.title.max');

const bioDescriptionSchema = z
  .string()
  .trim()
  .min(BIO_DESCRIPTION_MIN_LENGTH, 'bio.description.min')
  .max(BIO_DESCRIPTION_MAX_LENGTH, 'bio.description.max');

/**
 * `UpdateBioInput` del contrato: `{ title?, description? }`, ambos
 * nullable. La semántica PATCH se aplica campo por campo:
 *   - omitido → no se modifica
 *   - null    → se borra
 *   - string  → se asigna (con validación de longitud)
 */
const updateBioSchema = z.object({
  title: bioTitleSchema.nullable().optional(),
  description: bioDescriptionSchema.nullable().optional(),
});

/* ============================================================
 * INTERESTS
 * ============================================================ */

/**
 * Array de strings. `null` (nivel superior) borra todos los intereses;
 * array reemplaza la lista completa. Cada elemento: 1-40 caracteres.
 * Máximo 20 elementos.
 */
// TODO(contract): actualizar §3.6 de `docs/backend-api/_rutas/users-me/profile.md`
// para documentar `trim()` en cada elemento de `interests`. Misma decisión
// que en `bio`: normalización por consistencia, para no guardar intereses
// con espacios sobrantes. El backend debe ajustarse a esta regla.
const interestsSchema = z
  .array(
    z
      .string()
      .trim()
      .min(INTEREST_MIN_LENGTH, 'interests.minLength')
      .max(INTEREST_MAX_LENGTH, 'interests.maxLength'),
    { message: 'interests.invalid' },
  )
  .max(INTEREST_MAX_COUNT, 'interests.maxCount');

/* ============================================================
 * IMAGE
 * ============================================================ */

/**
 * `null` borra la imagen; string debe ser URL absoluta http(s),
 * protocol-relative (`//…`) o data URI con payload base64 explícito.
 * Ver `isValidProfileImage` en primitives.ts y contrato §3.6.
 */
const imageSchema = z
  .string()
  .refine((value) => isValidProfileImage(value), {
    message: 'image.invalid',
  })
  .nullable();

/* ============================================================
 * SCHEMA PÚBLICO
 * ============================================================ */

export const profileSchema = z.object({
  bio: updateBioSchema.nullable().optional(),
  interests: interestsSchema.nullable().optional(),
  image: imageSchema.optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type UpdateBioInput = z.infer<typeof updateBioSchema>;
