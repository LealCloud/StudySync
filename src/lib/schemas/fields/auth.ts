import {
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  NAME_REGEX,
  PASSWORD_COMPLEXITY_REGEX,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '@/lib/schemas/primitives';
import { z } from 'zod';

/* ============================================================
 * FIELDS DE AUTENTICACIÓN
 *
 * Fragmentos Zod reutilizables por los schemas de auth.
 * Los mensajes son claves del namespace `Validation` (i18n),
 * no texto final.
 * ============================================================ */

export const firstNameField = z
  .string()
  .trim()
  .min(NAME_MIN_LENGTH, 'firstName.min')
  .max(NAME_MAX_LENGTH, 'firstName.max')
  .refine((val) => NAME_REGEX.test(val), { message: 'firstName.invalid' });

export const lastNameField = z
  .string()
  .trim()
  .min(NAME_MIN_LENGTH, 'lastName.min')
  .max(NAME_MAX_LENGTH, 'lastName.max')
  .refine((val) => NAME_REGEX.test(val), { message: 'lastName.invalid' });

export const emailField = z
  .string()
  .trim()
  .min(1, 'email.required')
  .max(EMAIL_MAX_LENGTH, 'email.max')
  .email('email.invalid');

export const passwordField = z
  .string()
  .min(1, 'password.required')
  .min(PASSWORD_MIN_LENGTH, 'password.min')
  .max(PASSWORD_MAX_LENGTH, 'password.max')
  .refine((val) => PASSWORD_COMPLEXITY_REGEX.test(val), {
    message: 'password.invalid',
  });

export const confirmPasswordField = z
  .string()
  .min(1, 'confirmPassword.required');
