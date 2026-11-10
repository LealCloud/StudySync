import { emailField } from '@/lib/schemas/fields/auth';
import { z } from 'zod';

// Esquema para "Olvidé mi contraseña": únicamente exige un correo con
// formato válido. Reutiliza `emailField` de `fields/auth.ts` para
// garantizar que las claves de error (`email.required`, `email.max`,
// `email.invalid`) son las mismas que en login y registro, y que
// cualquier cambio futuro en esas reglas se propaga automáticamente.
export const forgotPasswordSchema = z.object({
  email: emailField,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
