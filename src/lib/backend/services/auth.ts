import type {
  ForgotPasswordErrorCode,
  RegisterErrorCode,
  ResetPasswordErrorCode,
} from '@/lib/errors/auth-errors';
import { createPublicBackendClient } from '@/lib/backend';
import { BackendOperationError } from '../errors';
import { isInvalidResetToken } from '../http';
import type {
  BackendLoginData,
  BackendLoginInput,
  BackendRegisterInput,
  BackendTokenPair,
} from '../types';
import {
  assertNotRateLimited,
  callBackend,
  unexpectedBackendStatus,
} from './call';

function isLoginEnvelope(
  body: unknown,
): body is { status: number; data: BackendLoginData } {
  if (!body || typeof body !== 'object' || !('data' in body)) return false;

  const response = body as {
    status?: unknown;
    data?: Partial<BackendLoginData>;
  };
  const data = response.data;

  const roleIsValid =
    data?.role === 'student' ||
    data?.role === 'teacher' ||
    data?.role === 'admin';
  const subscriptionIsValid =
    data?.role === 'student'
      ? 'subscription' in data &&
        (data.subscription === null ||
          data.subscription === 'free' ||
          data.subscription === 'premium' ||
          data.subscription === 'enterprise')
      : !!data && !('subscription' in data);

  return (
    response.status === 200 &&
    !!data &&
    typeof data.firstName === 'string' &&
    typeof data.lastName === 'string' &&
    typeof data.id === 'string' &&
    roleIsValid &&
    subscriptionIsValid &&
    (typeof data.image === 'string' || data.image === null) &&
    typeof data.token === 'string' &&
    typeof data.refreshToken === 'string' &&
    typeof data.expiresIn === 'number' &&
    data.expiresIn > 0 &&
    typeof data.refreshExpiresIn === 'number' &&
    data.refreshExpiresIn > 0
  );
}

function isTokenPair(value: unknown): value is BackendTokenPair {
  if (!value || typeof value !== 'object') return false;
  const tokens = value as Partial<BackendTokenPair>;
  return (
    typeof tokens.token === 'string' &&
    tokens.token.length > 0 &&
    typeof tokens.refreshToken === 'string' &&
    tokens.refreshToken.length > 0 &&
    typeof tokens.expiresIn === 'number' &&
    tokens.expiresIn > 0 &&
    typeof tokens.refreshExpiresIn === 'number' &&
    tokens.refreshExpiresIn > 0
  );
}

export async function loginWithPassword(
  input: BackendLoginInput,
): Promise<BackendLoginData> {
  const client = createPublicBackendClient();
  const response = await callBackend(() =>
    client.auth.login({
      email: input.email.toLowerCase(),
      password: input.password,
    }),
  );

  assertNotRateLimited(response);

  if (response.status !== 200 || !isLoginEnvelope(response.body)) {
    if (response.status >= 500) {
      throw new BackendOperationError(503, 'unavailable');
    }
    throw new BackendOperationError(401, 'invalidData');
  }

  return response.body.data;
}

export async function refreshTokens(
  refreshToken: string,
): Promise<
  | { status: 'ok'; data: BackendTokenPair }
  | { status: 'expired' }
  | { status: 'temporary' }
> {
  try {
    const client = createPublicBackendClient();
    const response = await client.auth.refresh(refreshToken);

    if (response.status === 401 || response.status === 403) {
      return { status: 'expired' };
    }

    if (!response.ok) return { status: 'temporary' };

    const envelopeData =
      response.body &&
      typeof response.body === 'object' &&
      'data' in response.body
        ? response.body.data
        : null;

    if (isTokenPair(envelopeData)) return { status: 'ok', data: envelopeData };
    if (isTokenPair(response.body)) {
      return { status: 'ok', data: response.body };
    }

    return { status: 'temporary' };
  } catch (error) {
    if (error instanceof BackendOperationError) throw error;
    return { status: 'temporary' };
  }
}

export async function logoutFromBackend(refreshToken: string): Promise<void> {
  const client = createPublicBackendClient();
  await client.auth.logout(refreshToken);
}

export async function registerAccount(
  input: BackendRegisterInput,
): Promise<void> {
  const client = createPublicBackendClient();
  const response = await callBackend(() => client.auth.register(input));

  assertNotRateLimited(response);
  if (response.status === 201) return;

  if (response.status === 409) {
    throw new BackendOperationError<RegisterErrorCode>(409, 'emailTaken');
  }
  if (response.status === 400 || response.status === 422) {
    throw new BackendOperationError<RegisterErrorCode>(400, 'invalidData');
  }

  unexpectedBackendStatus('register', response.status);
}

export async function requestPasswordReset(email: string): Promise<void> {
  const client = createPublicBackendClient();
  const response = await callBackend(() =>
    client.auth.forgotPassword({ email: email.toLowerCase() }),
  );

  assertNotRateLimited(response);

  if (response.ok) return;

  if (response.status === 400 || response.status === 422) {
    throw new BackendOperationError<ForgotPasswordErrorCode>(
      400,
      'invalidData',
    );
  }

  unexpectedBackendStatus('forgot-password', response.status);
}

export async function validateResetToken(
  token: string,
): Promise<{ valid: true }> {
  const client = createPublicBackendClient();
  const response = await callBackend(() =>
    client.auth.validateResetToken({ token }),
  );

  assertNotRateLimited(response);

  if (isInvalidResetToken(response)) {
    throw new BackendOperationError<ResetPasswordErrorCode>(
      400,
      'invalidToken',
    );
  }

  if (!response.ok) {
    unexpectedBackendStatus('validate-reset-token', response.status);
  }

  if (
    !response.body ||
    typeof response.body !== 'object' ||
    !('valid' in response.body) ||
    response.body.valid !== true
  ) {
    throw new BackendOperationError<ResetPasswordErrorCode>(502, 'serverError');
  }

  return { valid: true };
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  const client = createPublicBackendClient();
  const response = await callBackend(() =>
    client.auth.resetPassword({ token, newPassword }),
  );

  assertNotRateLimited(response);
  if (response.ok) return;

  if (response.status === 422) {
    throw new BackendOperationError<ResetPasswordErrorCode>(400, 'invalidData');
  }

  if (isInvalidResetToken(response) || response.status === 400) {
    throw new BackendOperationError<ResetPasswordErrorCode>(
      400,
      'invalidToken',
    );
  }

  unexpectedBackendStatus('reset-password', response.status);
}
