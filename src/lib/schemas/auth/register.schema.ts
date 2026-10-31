import {
  confirmPasswordField,
  emailField,
  firstNameField,
  lastNameField,
  passwordField,
} from '@/lib/schemas/fields/auth';
import { z } from 'zod';

/**
 * Payload que viaja al backend en `POST /auth/register`.
 * Nunca incluye `confirmPassword` ni `acceptedTerms`.
 */
export const registerSchema = z.object({
  firstName: firstNameField,
  lastName: lastNameField,
  email: emailField,
  password: passwordField,
});

/**
 * Schema del formulario de registro en la UI.
 * Incluye `confirmPassword` (solo cliente) y `acceptedTerms` (solo cliente).
 * Ambos se descartan antes de enviar al backend (ver `toRegisterPayload`).
 */
export const registerWithConfirmSchema = registerSchema
  .extend({
    confirmPassword: confirmPasswordField,
    acceptedTerms: z.boolean().refine((val) => val === true, {
      message: 'acceptedTerms.required',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'confirmPassword.mismatch',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type RegisterWithConfirmInput = z.infer<
  typeof registerWithConfirmSchema
>;

/**
 * Descarta los campos solo-cliente (`confirmPassword`, `acceptedTerms`)
 * y devuelve el payload que el backend espera.
 */
export function toRegisterPayload(
  input: RegisterWithConfirmInput,
): RegisterInput {
  // Se descartan explícitamente los campos solo-cliente antes de enviar
  // el payload al backend. `void` documenta la intención sin generar
  // variables no usadas ni depender de renombres con prefijo `_`.
  const { confirmPassword, acceptedTerms, ...payload } = input;
  void confirmPassword;
  void acceptedTerms;
  return payload;
}
