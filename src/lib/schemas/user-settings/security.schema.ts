// Schema de los formularios de la sección Security
// (docs/backend-api/_rutas/users-me/security/*.md).
//
// Este archivo crece en 4.2, 4.3 y 4.4:
//   - 4.2: changePasswordFormSchema (contrato §3.8).
//   - 4.3: requestEmailChangeSchema (contrato §3.8).
//   - 4.4: twoFactorCodeSchema (contrato §3.8, regex `/^\d{6}$/`).
//
// Los mensajes son claves del namespace `Validation` (i18n),
// no texto final. `resolveError` los traduce.

import {
  confirmPasswordField,
  emailField,
  passwordField,
} from '@/lib/schemas/fields/auth';
import { isValidTwoFactorCode } from '@/lib/schemas/primitives';
import { z } from 'zod';

/* ============================================================
 * CHANGE PASSWORD (4.2)
 * ============================================================ */

/**
 * Schema del formulario de cambio de contraseña.
 *
 * Reglas del contrato §3.8 (`PUT /users/me/security/password`):
 *   - `currentPassword`: obligatoria, no vacía.
 *   - `newPassword`: mismas reglas que registro/reset
 *     (6-15 chars, mayúscula + minúscula + especial). Reutiliza
 *     `passwordField` de `fields/auth.ts`.
 *   - `newPassword !== currentPassword` → 409 CONFLICT. Se valida
 *     en el cliente para dar feedback inmediato; el backend
 *     también lo rechaza.
 *
 * `confirmPassword` es cliente-only: se usa para reducir errores
 * de tipeo. Nunca se envía al backend (se descarta en el componente
 * antes de llamar a `mutate`).
 */
export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'password.required'),
    newPassword: passwordField,
    confirmPassword: confirmPasswordField,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'confirmPassword.mismatch',
    path: ['confirmPassword'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'security.changePassword.sameAsCurrent',
    path: ['newPassword'],
  });

export type ChangePasswordFormInput = z.infer<typeof changePasswordFormSchema>;

/* ============================================================
 * REQUEST EMAIL CHANGE (4.3)
 * ============================================================ */

/**
 * Schema del formulario de solicitud de cambio de email.
 *
 * Reglas del contrato §3.8 (`POST /users/me/security/email-change`):
 *   - `newEmail`: obligatorio, formato de email (regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`).
 *   - `newEmail !== currentEmail` → 409 EMAIL_UNCHANGED. Se valida
 *     en el cliente para feedback inmediato; el backend también lo rechaza.
 *
 * El schema es una función porque necesita conocer el email actual
 * (desde `mySecuritySettings.email`) para el refine. La comparación es
 * case-insensitive (`trim().toLowerCase()`), alineada con la
 * normalización del contrato.
 */
export function requestEmailChangeSchema(currentEmail: string) {
  const normalizedCurrent = currentEmail.trim().toLowerCase();

  return z
    .object({
      newEmail: emailField,
    })
    .refine(
      (data) => data.newEmail.trim().toLowerCase() !== normalizedCurrent,
      {
        message: 'security.emailChange.sameAsCurrent',
        path: ['newEmail'],
      },
    );
}

export type RequestEmailChangeInput = z.infer<
  ReturnType<typeof requestEmailChangeSchema>
>;

/* ============================================================
 * TWO FACTOR (4.4)
 * ============================================================ */

/**
 * Schema del formulario de código 2FA.
 *
 * Reglas del contrato §3.8 (`verify` y `disable`):
 *   - `code`: string de exactamente 6 dígitos numéricos (`/^\d{6}$/`).
 *
 * Mismo schema para ambos formularios (verificar el setup y
 * desactivar). `isValidTwoFactorCode` ya vive en `primitives.ts`
 * y se reutiliza para no duplicar el regex.
 */
export const twoFactorCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .refine((value) => isValidTwoFactorCode(value), {
      message: 'security.twoFactor.codeInvalid',
    }),
});

export type TwoFactorCodeInput = z.infer<typeof twoFactorCodeSchema>;
