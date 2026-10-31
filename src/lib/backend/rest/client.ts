import type { BackendClient } from '../client';
import { readBackendErrorCode, type RestBackendResponse } from '../http';
import { BackendOperationError } from '../errors';
import type {
  BackendAccount,
  BackendCertificate,
  BackendContactInput,
  BackendCourseEnrollment,
  BackendForgotPasswordInput,
  BackendInvoice,
  BackendLoginInput,
  BackendLoginResponse,
  BackendPaymentMethod,
  BackendPersonalData,
  BackendPreferences,
  BackendPrivacySettings,
  BackendPublicProfile,
  BackendRegisterInput,
  BackendResetPasswordInput,
  BackendResetTokenValidationResponse,
  BackendSecurityOperationResult,
  BackendSecuritySettings,
  BackendSubscription,
  BackendSubscriptionPlan,
  BackendTokenPairResponse,
  BackendTwoFactorSetup,
  BackendUser,
  BackendValidateResetTokenInput,
} from '../types';

export type { RestBackendResponse } from '../http';
export { readBackendErrorCode } from '../http';

export const REST_BACKEND_TIMEOUT_MS = 10_000;

export class RestBackendNotConfiguredError extends Error {
  constructor() {
    super('API_BASE_URL is not configured');
    this.name = 'RestBackendNotConfiguredError';
  }
}

export class RestBackendUnavailableError extends Error {
  constructor(cause?: unknown) {
    super('Backend request failed due to network or timeout', { cause });
    this.name = 'RestBackendUnavailableError';
  }
}

export function createRestBackendClient(
  accessToken?: string,
): RestBackendClient {
  const baseUrl = process.env.API_BASE_URL?.replace(/\/+$/, '');
  if (!baseUrl) {
    throw new RestBackendNotConfiguredError();
  }
  return new RestBackendClient(baseUrl, accessToken);
}

export class RestBackendClient implements BackendClient {
  constructor(
    private readonly baseUrl: string,
    private readonly accessToken?: string,
  ) {}

  private url(path: string): string {
    const base = this.baseUrl.replace(/\/+$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalizedPath}`;
  }

  private headers(init: RequestInit): HeadersInit {
    const isFormData =
      typeof FormData !== 'undefined' && init.body instanceof FormData;
    const headers = new Headers();

    headers.set('Accept', 'application/json');
    if (!isFormData) headers.set('Content-Type', 'application/json');
    if (this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }

    new Headers(init.headers).forEach((value, key) => {
      headers.set(key, value);
    });

    return headers;
  }

  private signal(existing?: AbortSignal | null): AbortSignal {
    const timeout = AbortSignal.timeout(REST_BACKEND_TIMEOUT_MS);
    if (!existing) return timeout;
    if (typeof AbortSignal.any === 'function') {
      return AbortSignal.any([existing, timeout]);
    }
    return existing;
  }

  private async parseBody<T>(response: Response): Promise<T | null> {
    if (response.status === 204) return null;

    const text = await response.text();
    if (!text) return null;

    try {
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  }

  async send<T = unknown>(
    path: string,
    init: RequestInit = {},
  ): Promise<RestBackendResponse<T>> {
    let response: Response;

    try {
      response = await fetch(this.url(path), {
        ...init,
        cache: init.cache ?? 'no-store',
        headers: this.headers(init),
        signal: this.signal(init.signal),
      });
    } catch (error) {
      throw new RestBackendUnavailableError(error);
    }

    const body = await this.parseBody<T>(response);
    return { status: response.status, ok: response.ok, body };
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
    notFoundAsNull = false,
  ): Promise<T> {
    // Contract between the GraphQL BFF and the principal backend.
    // The principal backend must implement these endpoints.
    const { ok, status, body } = await this.send<T>(path, init);
    if (notFoundAsNull && status === 404) return null as T;
    if (!ok) {
      const code = readBackendErrorCode(body) ?? 'UPSTREAM_ERROR';
      throw new BackendOperationError(status, code);
    }
    if (status === 204) return undefined as T;
    return body as T;
  }

  private postJson<T>(path: string, payload: unknown) {
    return this.send<T>(path, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  auth = {
    login: (input: BackendLoginInput) =>
      this.postJson<BackendLoginResponse>('/auth/login', input),
    refresh: (refreshToken: string) =>
      this.postJson<BackendTokenPairResponse>('/auth/refresh', {
        refreshToken,
      }),
    logout: (refreshToken: string) =>
      this.postJson('/auth/logout', { refreshToken }),
    register: (input: BackendRegisterInput) =>
      this.postJson('/auth/register', input),
    forgotPassword: (input: BackendForgotPasswordInput) =>
      this.postJson('/auth/forgot-password', input),
    validateResetToken: (input: BackendValidateResetTokenInput) =>
      this.postJson<BackendResetTokenValidationResponse>(
        '/auth/validate-reset-token',
        input,
      ),
    resetPassword: (input: BackendResetPasswordInput) =>
      this.postJson('/auth/reset-password', input),
  };

  contact = {
    submit: (input: BackendContactInput) => this.postJson('/contact', input),
  };

  users = {
    getMe: () => this.request<BackendUser>('/users/me'),
    getPublicProfile: (userId: string) =>
      this.request<BackendPublicProfile | null>(
        `/users/${encodeURIComponent(userId)}/profile`,
        {},
        true,
      ),
    updateProfile: (
      input: Parameters<BackendClient['users']['updateProfile']>[0],
    ) =>
      this.request<BackendUser>('/users/me/profile', {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
  };
  personalData = {
    getMe: () => this.request<BackendPersonalData>('/users/me/personal-data'),
    update: (input: Parameters<BackendClient['personalData']['update']>[0]) =>
      this.request<BackendPersonalData>('/users/me/personal-data', {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
  };
  privacy = {
    getMe: () => this.request<BackendPrivacySettings>('/users/me/privacy'),
    update: (input: Parameters<BackendClient['privacy']['update']>[0]) =>
      this.request<BackendPrivacySettings>('/users/me/privacy', {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
  };
  security = {
    getMe: () => this.request<BackendSecuritySettings>('/users/me/security'),
    requestEmailChange: (
      input: Parameters<BackendClient['security']['requestEmailChange']>[0],
    ) =>
      this.request<BackendSecurityOperationResult>(
        '/users/me/security/email-change',
        { method: 'POST', body: JSON.stringify(input) },
      ),
    changePassword: (
      input: Parameters<BackendClient['security']['changePassword']>[0],
    ) =>
      this.request<BackendSecurityOperationResult>(
        '/users/me/security/password',
        { method: 'PUT', body: JSON.stringify(input) },
      ),
    beginTwoFactorSetup: () =>
      this.request<BackendTwoFactorSetup>(
        '/users/me/security/two-factor/setup',
        { method: 'POST' },
      ),
    verifyTwoFactorSetup: (code: string) =>
      this.request<BackendSecurityOperationResult>(
        '/users/me/security/two-factor/verify',
        { method: 'POST', body: JSON.stringify({ code }) },
      ),
    disableTwoFactor: (code: string) =>
      this.request<BackendSecurityOperationResult>(
        '/users/me/security/two-factor/disable',
        { method: 'POST', body: JSON.stringify({ code }) },
      ),
    revokeSession: (sessionId: string) =>
      this.request<BackendSecurityOperationResult>(
        `/users/me/security/sessions/${encodeURIComponent(sessionId)}`,
        { method: 'DELETE' },
      ),
    revokeOtherSessions: () =>
      this.request<BackendSecurityOperationResult>(
        '/users/me/security/sessions',
        { method: 'DELETE' },
      ),
  };
  preferences = {
    getMe: () => this.request<BackendPreferences>('/users/me/preferences'),
    update: (input: Parameters<BackendClient['preferences']['update']>[0]) =>
      this.request<BackendPreferences>('/users/me/preferences', {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
  };
  account = {
    getMe: () => this.request<BackendAccount>('/users/me/account'),
    requestDeactivation: () =>
      this.request<BackendAccount>('/users/me/account/deactivation', {
        method: 'POST',
      }),
    cancelDeactivation: () =>
      this.request<BackendAccount>('/users/me/account/deactivation', {
        method: 'DELETE',
      }),
  };
  courses = {
    getMe: () => this.request<BackendCourseEnrollment[]>('/users/me/courses'),
  };
  certificates = {
    getMe: () => this.request<BackendCertificate[]>('/users/me/certificates'),
  };
  subscription = {
    getMe: () =>
      this.request<BackendSubscription | null>('/users/me/subscription'),
    changePlan: (plan: BackendSubscriptionPlan) =>
      this.request<BackendSubscription>('/users/me/subscription/plan', {
        method: 'PUT',
        body: JSON.stringify({ plan }),
      }),
    cancel: () =>
      this.request<BackendSubscription>('/users/me/subscription/cancellation', {
        method: 'POST',
      }),
  };
  billing = {
    getPaymentMethods: () =>
      this.request<BackendPaymentMethod[]>('/users/me/payment-methods'),
    getInvoices: () => this.request<BackendInvoice[]>('/users/me/invoices'),
    removePaymentMethod: (paymentMethodId: string) =>
      this.request<boolean>(
        `/users/me/payment-methods/${encodeURIComponent(paymentMethodId)}`,
        { method: 'DELETE' },
      ),
  };
}
