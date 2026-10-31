import { emailField } from '@/lib/schemas/fields/auth';
import { z } from 'zod';

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'password.required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
