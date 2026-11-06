import type { BackendContactInput } from '@/lib/backend/types';

export async function submitContact(input: BackendContactInput): Promise<void> {
  // TODO(contact-integration): connect Resend or another email provider later.
  if (process.env.NODE_ENV !== 'production') {
    console.info('[contact]', {
      name: input.name,
      email: input.email,
      subject: input.subject,
    });
  }
}
