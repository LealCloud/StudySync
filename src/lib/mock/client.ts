import type { BackendClient, RestBackendResponse } from '../backend/client';
import { BackendOperationError } from '../backend/errors';
import type {
  BackendAccount,
  BackendConversation,
  BackendMessage,
  BackendUser,
  BackendContactInput,
  BackendDocumentType,
  BackendForgotPasswordInput,
  BackendLoginInput,
  BackendPersonalData,
  BackendPreferences,
  BackendPrivacySettings,
  BackendProfile,
  BackendRegisterInput,
  BackendResetPasswordInput,
  BackendResetTokenValidationResponse,
  BackendSubscription,
  BackendUpdateBioInput,
  BackendValidateResetTokenInput,
} from '../backend/types';

const MOCK_USER_ID = 'test-user-001';
const MOCK_ACCESS_TOKEN = 'mock-access-token';
const MOCK_RESET_TOKEN = 'mock-reset-token';

type MockOperation =
  | 'users.getMe'
  | 'users.getPublicProfile'
  | 'users.updateProfile'
  | 'personalData.getMe'
  | 'personalData.update'
  | 'privacy.getMe'
  | 'privacy.update'
  | 'security.getMe'
  | 'security.requestEmailChange'
  | 'security.changePassword'
  | 'security.beginTwoFactorSetup'
  | 'security.verifyTwoFactorSetup'
  | 'security.disableTwoFactor'
  | 'preferences.getMe'
  | 'preferences.update'
  | 'account.getMe'
  | 'account.requestDeactivation'
  | 'account.cancelDeactivation'
  | 'courses.getMe'
  | 'certificates.getMe'
  | 'subscription.getMe'
  | 'subscription.changePlan'
  | 'subscription.cancel'
  | 'billing.getPaymentMethods'
  | 'billing.getInvoices'
  | 'billing.removePaymentMethod'
  | 'messaging.getConversations'
  | 'messaging.startConversation'
  | 'messaging.getMessages'
  | 'messaging.sendMessage'
  | 'messaging.markAsRead'
  | 'messaging.getUnreadCount';

export type MockFailureMap = Partial<
  Record<MockOperation, { status: number; code: string }>
>;

function mockResponse<T>(body: T, status = 200): RestBackendResponse<T> {
  return { status, ok: status >= 200 && status < 300, body };
}

function mockApiError<T = unknown>(
  status: number,
  code: string,
  message: string,
): RestBackendResponse<T> {
  return mockResponse({ error: { code, message, details: null } } as T, status);
}

/* ============================================================
 * ESTADO COMPARTIDO
 *
 * `createBackendClient()` en ../backend/index.ts crea una instancia
 * nueva por cada request GraphQL. Si el estado viviera en campos de
 * instancia, cada request vería un mock "fresco" y los cambios se
 * perderían entre llamadas.
 *
 * Guardamos el estado en `globalThis` para que sobreviva:
 *   - entre requests (misma instancia de proceso Node), y
 *   - entre HMR reloads en `pnpm dev` (que re-evalúan el módulo).
 * ============================================================ */

interface MockStore {
  profileState: BackendProfile;
  imageState: string | null;
  personalDataState: BackendPersonalData;
  privacyState: BackendPrivacySettings;
  preferencesState: BackendPreferences;
  securityState: {
    email: string;
    emailVerified: boolean;
    twoFactorEnabled: boolean;
    twoFactorRequired: boolean;
    twoFactorSetupStarted: boolean;
  };
  accountState: BackendAccount;
  subscriptionState: BackendSubscription | null;
  conversations: Array<{
    id: string;
    type: 'direct' | 'group';
    directKey: string | null;
    participantIds: string[];
    createdAt: string;
    updatedAt: string;
  }>;
  messages: Array<{
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    createdAt: string;
  }>;
  lastReadAt: Record<string, string>;
  paymentMethods: Array<{
    id: string;
    brand: string | null;
    last4: string | null;
    expirationMonth: number | null;
    expirationYear: number | null;
  }>;
}

const initialPreferences: BackendPreferences = {
  language: 'es',
  theme: 'system',
  timezone: 'America/Bogota',
  notifications: { email: true, push: true, inApp: true },
  accessibility: { reducedMotion: false, highContrast: false },
};

const initialPersonalData: BackendPersonalData = {
  firstName: 'Test',
  lastName: 'User',
  documentType: 'dni',
  documentId: '123456789',
  phone: '+573000000000',
  country: 'CO',
  address: 'Test address',
  identityLocked: false,
};

function createInitialStore(): MockStore {
  return {
    profileState: {
      bio: { title: 'Estudiante', description: 'Perfil de prueba' },
      interests: ['programming', 'technology'],
    },
    imageState: null,
    personalDataState: { ...initialPersonalData },
    privacyState: {
      profileVisibility: 'everyone',
      emailVisibility: 'authenticated',
      phoneVisibility: 'nobody',
      allowDirectMessages: true,
    },
    preferencesState: {
      ...initialPreferences,
      notifications: { ...initialPreferences.notifications },
      accessibility: { ...initialPreferences.accessibility },
    },
    securityState: {
      email: 'test@example.com',
      emailVerified: true,
      twoFactorEnabled: false,
      twoFactorRequired: false,
      twoFactorSetupStarted: false,
    },
    accountState: {
      status: 'active',
      deactivationScheduledAt: null,
    },
    subscriptionState: {
      id: 'subscription-001',
      plan: 'free',
      status: 'active',
      startedAt: '2024-01-01T00:00:00.000Z',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    },
    conversations: [
      {
        id: 'conv-001',
        type: 'direct',
        directKey: ['test-user-001', 'other-user-001'].sort().join(':'),
        participantIds: ['test-user-001', 'other-user-001'],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:02:00.000Z',
      },
    ],
    messages: [
      {
        id: 'msg-001',
        conversationId: 'conv-001',
        senderId: 'other-user-001',
        content: 'Hola, ¿cómo va tu proyecto?',
        createdAt: '2026-01-01T00:01:00.000Z',
      },
      {
        id: 'msg-002',
        conversationId: 'conv-001',
        senderId: MOCK_USER_ID,
        content: '¡Muy bien, gracias!',
        createdAt: '2026-01-01T00:02:00.000Z',
      },
    ],
    lastReadAt: {},
    paymentMethods: [
      {
        id: 'payment-001',
        brand: 'Visa',
        last4: '4242',
        expirationMonth: 12,
        expirationYear: 2028,
      },
    ],
  };
}

declare global {
  var __mockStore: MockStore | undefined;
}

function getMockStore(): MockStore {
  if (!globalThis.__mockStore) {
    globalThis.__mockStore = createInitialStore();
  }
  return globalThis.__mockStore;
}

export function resetMockStore(): void {
  globalThis.__mockStore = undefined;
}

export class MockBackendClient implements BackendClient {
  private readonly failures: MockFailureMap;

  constructor(options: { failures?: MockFailureMap } = {}) {
    this.failures = options.failures ?? {};
  }

  private get store(): MockStore {
    return getMockStore();
  }

  private failIfConfigured(operation: MockOperation): void {
    const failure = this.failures[operation];
    if (failure) throw new BackendOperationError(failure.status, failure.code);
  }

  users = {
    getMe: async () => {
      this.failIfConfigured('users.getMe');
      return {
        id: MOCK_USER_ID,
        name: 'Test User',
        email: 'test@example.com',
        image: this.store.imageState,
        role: 'student' as const,
        profile: {
          bio: this.store.profileState.bio
            ? { ...this.store.profileState.bio }
            : null,
          interests: [...this.store.profileState.interests],
        },
      };
    },
    getPublicProfile: async (userId: string) => {
      this.failIfConfigured('users.getPublicProfile');
      if (userId !== MOCK_USER_ID) return null;
      return {
        id: MOCK_USER_ID,
        name: 'Test User',
        image: this.store.imageState,
        bio: this.store.profileState.bio
          ? { ...this.store.profileState.bio }
          : null,
        interests: [...this.store.profileState.interests],
        email: null,
        phone: null,
        allowDirectMessages: this.store.privacyState.allowDirectMessages,
      };
    },
    updateProfile: async (
      input: Parameters<BackendClient['users']['updateProfile']>[0],
    ) => {
      this.failIfConfigured('users.updateProfile');

      // --- Validaciones (contrato §3.6) -------------------------------------

      const validateBioField = (
        value: string | null | undefined,
        field: 'title' | 'description',
      ): void => {
        if (value === undefined || value === null) return; // null = borrar, válido
        const { min, max } =
          field === 'title' ? { min: 1, max: 100 } : { min: 1, max: 500 };
        if (value.length < min || value.length > max) {
          throw new BackendOperationError(422, 'VALIDATION_ERROR');
        }
      };

      if (input.bio !== undefined && input.bio !== null) {
        validateBioField(input.bio.title, 'title');
        validateBioField(input.bio.description, 'description');
      }

      if (input.interests !== undefined && input.interests !== null) {
        if (input.interests.length > 20) {
          throw new BackendOperationError(422, 'VALIDATION_ERROR');
        }
        for (const interest of input.interests) {
          if (interest.length < 1 || interest.length > 40) {
            throw new BackendOperationError(422, 'VALIDATION_ERROR');
          }
        }
      }

      // --- Aplicar cambios (semántica PATCH parcial) -----------------------

      if (input.bio !== undefined) {
        if (input.bio === null) {
          // Borrar la bio completa
          this.store.profileState.bio = null;
        } else {
          // PATCH parcial dentro del bio
          const currentBio = this.store.profileState.bio ?? {
            title: null,
            description: null,
          };
          const nextBio = applyBioPatch(currentBio, input.bio);
          this.store.profileState.bio = nextBio;
        }
      }

      if (input.interests !== undefined) {
        // `null` = borrar todos los intereses
        this.store.profileState.interests = input.interests ?? [];
      }

      // `undefined` = no tocar, `null` = borrar, string = asignar
      if (input.image !== undefined) this.store.imageState = input.image;

      // --- Devolver el usuario actualizado ---------------------------------

      return {
        id: MOCK_USER_ID,
        name: 'Test User',
        email: 'test@example.com',
        image: this.store.imageState,
        role: 'student' as const,
        profile: {
          bio: this.store.profileState.bio
            ? { ...this.store.profileState.bio }
            : null,
          interests: [...this.store.profileState.interests],
        },
      };
    },
  };

  personalData = {
    getMe: async () => {
      this.failIfConfigured('personalData.getMe');
      return { ...this.store.personalDataState };
    },
    update: async (
      input: Parameters<BackendClient['personalData']['update']>[0],
    ) => {
      this.failIfConfigured('personalData.update');

      const inputWithNulls = input as Record<string, unknown>;
      if (
        inputWithNulls.firstName === null ||
        inputWithNulls.lastName === null
      ) {
        throw new BackendOperationError(422, 'VALIDATION_ERROR');
      }

      const documentType: unknown = input.documentType;
      if (
        documentType !== undefined &&
        documentType !== null &&
        !isBackendDocumentType(documentType)
      ) {
        throw new BackendOperationError(422, 'VALIDATION_ERROR');
      }

      const identityFields = [
        'firstName',
        'lastName',
        'documentType',
        'documentId',
      ] as const;
      if (
        this.store.personalDataState.identityLocked &&
        identityFields.some((field) =>
          Object.prototype.hasOwnProperty.call(input, field),
        )
      ) {
        throw new BackendOperationError(403, 'FORBIDDEN');
      }
      this.store.personalDataState = {
        ...this.store.personalDataState,
        ...Object.fromEntries(
          Object.entries(input).filter(([, value]) => value !== undefined),
        ),
        identityLocked: this.store.personalDataState.identityLocked,
      };
      return { ...this.store.personalDataState };
    },
  };

  privacy = {
    getMe: async () => {
      this.failIfConfigured('privacy.getMe');
      return { ...this.store.privacyState };
    },
    update: async (
      input: Parameters<BackendClient['privacy']['update']>[0],
    ) => {
      this.failIfConfigured('privacy.update');

      // Defensa en runtime: null = borrar según regla general, pero Privacy
      // no admite null (BACKEND_API.md §8.2.18).
      const inputWithNulls = input as Record<string, unknown>;
      for (const field of [
        'profileVisibility',
        'emailVisibility',
        'phoneVisibility',
        'allowDirectMessages',
      ]) {
        if (inputWithNulls[field] === null) {
          throw new BackendOperationError(422, 'VALIDATION_ERROR');
        }
      }

      this.store.privacyState = { ...this.store.privacyState, ...input };
      return { ...this.store.privacyState };
    },
  };

  security = {
    getMe: async () => {
      this.failIfConfigured('security.getMe');
      const { email, emailVerified, twoFactorEnabled, twoFactorRequired } =
        this.store.securityState;
      return {
        email,
        emailVerified,
        twoFactorEnabled,
        twoFactorRequired,
      };
    },
    requestEmailChange: async (
      input: Parameters<BackendClient['security']['requestEmailChange']>[0],
    ) => {
      this.failIfConfigured('security.requestEmailChange');
      if (input.newEmail === this.store.securityState.email) {
        throw new BackendOperationError(409, 'EMAIL_UNCHANGED');
      }
      if (input.newEmail === 'taken@example.com') {
        throw new BackendOperationError(409, 'EMAIL_TAKEN');
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.newEmail)) {
        throw new BackendOperationError(422, 'VALIDATION_ERROR');
      }
      return { success: true, message: 'Verification email sent' };
    },
    changePassword: async (
      input: Parameters<BackendClient['security']['changePassword']>[0],
    ) => {
      this.failIfConfigured('security.changePassword');
      if (input.currentPassword !== 'old-password') {
        throw new BackendOperationError(422, 'INVALID_CURRENT_PASSWORD');
      }
      if (input.newPassword === input.currentPassword) {
        throw new BackendOperationError(409, 'CONFLICT');
      }
      if (
        input.newPassword.length < 6 ||
        input.newPassword.length > 15 ||
        !/[a-z]/.test(input.newPassword) ||
        !/[A-Z]/.test(input.newPassword) ||
        !/[^A-Za-z0-9]/.test(input.newPassword)
      ) {
        throw new BackendOperationError(422, 'VALIDATION_ERROR');
      }
      return { success: true, message: 'Password updated' };
    },
    beginTwoFactorSetup: async () => {
      this.failIfConfigured('security.beginTwoFactorSetup');
      if (this.store.securityState.twoFactorEnabled) {
        throw new BackendOperationError(409, 'CONFLICT');
      }
      this.store.securityState.twoFactorSetupStarted = true;
      return {
        secret: 'MOCKSECRET123',
        qrCode: 'data:image/png;base64,bW9jaw==',
      };
    },
    verifyTwoFactorSetup: async (code: string) => {
      this.failIfConfigured('security.verifyTwoFactorSetup');
      if (
        !this.store.securityState.twoFactorSetupStarted ||
        this.store.securityState.twoFactorEnabled
      ) {
        throw new BackendOperationError(409, 'CONFLICT');
      }
      if (code !== '123456') {
        throw new BackendOperationError(422, 'INVALID_CODE');
      }
      this.store.securityState.twoFactorEnabled = true;
      this.store.securityState.twoFactorSetupStarted = false;
      return { success: true, message: 'Two factor enabled' };
    },
    disableTwoFactor: async (code: string) => {
      this.failIfConfigured('security.disableTwoFactor');
      if (this.store.securityState.twoFactorRequired) {
        throw new BackendOperationError(403, 'FORBIDDEN');
      }
      if (code !== '123456') {
        throw new BackendOperationError(422, 'INVALID_CODE');
      }
      this.store.securityState.twoFactorEnabled = false;
      return { success: true, message: 'Two factor disabled' };
    },
  };

  preferences = {
    getMe: async () => {
      this.failIfConfigured('preferences.getMe');
      return {
        ...this.store.preferencesState,
        notifications: { ...this.store.preferencesState.notifications },
        accessibility: { ...this.store.preferencesState.accessibility },
      };
    },
    update: async (
      input: Parameters<BackendClient['preferences']['update']>[0],
    ) => {
      this.failIfConfigured('preferences.update');

      // Defensa en runtime: la regla general del contrato dice null = borrar,
      // pero Preferences no admite null (BACKEND_API.md §8.1). El BFF ya rechaza
      // null; el mock no confía en que el caller lo haga.
      const inputWithNulls = input as Record<string, unknown>;
      for (const field of [
        'language',
        'theme',
        'timezone',
        'notifications',
        'accessibility',
      ]) {
        if (inputWithNulls[field] === null) {
          throw new BackendOperationError(422, 'VALIDATION_ERROR');
        }
      }

      if (
        (input.language !== undefined &&
          !['es', 'en'].includes(input.language)) ||
        (input.theme !== undefined &&
          !['system', 'light', 'dark'].includes(input.theme)) ||
        (input.timezone !== undefined && !isValidTimezone(input.timezone))
      ) {
        throw new BackendOperationError(422, 'VALIDATION_ERROR');
      }
      const notifications = input.notifications;
      const accessibility = input.accessibility;
      this.store.preferencesState = {
        ...this.store.preferencesState,
        ...(input.language === undefined ? {} : { language: input.language }),
        ...(input.theme === undefined ? {} : { theme: input.theme }),
        ...(input.timezone === undefined ? {} : { timezone: input.timezone }),
        notifications: {
          ...this.store.preferencesState.notifications,
          ...(notifications ?? {}),
        },
        accessibility: {
          ...this.store.preferencesState.accessibility,
          ...(accessibility ?? {}),
        },
      };
      return {
        ...this.store.preferencesState,
        notifications: { ...this.store.preferencesState.notifications },
        accessibility: { ...this.store.preferencesState.accessibility },
      };
    },
  };

  account = {
    getMe: async () => {
      this.failIfConfigured('account.getMe');
      return { ...this.store.accountState };
    },
    requestDeactivation: async () => {
      this.failIfConfigured('account.requestDeactivation');
      if (this.store.accountState.status !== 'active') {
        throw new BackendOperationError(409, 'CONFLICT');
      }
      this.store.accountState = {
        status: 'pending_deactivation',
        deactivationScheduledAt: '2026-10-13T00:00:00.000Z',
      };
      return { ...this.store.accountState };
    },
    cancelDeactivation: async () => {
      this.failIfConfigured('account.cancelDeactivation');
      if (this.store.accountState.status !== 'pending_deactivation') {
        throw new BackendOperationError(409, 'CONFLICT');
      }
      this.store.accountState = {
        status: 'active',
        deactivationScheduledAt: null,
      };
      return { ...this.store.accountState };
    },
  };

  courses = {
    getMe: async () => {
      this.failIfConfigured('courses.getMe');
      return [
        {
          courseId: 'course-001',
          title: 'GraphQL básico',
          progress: 0.65,
          status: 'active' as const,
          enrolledAt: '2026-01-15T00:00:00.000Z',
          completedAt: null,
        },
      ];
    },
  };

  certificates = {
    getMe: async () => {
      this.failIfConfigured('certificates.getMe');
      return [
        {
          id: 'certificate-001',
          courseId: 'course-000',
          courseTitle: 'Introducción a la programación',
          certificateNumber: 'CERT-2026-001',
          issuedAt: '2026-02-01T00:00:00.000Z',
          downloadUrl: 'https://example.com/certificates/CERT-2026-001',
        },
      ];
    },
  };

  subscription = {
    getMe: async () => {
      this.failIfConfigured('subscription.getMe');
      return this.store.subscriptionState
        ? { ...this.store.subscriptionState }
        : null;
    },
    changePlan: async (
      plan: Parameters<BackendClient['subscription']['changePlan']>[0],
    ) => {
      this.failIfConfigured('subscription.changePlan');
      if (this.store.subscriptionState?.plan === 'enterprise') {
        throw new BackendOperationError(403, 'FORBIDDEN');
      }
      if (plan === 'enterprise') {
        throw new BackendOperationError(403, 'FORBIDDEN');
      }
      if (!this.store.subscriptionState) {
        throw new BackendOperationError(404, 'NOT_FOUND');
      }
      if (plan === this.store.subscriptionState.plan) {
        throw new BackendOperationError(409, 'CONFLICT');
      }
      if (plan === 'premium' && !this.store.paymentMethods.length) {
        throw new BackendOperationError(409, 'PAYMENT_METHOD_REQUIRED');
      }
      this.store.subscriptionState = {
        ...this.store.subscriptionState,
        plan,
        status: 'active',
        currentPeriodEnd: '2026-11-04T00:00:00.000Z',
        cancelAtPeriodEnd: false,
      };
      return { ...this.store.subscriptionState };
    },
    cancel: async () => {
      this.failIfConfigured('subscription.cancel');
      if (!this.store.subscriptionState) {
        throw new BackendOperationError(404, 'NOT_FOUND');
      }
      if (this.store.subscriptionState.status === 'canceled') {
        throw new BackendOperationError(409, 'CONFLICT');
      }
      this.store.subscriptionState = {
        ...this.store.subscriptionState,
        status: 'canceled',
        cancelAtPeriodEnd: true,
      };
      return { ...this.store.subscriptionState };
    },
  };

  billing = {
    getPaymentMethods: async () => {
      this.failIfConfigured('billing.getPaymentMethods');
      return this.store.paymentMethods.map((method) => ({ ...method }));
    },
    getInvoices: async () => {
      this.failIfConfigured('billing.getInvoices');
      return [
        {
          id: 'invoice-001',
          number: 'INV-2026-001',
          amount: 0,
          currency: 'COP',
          status: 'paid' as const,
          issuedAt: '2026-01-01T00:00:00.000Z',
          downloadUrl: null,
        },
      ];
    },
    removePaymentMethod: async (paymentMethodId: string) => {
      this.failIfConfigured('billing.removePaymentMethod');
      const index = this.store.paymentMethods.findIndex(
        (method) => method.id === paymentMethodId,
      );
      if (index < 0) throw new BackendOperationError(404, 'NOT_FOUND');
      if (
        this.store.paymentMethods.length === 1 &&
        this.store.subscriptionState?.plan === 'premium' &&
        this.store.subscriptionState.status === 'active'
      ) {
        throw new BackendOperationError(409, 'CONFLICT');
      }
      this.store.paymentMethods.splice(index, 1);
      return true;
    },
  };

  // El mock hardcodea tres user IDs para simular los casos del contrato:
  // - `other-user-001`: participante de la conversación seed (`conv-001`).
  // - `blocked-user`: simula un destinatario con `allowDirectMessages: false`
  //   (M3), sin modelar `PrivacySettings` en el store del mock.
  // - `repeat-user`: simula un destinatario que permite DMs, para el test
  //   de reutilización de conversación.
  messaging: BackendClient['messaging'] = {
    getConversations: async () => {
      this.failIfConfigured('messaging.getConversations');
      return this.store.conversations
        .filter((c) => c.participantIds.includes(MOCK_USER_ID))
        .map((c) => this.mockConversation(c));
    },
    startConversation: async (participantId) => {
      this.failIfConfigured('messaging.startConversation');
      if (participantId === MOCK_USER_ID)
        throw new BackendOperationError(422, 'VALIDATION_ERROR');
      if (participantId === 'blocked-user')
        throw new BackendOperationError(403, 'FORBIDDEN');
      const directKey = [MOCK_USER_ID, participantId].sort().join(':');
      let c = this.store.conversations.find(
        (item) => item.directKey === directKey,
      );
      if (!c) {
        const now = new Date().toISOString();
        c = {
          id: `conv-${Date.now()}`,
          type: 'direct',
          directKey,
          participantIds: [MOCK_USER_ID, participantId],
          createdAt: now,
          updatedAt: now,
        };
        this.store.conversations.push(c);
      }
      return this.mockConversation(c);
    },
    getMessages: async (conversationId, before, limit = 50) => {
      this.failIfConfigured('messaging.getMessages');
      this.requireMockParticipant(conversationId);
      const beforeMs = before ? Date.parse(before) : Infinity;
      return this.store.messages
        .filter(
          (m) =>
            m.conversationId === conversationId &&
            Date.parse(m.createdAt) < beforeMs,
        )
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .slice(-Math.min(Math.max(Math.trunc(limit), 1), 100))
        .map((m) => this.mockMessage(m));
    },
    sendMessage: async (conversationId, content) => {
      this.failIfConfigured('messaging.sendMessage');
      this.requireMockParticipant(conversationId);
      if (!content.trim() || content.length > 2000)
        throw new BackendOperationError(422, 'VALIDATION_ERROR');
      const msg = {
        id: `msg-${Date.now()}-${Math.random()}`,
        conversationId,
        senderId: MOCK_USER_ID,
        content,
        createdAt: new Date().toISOString(),
      };
      this.store.messages.push(msg);
      const c = this.store.conversations.find(
        (item) => item.id === conversationId,
      )!;
      c.updatedAt = msg.createdAt;
      return this.mockMessage(msg);
    },
    markAsRead: async (conversationId) => {
      this.failIfConfigured('messaging.markAsRead');
      this.requireMockParticipant(conversationId);
      this.store.lastReadAt[`${conversationId}:${MOCK_USER_ID}`] =
        new Date().toISOString();
      return this.mockConversation(
        this.store.conversations.find((c) => c.id === conversationId)!,
      );
    },
    getUnreadCount: async () => {
      this.failIfConfigured('messaging.getUnreadCount');
      return this.store.conversations
        .filter((c) => c.participantIds.includes(MOCK_USER_ID))
        .reduce((sum, c) => sum + this.mockConversation(c).unreadCount, 0);
    },
  };

  private mockUser(userId: string): BackendUser {
    return userId === MOCK_USER_ID
      ? {
          id: MOCK_USER_ID,
          name: 'Test User',
          email: 'test@example.com',
          image: this.store.imageState,
          role: 'student',
          profile: {
            bio: this.store.profileState.bio
              ? { ...this.store.profileState.bio }
              : null,
            interests: [...this.store.profileState.interests],
          },
        }
      : {
          id: userId,
          name: 'Other User',
          email: 'other@example.com',
          image: null,
          role: 'student',
          profile: { bio: null, interests: [] },
        };
  }

  private mockMessage(m: MockStore['messages'][number]): BackendMessage {
    return {
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      sender: this.mockUser(m.senderId),
      content: m.content,
      createdAt: m.createdAt,
    };
  }

  private requireMockParticipant(conversationId: string) {
    const c = this.store.conversations.find(
      (item) => item.id === conversationId,
    );
    if (!c || !c.participantIds.includes(MOCK_USER_ID))
      throw new BackendOperationError(403, 'FORBIDDEN');
  }

  private mockConversation(
    c: MockStore['conversations'][number],
  ): BackendConversation {
    const messages = this.store.messages
      .filter((m) => m.conversationId === c.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const last = messages.at(-1);
    const readAt = this.store.lastReadAt[`${c.id}:${MOCK_USER_ID}`];
    return {
      id: c.id,
      type: c.type,
      participants: c.participantIds.map((id, i) => ({
        id: `${c.id}-p${i}`,
        user: this.mockUser(id),
        lastReadAt: this.store.lastReadAt[`${c.id}:${id}`] ?? null,
      })),
      lastMessage: last ? this.mockMessage(last) : null,
      lastMessageAt: last?.createdAt ?? null,
      unreadCount: messages.filter(
        (m) => m.senderId !== MOCK_USER_ID && (!readAt || m.createdAt > readAt),
      ).length,
    };
  }
}

export class MockPublicBackendClient {
  private readonly resetTokens = new Set([MOCK_RESET_TOKEN]);

  auth = {
    login: async (
      input: BackendLoginInput,
    ): Promise<
      RestBackendResponse<{
        status: number;
        message: string;
        data: {
          id: string;
          role: 'student' | 'teacher' | 'admin';
          token: string;
          expiresIn: number;
        };
      }>
    > => {
      if (
        input.email === 'invalid@example.com' ||
        input.password === 'wrong-password'
      ) {
        return mockApiError(
          401,
          'UNAUTHENTICATED',
          'Credenciales incorrectas.',
        );
      }
      if (input.email.startsWith('ratelimited+')) {
        return mockApiError(429, 'RATE_LIMITED', 'Demasiados intentos.');
      }
      const data = {
        status: 200,
        message: 'OK',
        data: {
          id: MOCK_USER_ID,
          role: 'student' as const,
          token: MOCK_ACCESS_TOKEN,
          expiresIn: 3600,
        },
      };
      return mockResponse(data);
    },

    register: async (input: BackendRegisterInput) => {
      if (input.email.toLowerCase() === 'test@example.com') {
        return mockApiError(409, 'CONFLICT', 'El correo ya está registrado.');
      }

      if (
        !isValidName(input.firstName) ||
        !isValidName(input.lastName) ||
        !isValidEmail(input.email) ||
        !isValidPassword(input.password)
      ) {
        return mockApiError(422, 'VALIDATION_ERROR', 'Datos inválidos.');
      }

      return mockResponse({ status: 201, message: 'Cuenta creada.' }, 201);
    },

    forgotPassword: async (input: BackendForgotPasswordInput) => {
      // El contrato exige `email` y lo normaliza con trim + toLowerCase
      // antes de procesarlo (docs/backend-api/_rutas/auth/forgot-password.md).
      // El mock no debe romper el contrato; aquí solo se aplica la
      // normalización para dejar constancia del comportamiento esperado.
      const email = input.email.trim().toLowerCase();
      void email;

      return mockResponse({
        status: 200,
        message: 'Si la cuenta existe, recibirá un correo.',
      });
    },

    validateResetToken: async (
      input: BackendValidateResetTokenInput,
    ): Promise<RestBackendResponse<BackendResetTokenValidationResponse>> => {
      if (!this.resetTokens.has(input.token)) {
        return mockApiError(
          400,
          'INVALID_RESET_TOKEN',
          'El token no es válido.',
        );
      }
      return mockResponse({ valid: true });
    },

    resetPassword: async (input: BackendResetPasswordInput) => {
      // TODO(mock-persist-password): el mock no persiste el nuevo
      // `passwordHash` ni marca el token como usado. Simular bcrypt y la
      // actualización del usuario en memoria añade complejidad sin
      // beneficio para el propósito del mock (probar flujos de UI y
      // BFF). La persistencia real se verifica en `domain:test` contra
      // PostgreSQL.
      if (!this.resetTokens.has(input.token)) {
        return mockApiError(
          400,
          'INVALID_RESET_TOKEN',
          'El token no es válido.',
        );
      }
      if (!isValidPassword(input.newPassword)) {
        return mockApiError(
          422,
          'VALIDATION_ERROR',
          'La contraseña no cumple los requisitos.',
        );
      }
      this.resetTokens.delete(input.token);
      return mockResponse({ status: 200, message: 'Contraseña actualizada.' });
    },
  };

  contact = {
    submit: async (input: BackendContactInput) => {
      if (
        !isValidName(input.name) ||
        !isValidEmail(input.email) ||
        (input.contactNumber !== undefined &&
          input.contactNumber !== null &&
          input.contactNumber.trim().length > 0 &&
          !isValidE164(input.contactNumber)) ||
        !isValidSubject(input.subject) ||
        !isValidMessage(input.message)
      ) {
        return mockApiError(
          422,
          'VALIDATION_ERROR',
          'Los datos de contacto no son válidos.',
        );
      }
      return mockResponse({ status: 200, message: 'Mensaje recibido.' });
    },
  };
}

/* ============================================================
 * Helpers de validación (compartidos con el contrato BACKEND_API.md)
 * ============================================================ */

function isValidPassword(password: string): boolean {
  return (
    typeof password === 'string' &&
    password.length >= 6 &&
    password.length <= 15 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function isValidName(value: string): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.length > 100) return false;
  return /^[\p{L}\s'.-]+$/u.test(trimmed);
}

function isValidEmail(value: string): boolean {
  if (typeof value !== 'string') return false;
  if (value.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidE164(value: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(value);
}

function isValidSubject(value: string): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length < 5 || trimmed.length > 150) return false;
  return !/[<>{}]/.test(trimmed);
}

function isValidMessage(value: string): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length < 20 || trimmed.length > 2000) return false;
  return !/[<>]/.test(trimmed);
}

function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

function isBackendDocumentType(value: unknown): value is BackendDocumentType {
  return value === 'passport' || value === 'dni';
}

/**
 * Aplica la semántica PATCH parcial de `Bio`:
 * - campo omitido (`undefined`) → no se modifica.
 * - `null` → se borra (queda en `null`).
 * - valor → se asigna.
 */
function applyBioPatch(
  current: { title: string | null; description: string | null },
  patch: BackendUpdateBioInput,
): { title: string | null; description: string | null } {
  return {
    title: patch.title === undefined ? current.title : patch.title,
    description:
      patch.description === undefined ? current.description : patch.description,
  };
}
