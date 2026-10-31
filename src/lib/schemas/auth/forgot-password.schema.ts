import { EMAIL_MAX_LENGTH } from '@/lib/schemas/primitives';
import { z } from 'zod';

// Esquema dedicado para "Olvidé mi contraseña": únicamente exige un correo
// con formato válido. No reutiliza `emailField` porque este flujo requiere
// un mensaje de error específico y no debe acoplarse a las reglas de
// registro/login si estas cambian en el futuro.
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'email.required')
    .max(EMAIL_MAX_LENGTH, 'email.max')
    .email('email.invalidInput'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
