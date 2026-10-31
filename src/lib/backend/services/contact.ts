import { createPublicBackendClient } from '@/lib/backend';
import type { ContactErrorCode } from '@/lib/errors/contact-errors';
import { BackendOperationError } from '../errors';
import type { BackendContactInput } from '../types';
import {
  assertNotRateLimited,
  callBackend,
  unexpectedBackendStatus,
} from './call';

export async function submitContact(input: BackendContactInput): Promise<void> {
  const payload: BackendContactInput = {
    name: input.name,
    email: input.email,
    subject: input.subject,
    message: input.message,
    ...(input.contactNumber ? { contactNumber: input.contactNumber } : {}),
  };

  const client = createPublicBackendClient();
  const response = await callBackend(() => client.contact.submit(payload));

  assertNotRateLimited(response);
  if (response.ok) return;

  if (response.status === 400 || response.status === 422) {
    throw new BackendOperationError<ContactErrorCode>(400, 'invalidData');
  }

  if (response.status >= 500) {
    throw new BackendOperationError<ContactErrorCode>(502, 'sendFailed');
  }

  unexpectedBackendStatus('contact', response.status);
}
