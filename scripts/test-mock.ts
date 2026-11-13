import { graphql } from 'graphql';
import { schema } from '../src/graphql';
import type { GraphQLContext } from '../src/graphql/context';
import { BackendOperationError } from '../src/lib/backend/errors';
import type { BackendUpdatePersonalDataInput } from '../src/lib/backend/types';
import {
  MockBackendClient,
  MockPublicBackendClient,
  resetMockStore,
} from '../src/lib/mock/client';

const backend = new MockBackendClient();
const contextValue: GraphQLContext = {
  backend,
  session: {
    user: {
      id: 'test-user-001',
      email: 'test@example.com',
      name: 'Test User',
      role: 'student',
    },
    expires: '2099-01-01T00:00:00.000Z',
  } as GraphQLContext['session'],
};

type TestCase = {
  name: string;
  query: string;
  variables?: Record<string, unknown>;
};

const tests: TestCase[] = [
  // ============================================================
  // USER
  // ============================================================

  {
    name: 'me',
    query: /* GraphQL */ `
      query Me {
        me {
          id
          name
          email
          image
          role
          unreadMessagesCount
          profile {
            bio {
              title
              description
            }
            interests
          }
        }
      }
    `,
  },

  // ============================================================
  // PERSONAL DATA
  // ============================================================

  {
    name: 'myPersonalData',
    query: /* GraphQL */ `
      query MyPersonalData {
        myPersonalData {
          firstName
          lastName
          documentType
          documentId
          phone
          country
          address
          identityLocked
        }
      }
    `,
  },

  {
    name: 'updatePersonalData',
    query: /* GraphQL */ `
      mutation UpdatePersonalData($input: UpdatePersonalDataInput!) {
        updatePersonalData(input: $input) {
          firstName
          lastName
          documentType
          documentId
          phone
          country
          address
          identityLocked
        }
      }
    `,
    variables: {
      input: {
        firstName: 'Test',
        lastName: 'Updated',
        documentId: '987654321',
        phone: '+57 300 111 2222',
        country: 'CO',
        address: 'Updated address',
      },
    },
  },

  // ============================================================
  // PRIVACY
  // ============================================================

  {
    name: 'myPrivacySettings',
    query: /* GraphQL */ `
      query MyPrivacySettings {
        myPrivacySettings {
          profileVisibility
          emailVisibility
          phoneVisibility
          allowDirectMessages
        }
      }
    `,
  },

  {
    name: 'updatePrivacySettings',
    query: /* GraphQL */ `
      mutation UpdatePrivacySettings($input: UpdatePrivacySettingsInput!) {
        updatePrivacySettings(input: $input) {
          profileVisibility
          emailVisibility
          phoneVisibility
          allowDirectMessages
        }
      }
    `,
    variables: {
      input: {
        profileVisibility: 'authenticated',
        emailVisibility: 'nobody',
        phoneVisibility: 'nobody',
        allowDirectMessages: false,
      },
    },
  },

  // ============================================================
  // SECURITY
  // ============================================================

  {
    name: 'mySecuritySettings',
    query: /* GraphQL */ `
      query MySecuritySettings {
        mySecuritySettings {
          email
          emailVerified
          twoFactorEnabled
          twoFactorRequired
        }
      }
    `,
  },

  {
    name: 'requestEmailChange',
    query: /* GraphQL */ `
      mutation RequestEmailChange($input: RequestEmailChangeInput!) {
        requestEmailChange(input: $input) {
          success
          message
        }
      }
    `,
    variables: {
      input: {
        newEmail: 'new@example.com',
      },
    },
  },

  {
    name: 'changePassword',
    query: /* GraphQL */ `
      mutation ChangePassword($input: ChangePasswordInput!) {
        changePassword(input: $input) {
          success
          message
        }
      }
    `,
    variables: {
      input: {
        currentPassword: 'old-password',
        newPassword: 'NewPassword1!',
      },
    },
  },

  {
    name: 'beginTwoFactorSetup',
    query: /* GraphQL */ `
      mutation BeginTwoFactorSetup {
        beginTwoFactorSetup {
          secret
          qrCode
        }
      }
    `,
  },

  {
    name: 'disableTwoFactor',
    query: /* GraphQL */ `
      mutation DisableTwoFactor {
        disableTwoFactor(code: "123456") {
          success
          message
        }
      }
    `,
  },

  // ============================================================
  // PREFERENCES
  // ============================================================

  {
    name: 'myPreferences',
    query: /* GraphQL */ `
      query MyPreferences {
        myPreferences {
          language
          theme
          timezone
          notifications {
            email
            push
            inApp
          }
          accessibility {
            reducedMotion
            highContrast
          }
        }
      }
    `,
  },

  {
    name: 'updatePreferences',
    query: /* GraphQL */ `
      mutation UpdatePreferences($input: UpdatePreferencesInput!) {
        updatePreferences(input: $input) {
          language
          theme
          timezone
          notifications {
            email
            push
            inApp
          }
          accessibility {
            reducedMotion
            highContrast
          }
        }
      }
    `,
    variables: {
      input: {
        language: 'es',
        theme: 'light',
        timezone: 'America/Bogota',
      },
    },
  },

  {
    name: 'updatePreferences with timezone from catalog',
    query: /* GraphQL */ `
      mutation UpdatePreferences($input: UpdatePreferencesInput!) {
        updatePreferences(input: $input) {
          timezone
        }
      }
    `,
    variables: {
      input: {
        timezone: 'Europe/Madrid',
      },
    },
  },

  // ============================================================
  // ACCOUNT
  // ============================================================

  {
    name: 'myAccount',
    query: /* GraphQL */ `
      query MyAccount {
        myAccount {
          status
          deactivationScheduledAt
        }
      }
    `,
  },

  {
    name: 'requestAccountDeactivation',
    query: /* GraphQL */ `
      mutation RequestAccountDeactivation {
        requestAccountDeactivation {
          status
          deactivationScheduledAt
        }
      }
    `,
  },

  // ============================================================
  // COURSES
  // ============================================================

  {
    name: 'myCourses',
    query: /* GraphQL */ `
      query MyCourses {
        myCourses {
          courseId
          title
          progress
          status
          enrolledAt
          completedAt
        }
      }
    `,
  },

  // ============================================================
  // CERTIFICATES
  // ============================================================

  {
    name: 'myCertificates',
    query: /* GraphQL */ `
      query MyCertificates {
        myCertificates {
          id
          courseId
          courseTitle
          certificateNumber
          issuedAt
          downloadUrl
        }
      }
    `,
  },

  // ============================================================
  // BILLING
  // ============================================================

  {
    name: 'mySubscription',
    query: /* GraphQL */ `
      query MySubscription {
        mySubscription {
          id
          plan
          status
          startedAt
          currentPeriodEnd
          cancelAtPeriodEnd
        }
      }
    `,
  },

  {
    name: 'changeSubscriptionPlan',
    query: /* GraphQL */ `
      mutation ChangeSubscriptionPlan($plan: SubscriptionPlan!) {
        changeSubscriptionPlan(plan: $plan) {
          id
          plan
          status
          startedAt
          currentPeriodEnd
          cancelAtPeriodEnd
        }
      }
    `,
    variables: {
      plan: 'premium',
    },
  },

  {
    name: 'cancelSubscription',
    query: /* GraphQL */ `
      mutation CancelSubscription {
        cancelSubscription {
          id
          plan
          status
          startedAt
          currentPeriodEnd
          cancelAtPeriodEnd
        }
      }
    `,
  },

  {
    name: 'myPaymentMethods',
    query: /* GraphQL */ `
      query MyPaymentMethods {
        myPaymentMethods {
          id
          brand
          last4
          expirationMonth
          expirationYear
        }
      }
    `,
  },

  {
    name: 'myInvoices',
    query: /* GraphQL */ `
      query MyInvoices {
        myInvoices {
          id
          number
          amount
          currency
          status
          issuedAt
          downloadUrl
        }
      }
    `,
  },

  {
    name: 'removePaymentMethod',
    query: /* GraphQL */ `
      mutation RemovePaymentMethod($paymentMethodId: ID!) {
        removePaymentMethod(paymentMethodId: $paymentMethodId)
      }
    `,
    variables: {
      paymentMethodId: 'payment-001',
    },
  },

  // ============================================================
  // PROFILE
  // ============================================================

  {
    name: 'publicProfile',
    query: /* GraphQL */ `
      query PublicProfile($userId: ID!) {
        publicProfile(userId: $userId) {
          id
          name
          image
          bio {
            title
            description
          }
          interests
          email
          phone
        }
      }
    `,
    variables: {
      userId: 'test-user-001',
    },
  },

  {
    name: 'updateProfile',
    query: /* GraphQL */ `
      mutation UpdateProfile($input: UpdateProfileInput!) {
        updateProfile(input: $input) {
          id
          name
          email
          image
          role
          profile {
            bio {
              title
              description
            }
            interests
          }
        }
      }
    `,
    variables: {
      input: {
        bio: {
          title: 'Test User',
          description: 'Updated test profile',
        },
        interests: ['programming', 'technology'],
      },
    },
  },

  // ============================================================
  // MESSAGING (GraphQL)
  // ============================================================

  {
    name: 'myConversations',
    query: /* GraphQL */ `
      query MyConversations {
        myConversations {
          id
          type
          participants {
            id
            user {
              id
              name
              image
              unreadMessagesCount
            }
            lastReadAt
          }
          lastMessage {
            id
            conversationId
            senderId
            content
            createdAt
          }
          lastMessageAt
          unreadCount
        }
      }
    `,
  },
  {
    name: 'messages',
    query: /* GraphQL */ `
      query Messages($conversationId: ID!) {
        messages(conversationId: $conversationId) {
          id
          conversationId
          senderId
          sender {
            id
            name
            image
          }
          content
          createdAt
        }
      }
    `,
    variables: { conversationId: 'conv-001' },
  },
  {
    name: 'startConversation',
    query: /* GraphQL */ `
      mutation StartConversation($participantId: ID!) {
        startConversation(participantId: $participantId) {
          id
          type
          unreadCount
        }
      }
    `,
    variables: { participantId: 'repeat-user' },
  },
  {
    name: 'sendMessage',
    query: /* GraphQL */ `
      mutation SendMessage($conversationId: ID!, $content: String!) {
        sendMessage(conversationId: $conversationId, content: $content) {
          id
          conversationId
          senderId
          sender {
            id
            name
          }
          content
          createdAt
        }
      }
    `,
    variables: { conversationId: 'conv-001', content: 'Hello from GraphQL' },
  },
  {
    name: 'markConversationAsRead',
    query: /* GraphQL */ `
      mutation MarkConversationAsRead($conversationId: ID!) {
        markConversationAsRead(conversationId: $conversationId) {
          id
          unreadCount
        }
      }
    `,
    variables: { conversationId: 'conv-001' },
  },
];

type AuthTest = {
  name: string;
  query: string;
  variables?: Record<string, unknown>;
  role: 'student' | 'teacher' | 'admin';
  expected: 'pass' | 'forbidden';
};

const authTests: AuthTest[] = [
  {
    name: 'myCourses as student',
    query: /* GraphQL */ `
      query MyCourses {
        myCourses {
          courseId
        }
      }
    `,
    role: 'student',
    expected: 'pass',
  },
  {
    name: 'myCourses as teacher',
    query: /* GraphQL */ `
      query MyCourses {
        myCourses {
          courseId
        }
      }
    `,
    role: 'teacher',
    expected: 'forbidden',
  },
  {
    name: 'myCourses as admin',
    query: /* GraphQL */ `
      query MyCourses {
        myCourses {
          courseId
        }
      }
    `,
    role: 'admin',
    expected: 'forbidden',
  },
  {
    name: 'myCertificates as student',
    query: /* GraphQL */ `
      query MyCertificates {
        myCertificates {
          id
        }
      }
    `,
    role: 'student',
    expected: 'pass',
  },
  {
    name: 'myCertificates as teacher',
    query: /* GraphQL */ `
      query MyCertificates {
        myCertificates {
          id
        }
      }
    `,
    role: 'teacher',
    expected: 'forbidden',
  },
  {
    name: 'mySubscription as student',
    query: /* GraphQL */ `
      query MySubscription {
        mySubscription {
          id
        }
      }
    `,
    role: 'student',
    expected: 'pass',
  },
  {
    name: 'mySubscription as teacher',
    query: /* GraphQL */ `
      query MySubscription {
        mySubscription {
          id
        }
      }
    `,
    role: 'teacher',
    expected: 'forbidden',
  },
  {
    name: 'requestAccountDeactivation as teacher',
    query: /* GraphQL */ `
      mutation {
        requestAccountDeactivation {
          status
        }
      }
    `,
    role: 'teacher',
    expected: 'forbidden',
  },
  {
    name: 'requestAccountDeactivation as admin',
    query: /* GraphQL */ `
      mutation {
        requestAccountDeactivation {
          status
        }
      }
    `,
    role: 'admin',
    expected: 'forbidden',
  },
  {
    name: 'disableTwoFactor as teacher',
    query: /* GraphQL */ `
      mutation {
        disableTwoFactor(code: "123456") {
          success
        }
      }
    `,
    role: 'teacher',
    expected: 'forbidden',
  },
  {
    name: 'disableTwoFactor as student',
    query: /* GraphQL */ `
      mutation {
        disableTwoFactor(code: "123456") {
          success
        }
      }
    `,
    role: 'student',
    expected: 'pass',
  },
];

function getOperationType(query: string): string {
  const match = query.match(/\b(query|mutation|subscription)\b/);

  return match?.[1] ?? 'unknown';
}

async function runTest(test: TestCase) {
  const result = await graphql({
    schema,
    source: test.query,
    variableValues: test.variables,
    contextValue,
  });
  if (result.errors?.length) {
    return {
      success: false,
      error: result.errors.map((error) => error.message).join('; '),
    };
  }

  if (!result.data) {
    return {
      success: false,
      error: 'GraphQL response does not contain data',
    };
  }

  return {
    success: true,
  };
}

type BehaviorTest = {
  name: string;
  run: () => Promise<void>;
};

function assertBehavior(
  condition: boolean,
  message: string,
): asserts condition {
  if (!condition) throw new Error(message);
}

function readPath(value: unknown, ...path: string[]): unknown {
  let current = value;
  for (const key of path) {
    assertBehavior(
      typeof current === 'object' && current !== null,
      `Expected an object before reading ${key}`,
    );
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function expectGraphQLError(
  result: Awaited<ReturnType<typeof graphql>>,
  code: string,
  status: number,
): void {
  const error = result.errors?.[0];
  assertBehavior(error !== undefined, `Expected GraphQL error ${code}`);
  assertBehavior(
    error.extensions?.code === code && error.extensions?.status === status,
    `Expected ${status} ${code}, got ${JSON.stringify(error.extensions)}`,
  );
}

function expectGraphQLSuccess(
  result: Awaited<ReturnType<typeof graphql>>,
): void {
  assertBehavior(
    !result.errors?.length,
    `Expected GraphQL success, got ${result.errors?.[0]?.message ?? 'unknown error'}`,
  );
}

async function runPersonalDataSecurityTests(): Promise<{
  passed: number;
  failed: number;
  total: number;
}> {
  const personalDataQuery = /* GraphQL */ `
    query MyPersonalData {
      myPersonalData {
        firstName
        lastName
        documentType
        documentId
        phone
        country
        address
        identityLocked
      }
    }
  `;
  const personalDataMutation = /* GraphQL */ `
    mutation UpdatePersonalData($input: UpdatePersonalDataInput!) {
      updatePersonalData(input: $input) {
        firstName
        lastName
        documentType
        documentId
        phone
        country
        address
        identityLocked
      }
    }
  `;
  const setIdentityLocked = async () => {
    await backend.personalData.getMe();
    const store = globalThis.__mockStore;
    assertBehavior(store !== undefined, 'Mock store was not initialized');
    store.personalDataState.identityLocked = true;
  };

  const behaviorTests: BehaviorTest[] = [
    {
      name: 'myPersonalData includes documentType',
      run: async () => {
        const result = await graphql({
          schema,
          source: personalDataQuery,
          contextValue,
        });
        expectGraphQLSuccess(result);
        assertBehavior(
          readPath(result.data, 'myPersonalData', 'documentType') === 'dni',
          'Expected initial documentType to be dni',
        );
      },
    },
    {
      name: 'verifyTwoFactorSetup after beginTwoFactorSetup',
      run: async () => {
        const begin = await graphql({
          schema,
          source: /* GraphQL */ `
            mutation {
              beginTwoFactorSetup {
                secret
              }
            }
          `,
          contextValue,
        });
        expectGraphQLSuccess(begin);

        const verify = await graphql({
          schema,
          source: /* GraphQL */ `
            mutation {
              verifyTwoFactorSetup(code: "123456") {
                success
              }
            }
          `,
          contextValue,
        });
        expectGraphQLSuccess(verify);
        assertBehavior(
          readPath(verify.data, 'verifyTwoFactorSetup', 'success') === true,
          'Expected verifyTwoFactorSetup to succeed',
        );
      },
    },
    {
      name: 'cancelAccountDeactivation after requestAccountDeactivation',
      run: async () => {
        const request = await graphql({
          schema,
          source: /* GraphQL */ `
            mutation {
              requestAccountDeactivation {
                status
              }
            }
          `,
          contextValue,
        });
        expectGraphQLSuccess(request);
        assertBehavior(
          readPath(request.data, 'requestAccountDeactivation', 'status') ===
            'pending_deactivation',
          'Expected pending_deactivation after request',
        );

        const cancel = await graphql({
          schema,
          source: /* GraphQL */ `
            mutation {
              cancelAccountDeactivation {
                status
              }
            }
          `,
          contextValue,
        });
        expectGraphQLSuccess(cancel);
        assertBehavior(
          readPath(cancel.data, 'cancelAccountDeactivation', 'status') ===
            'active',
          'Expected active after cancel',
        );
      },
    },
    {
      name: 'updatePersonalData rejects null firstName',
      run: async () => {
        const result = await graphql({
          schema,
          source: personalDataMutation,
          variableValues: { input: { firstName: null } },
          contextValue,
        });
        expectGraphQLError(result, 'VALIDATION_ERROR', 422);
      },
    },
    {
      name: 'updatePersonalData rejects null lastName',
      run: async () => {
        const result = await graphql({
          schema,
          source: personalDataMutation,
          variableValues: { input: { lastName: null } },
          contextValue,
        });
        expectGraphQLError(result, 'VALIDATION_ERROR', 422);
      },
    },
    {
      name: 'identityLocked rejects mixed identity/contact patch atomically',
      run: async () => {
        await setIdentityLocked();
        const before = await backend.personalData.getMe();
        const result = await graphql({
          schema,
          source: personalDataMutation,
          variableValues: {
            input: { firstName: 'Blocked', phone: '+573001111111' },
          },
          contextValue,
        });
        expectGraphQLError(result, 'FORBIDDEN', 403);
        const after = await graphql({
          schema,
          source: personalDataQuery,
          contextValue,
        });
        expectGraphQLSuccess(after);
        assertBehavior(
          readPath(after.data, 'myPersonalData', 'phone') === before.phone,
          'Phone changed despite atomic identity lock rejection',
        );
      },
    },
    {
      name: 'identityLocked allows contact-only patch',
      run: async () => {
        await setIdentityLocked();
        const result = await graphql({
          schema,
          source: personalDataMutation,
          variableValues: { input: { phone: '+573001234567' } },
          contextValue,
        });
        expectGraphQLSuccess(result);
        assertBehavior(
          readPath(result.data, 'updatePersonalData', 'phone') ===
            '+573001234567',
          'Contact phone was not updated',
        );
      },
    },
    {
      name: 'updatePersonalData accepts passport documentType',
      run: async () => {
        const result = await graphql({
          schema,
          source: personalDataMutation,
          variableValues: { input: { documentType: 'passport' } },
          contextValue,
        });
        expectGraphQLSuccess(result);
        assertBehavior(
          readPath(result.data, 'updatePersonalData', 'documentType') ===
            'passport',
          'documentType was not updated to passport',
        );
      },
    },
    {
      name: 'mock rejects unsupported documentType with 422',
      run: async () => {
        try {
          await backend.personalData.update({
            documentType: 'inexistente',
          } as unknown as BackendUpdatePersonalDataInput);
        } catch (error) {
          assertBehavior(
            error instanceof BackendOperationError &&
              error.status === 422 &&
              error.code === 'VALIDATION_ERROR',
            'Expected 422 VALIDATION_ERROR for unsupported documentType',
          );
          return;
        }
        throw new Error('Expected mock to reject unsupported documentType');
      },
    },
    {
      name: 'requestEmailChange distinguishes unchanged email',
      run: async () => {
        const result = await graphql({
          schema,
          source: /* GraphQL */ `
            mutation {
              requestEmailChange(input: { newEmail: "test@example.com" }) {
                success
              }
            }
          `,
          contextValue,
        });
        expectGraphQLError(result, 'EMAIL_UNCHANGED', 409);
      },
    },
    {
      name: 'requestEmailChange distinguishes taken email',
      run: async () => {
        const result = await graphql({
          schema,
          source: /* GraphQL */ `
            mutation {
              requestEmailChange(input: { newEmail: "taken@example.com" }) {
                success
              }
            }
          `,
          contextValue,
        });
        expectGraphQLError(result, 'EMAIL_TAKEN', 409);
      },
    },
  ];

  let passed = 0;
  let failed = 0;
  for (const test of behaviorTests) {
    resetMockStore();
    try {
      await test.run();
      passed++;
      console.log(`behavior   ${test.name.padEnd(58)} ✓ PASS`);
    } catch (error) {
      failed++;
      console.log(`behavior   ${test.name.padEnd(58)} ✗ FAIL`);
      console.log(
        `           ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return { passed, failed, total: behaviorTests.length };
}

async function runMessagingTests(): Promise<{
  passed: number;
  failed: number;
  total: number;
}> {
  const tests: BehaviorTest[] = [
    {
      name: 'messaging blocks a recipient who disabled DMs',
      run: async () => {
        try {
          await backend.messaging.startConversation('blocked-user');
        } catch (error) {
          assertBehavior(
            error instanceof BackendOperationError && error.status === 403,
            'Expected 403 FORBIDDEN',
          );
          return;
        }
        throw new Error('Expected blocked recipient to be rejected');
      },
    },
    {
      name: 'messaging reuses an existing direct conversation',
      run: async () => {
        const first = await backend.messaging.startConversation('repeat-user');
        const second = await backend.messaging.startConversation('repeat-user');
        assertBehavior(
          first.id === second.id,
          'Expected existing conversation to be reused',
        );
      },
    },
    {
      name: 'messaging rejects content over 2000 characters',
      run: async () => {
        try {
          await backend.messaging.sendMessage('conv-001', 'x'.repeat(2001));
        } catch (error) {
          assertBehavior(
            error instanceof BackendOperationError && error.status === 422,
            'Expected 422 VALIDATION_ERROR',
          );
          return;
        }
        throw new Error('Expected long message to be rejected');
      },
    },
    {
      name: 'messaging markAsRead clears unread count',
      run: async () => {
        const before = (await backend.messaging.getConversations()).find(
          (c) => c.id === 'conv-001',
        );
        assertBehavior(
          (before?.unreadCount ?? 0) > 0,
          'Expected initial unread message',
        );
        const after = await backend.messaging.markAsRead('conv-001');
        assertBehavior(after.unreadCount === 0, 'Unread count did not clear');
      },
    },
    {
      name: 'messaging clamps message page size to 100',
      run: async () => {
        await backend.messaging.getConversations();
        const store = globalThis.__mockStore;
        assertBehavior(store !== undefined, 'Mock store was not initialized');
        for (let i = 0; i < 105; i++)
          store.messages.push({
            id: `page-${i}`,
            conversationId: 'conv-001',
            senderId: 'other-user-001',
            content: 'message',
            createdAt: new Date(
              Date.parse('2026-02-01T00:00:00.000Z') + i,
            ).toISOString(),
          });
        const page = await backend.messaging.getMessages(
          'conv-001',
          undefined,
          500,
        );
        assertBehavior(
          page.length === 100,
          `Expected 100 messages, got ${page.length}`,
        );
      },
    },
  ];
  let passed = 0;
  let failed = 0;
  for (const test of tests) {
    resetMockStore();
    try {
      await test.run();
      passed++;
      console.log(`behavior   ${test.name.padEnd(58)} ✓ PASS`);
    } catch (error) {
      failed++;
      console.log(`behavior   ${test.name.padEnd(58)} ✗ FAIL`);
      console.log(
        `           ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  return { passed, failed, total: tests.length };
}

async function runAuthTests(): Promise<{ passed: number; failed: number }> {
  let passed = 0;
  let failed = 0;

  for (const test of authTests) {
    const contextForRole: GraphQLContext = {
      backend: new MockBackendClient(),
      session: {
        user: {
          id: 'test-user-001',
          email: 'test@example.com',
          name: 'Test User',
          role: test.role,
        },
        expires: '2099-01-01T00:00:00.000Z',
      } as GraphQLContext['session'],
    };

    const result = await graphql({
      schema,
      source: test.query,
      variableValues: test.variables,
      contextValue: contextForRole,
    });

    const errors = result.errors ?? [];
    const isForbidden = errors.some(
      (error) => error.extensions?.code === 'FORBIDDEN',
    );
    const success =
      (test.expected === 'pass' && errors.length === 0) ||
      (test.expected === 'forbidden' && isForbidden);

    if (success) {
      passed++;
      console.log(`auth       ${test.name.padEnd(42)} ✓ PASS`);
    } else {
      failed++;
      console.log(`auth       ${test.name.padEnd(42)} ✗ FAIL`);
      console.log(
        `           esperaba ${test.expected}, recibió ${errors[0]?.message ?? 'OK'}`,
      );
    }
  }

  return { passed, failed };
}

/**
 * Envuelve un check público para que cada ejecución arranque con un
 * `MockPublicBackendClient` nuevo.
 *
 * Necesario porque el mock mantiene estado interno (por ejemplo, el
 * Set de refresh tokens válidos que se rota en cada refresh). Si todos
 * los checks comparten instancia, un refresh consume el token y el
 * logout posterior falla con 401.
 *
 * Cada check debe ser independiente: su resultado no debe depender de
 * lo que hayan hecho los checks anteriores.
 */
function withFreshPublicMock<T>(
  run: (client: MockPublicBackendClient) => Promise<T>,
): () => Promise<T> {
  return () => run(new MockPublicBackendClient());
}

async function main() {
  console.log('');
  console.log('==========================================');
  console.log(' GraphQL mock flow tests');
  console.log('==========================================');
  console.log('');
  console.log('Backend: in-process mock client');
  console.log(`Tests:    ${tests.length}`);
  console.log('');

  let passed = 0;
  let failed = 0;

  const publicApiChecks: Array<
    [string, () => Promise<{ ok: boolean; status: number }>]
  > = [
    [
      'POST /auth/login',
      withFreshPublicMock((c) =>
        c.auth.login({
          email: 'mock@example.com',
          password: 'ValidPass1!',
        }),
      ),
    ],
    [
      'POST /auth/register',
      withFreshPublicMock((c) =>
        c.auth.register({
          firstName: 'Mock',
          lastName: 'User',
          email: 'mock-new@example.com',
          password: 'ValidPass1!',
        }),
      ),
    ],
    [
      'POST /auth/forgot-password',
      withFreshPublicMock((c) =>
        c.auth.forgotPassword({ email: 'mock@example.com' }),
      ),
    ],
    [
      'POST /auth/validate-reset-token',
      withFreshPublicMock((c) =>
        c.auth.validateResetToken({ token: 'mock-reset-token' }),
      ),
    ],
    [
      'POST /auth/reset-password',
      withFreshPublicMock((c) =>
        c.auth.resetPassword({
          token: 'mock-reset-token',
          newPassword: 'ValidPass1!',
        }),
      ),
    ],
    [
      'POST /contact',
      withFreshPublicMock((c) =>
        c.contact.submit({
          name: 'Mock User',
          email: 'mock@example.com',
          subject: 'Mock contact request',
          message: 'This is a sufficiently long mock contact message.',
        }),
      ),
    ],
  ];

  for (const [name, check] of publicApiChecks) {
    try {
      const response = await check();
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      passed++;
      console.log(`public REST ${name.padEnd(35)} ✓ PASS`);
    } catch (error) {
      failed++;
      console.log(`public REST ${name.padEnd(35)} ✗ FAIL`);
      console.log(
        `           ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  for (const test of tests) {
    resetMockStore();
    const type = getOperationType(test.query);

    process.stdout.write(`${type.padEnd(10)} ${test.name.padEnd(35)} `);

    try {
      const result = await runTest(test);

      if (result.success) {
        passed++;

        console.log('✓ PASS');
      } else {
        failed++;

        console.log('✗ FAIL');

        console.log(`           ${result.error ?? 'Unknown error'}`);
      }
    } catch (error) {
      failed++;

      console.log('✗ FAIL');

      if (error instanceof Error) {
        console.log(`           ${error.message}`);
      } else {
        console.log(`           ${String(error)}`);
      }
    }
  }

  console.log('');
  console.log('=== Personal Data y Security ===');
  console.log('');
  const behaviorResult = await runPersonalDataSecurityTests();
  passed += behaviorResult.passed;
  failed += behaviorResult.failed;

  console.log('\n=== Messaging behavior ===\n');
  const messagingResult = await runMessagingTests();
  passed += messagingResult.passed;
  failed += messagingResult.failed;

  console.log('');
  console.log('=== Autorización por rol ===');
  console.log('');

  const authResult = await runAuthTests();
  passed += authResult.passed;
  failed += authResult.failed;

  console.log('');
  console.log('==========================================');
  console.log(' Result');
  console.log('==========================================');
  console.log('');
  console.log(`✓ Passed: ${passed}`);
  console.log(`✗ Failed: ${failed}`);
  console.log(
    `  Total:  ${tests.length + publicApiChecks.length + authTests.length + behaviorResult.total + messagingResult.total}`,
  );
  console.log('');

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('');
  console.error('Fatal error running GraphQL tests:');

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exitCode = 1;
});
