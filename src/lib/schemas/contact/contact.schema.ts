import {
  EMAIL_MAX_LENGTH,
  isValidContactMessage,
  isValidContactSubject,
  isValidE164,
  isValidName,
} from '@/lib/schemas/primitives';
import { z } from 'zod';

// Los mensajes son claves del namespace `Validation`, no texto.
export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'contact.name.min')
    .max(100, 'contact.name.max')
    .refine((val) => isValidName(val), { message: 'contact.name.invalid' }),

  email: z
    .string()
    .trim()
    .min(1, 'email.required')
    .email('email.invalidInput')
    .max(EMAIL_MAX_LENGTH, 'email.max'),

  contactNumber: z
    .string()
    .trim()
    .refine((val) => val === '' || isValidE164(val), 'contact.phone.invalid')
    .transform((val) => (val === '' ? undefined : val))
    .optional(),

  subject: z
    .string()
    .trim()
    .min(5, 'contact.subject.min')
    .max(150, 'contact.subject.max')
    .refine((val) => isValidContactSubject(val), {
      message: 'contact.subject.invalid',
    }),

  message: z
    .string()
    .trim()
    .min(20, 'contact.message.min')
    .max(2000, 'contact.message.max')
    .refine((val) => isValidContactMessage(val), {
      message: 'contact.message.invalid',
    }),
});

export type ContactFormData = z.infer<typeof contactSchema>;
export type ContactFormInput = z.input<typeof contactSchema>;
