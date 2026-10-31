import { confirmPasswordField, passwordField } from '@/lib/schemas/fields/auth';
import { z } from 'zod';

export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: confirmPasswordField,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'confirmPassword.mismatch',
    path: ['confirmPassword'],
  });

export const resetPasswordRequestSchema = z.object({
  token: z.string().trim().min(1, 'resetPassword.invalidToken'),
  password: passwordField,
});

export const resetPasswordTokenSchema = z.object({
  token: z.string().trim().min(1, 'resetPassword.invalidToken'),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ResetPasswordRequestInput = z.infer<
  typeof resetPasswordRequestSchema
>;
export type ResetPasswordTokenInput = z.infer<typeof resetPasswordTokenSchema>;
