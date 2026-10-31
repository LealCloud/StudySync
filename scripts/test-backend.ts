import { loadEnvConfig } from '@next/env';
import { createRestBackendClient } from '../src/lib/backend/rest/client';

loadEnvConfig(process.cwd());

const API_BASE_URL = process.env.API_BASE_URL?.replace(/\/+$/, '');
const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;
const TEST_USER_ID = process.env.TEST_USER_ID;

// Por defecto las mutaciones destructivas se ejecutan, porque la cuenta
// de pruebas es desechable. Pon RUN_DESTRUCTIVE_TESTS=0 para saltarlas.
const RUN_DESTRUCTIVE_TESTS = process.env.RUN_DESTRUCTIVE_TESTS !== '0';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  error?: string;
}

const results: TestResult[] = [];

function pass(name: string) {
  results.push({ name, status: 'PASS' });
}

function fail(name: string, error: unknown) {
  results.push({
    name,
    status: 'FAIL',
    error: error instanceof Error ? error.message : String(error),
  });
}

function skip(name: string) {
  results.push({ name, status: 'SKIP' });
}

const client = API_BASE_URL ? createRestBackendClient() : null;

interface LoginResponse {
  status: number;
  message: string;
  data: {
    firstName: string;
    lastName: string;
    id: string;
    role: 'student' | 'teacher' | 'admin';
    subscription?: 'free' | 'premium' | 'enterprise' | null;
    image: string | null;
    token: string;
    refreshToken: string;
    expiresIn: number;
    refreshExpiresIn: number;
  };
}

interface RefreshResponse {
  status: number;
  message: string;
  data: {
    token: string;
    refreshToken: string;
    expiresIn: number;
    refreshExpiresIn: number;
  };
}

async function login(): Promise<LoginResponse['data']> {
  if (!client) throw new Error('API_BASE_URL is not configured');
  const response = await client.auth.login({
    email: TEST_EMAIL!,
    password: TEST_PASSWORD!,
  });
  const body = response.body as LoginResponse | null;

  if (
    !response.ok ||
    body?.status !== 200 ||
    !body.data?.token ||
    !body.data?.refreshToken
  ) {
    throw new Error(`Invalid login response (HTTP ${response.status})`);
  }

  return body.data;
}

async function refreshToken(
  refreshTokenValue: string,
): Promise<RefreshResponse['data']> {
  if (!client) throw new Error('API_BASE_URL is not configured');
  const response = await client.auth.refresh(refreshTokenValue);
  const body = response.body as RefreshResponse | null;

  if (
    !response.ok ||
    body?.status !== 200 ||
    !body.data?.token ||
    !body.data?.refreshToken
  ) {
    throw new Error(`Invalid refresh response (HTTP ${response.status})`);
  }

  return body.data;
}

async function logout(refreshTokenValue: string) {
  if (!client) throw new Error('API_BASE_URL is not configured');
  const response = await client.auth.logout(refreshTokenValue);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

/**
 * Ejecuta una función que se espera que el backend rechace con 4xx.
 *
 * Distingue entre:
 *  - El backend responde con el status esperado → PASS.
 *  - Cualquier otro resultado (200 inesperado, error de red, timeout,
 *    5xx, etc.) → FAIL.
 */
async function expectRejection(
  name: string,
  run: () => Promise<unknown>,
  expectedStatuses: number[] = [401, 403],
) {
  try {
    await run();

    fail(
      name,
      new Error(
        `Se esperaba un rechazo (${expectedStatuses.join(
          '/',
        )}), pero el backend respondió OK`,
      ),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    const matched = expectedStatuses.some((status) =>
      new RegExp(`\\b${status}\\b`).test(message),
    );

    if (matched) {
      pass(name);
    } else {
      fail(name, error);
    }
  }
}

async function run() {
  console.log('\n=== Backend integration tests ===\n');

  if (!API_BASE_URL) {
    fail('Configuración', 'API_BASE_URL no está configurada.');
    printResults();
    process.exitCode = 1;
    return;
  }

  if (!TEST_EMAIL || !TEST_PASSWORD) {
    fail('Configuración', 'Faltan TEST_EMAIL o TEST_PASSWORD.');
    printResults();
    process.exitCode = 1;
    return;
  }

  console.log(`Backend: ${API_BASE_URL}`);
  console.log(
    `Mutaciones destructivas: ${RUN_DESTRUCTIVE_TESTS ? 'ON' : 'OFF'}\n`,
  );

  let accessToken: string | undefined;
  let refreshTokenValue: string | undefined;

  /* ============================================================
   * FASE 1 — ENDPOINTS PÚBLICOS (no requieren access token)
   * ============================================================ */

  await expectRejection('POST /auth/refresh (invalid token)', () =>
    refreshToken('invalid-refresh-token-for-testing'),
  );

  await expectRejection('POST /auth/logout (invalid token)', () =>
    logout('invalid-refresh-token-for-testing'),
  );

  if (client) {
    await expectRejection(
      'POST /auth/register (email duplicado)',
      () =>
        client.auth.register({
          firstName: 'QA',
          lastName: 'Integration',
          email: TEST_EMAIL!,
          password: 'QaIntegration1!',
        }),
      [400, 409, 422],
    );

    // Happy path: registrar un usuario nuevo con email aleatorio.
    // La cuenta queda creada en el backend de staging. Si el backend
    // hace verificación por email, no podrá loguearse, pero el POST
    // debe responder 200/201.
    const randomEmail = `qa-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}@example.com`;

    try {
      const response = await client.auth.register({
        firstName: 'QA',
        lastName: 'Random',
        email: randomEmail,
        password: 'QaIntegration1!',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      pass('POST /auth/register (happy path)');
    } catch (error) {
      fail('POST /auth/register (happy path)', error);
    }
  }

  if (client) {
    try {
      await client.auth.forgotPassword({ email: TEST_EMAIL! });
      pass('POST /auth/forgot-password');
    } catch (error) {
      fail('POST /auth/forgot-password', error);
    }
  }

  await expectRejection(
    'POST /auth/validate-reset-token (invalid token)',
    () => client!.auth.validateResetToken({ token: 'invalid-reset-token' }),
    [400, 401, 404, 422],
  );

  await expectRejection(
    'POST /auth/reset-password (invalid token)',
    () =>
      client!.auth.resetPassword({
        token: 'invalid-reset-token',
        newPassword: 'NewPassword1!',
      }),
    [400, 401, 404, 422],
  );

  if (client) {
    try {
      await client.contact.submit({
        name: 'QA Integration',
        email: TEST_EMAIL!,
        subject: 'QA integration test',
        message:
          'Mensaje generado automáticamente por la suite de integración.',
      });
      pass('POST /contact');
    } catch (error) {
      fail('POST /contact', error);
    }
  }

  // --- LOGIN: último test público, abre la fase protegida ---

  try {
    const data = await login();

    accessToken = data.token;
    refreshTokenValue = data.refreshToken;

    pass('POST /auth/login');
  } catch (error) {
    fail('POST /auth/login', error);
  }

  /* ============================================================
   * FASE 2 — ENDPOINTS PROTEGIDOS
   * ============================================================ */

  if (!accessToken || !refreshTokenValue) {
    const protectedTests = [
      'GET /users/me (no auth)',
      'GET /users/me (invalid token)',
      'GET /users/me',
      'GET /users/me/personal-data',
      'GET /users/me/privacy',
      'GET /users/me/security',
      'GET /users/me/preferences',
      'GET /users/me/account',
      'GET /users/me/courses',
      'GET /users/me/certificates',
      'GET /users/me/subscription',
      'GET /users/me/payment-methods',
      'GET /users/me/invoices',
      'GET /users/:userId/profile',
      'PUT /users/me/personal-data',
      'PUT /users/me/privacy',
      'PUT /users/me/preferences',
      'PUT /users/me/profile',
      'POST /users/me/security/change-password',
      'POST /users/me/security/request-email-change',
      'POST /users/me/security/2fa/setup',
      'POST /users/me/security/2fa/verify',
      'DELETE /users/me/security/2fa',
      'DELETE /users/me/security/sessions/:id',
      'POST /users/me/security/sessions/revoke-others',
      'POST /users/me/account/deactivate',
      'POST /users/me/account/cancel-deactivation',
      'POST /users/me/subscription/change-plan',
      'POST /users/me/subscription/cancel',
      'DELETE /users/me/payment-methods/:id',
      'POST /auth/refresh',
      'POST /auth/logout',
    ];

    for (const name of protectedTests) {
      skip(name);
    }

    printResults();
    process.exitCode = 1;
    return;
  }

  const authenticatedClient = createRestBackendClient(accessToken);

  /* --- Casos negativos de autenticación ----------------------- */

  const anonymousClient = createRestBackendClient();
  const forgedClient = createRestBackendClient('invalid-access-token');

  await expectRejection('GET /users/me (no auth)', () =>
    anonymousClient.users.getMe(),
  );

  await expectRejection('GET /users/me (invalid token)', () =>
    forgedClient.users.getMe(),
  );

  /* --- Lecturas protegidas (happy path) ----------------------- */

  const reads: Array<{ name: string; run: () => Promise<unknown> }> = [
    { name: 'GET /users/me', run: () => authenticatedClient.users.getMe() },
    {
      name: 'GET /users/me/personal-data',
      run: () => authenticatedClient.personalData.getMe(),
    },
    {
      name: 'GET /users/me/privacy',
      run: () => authenticatedClient.privacy.getMe(),
    },
    {
      name: 'GET /users/me/security',
      run: () => authenticatedClient.security.getMe(),
    },
    {
      name: 'GET /users/me/preferences',
      run: () => authenticatedClient.preferences.getMe(),
    },
    {
      name: 'GET /users/me/account',
      run: () => authenticatedClient.account.getMe(),
    },
    {
      name: 'GET /users/me/courses',
      run: () => authenticatedClient.courses.getMe(),
    },
    {
      name: 'GET /users/me/certificates',
      run: () => authenticatedClient.certificates.getMe(),
    },
    {
      name: 'GET /users/me/subscription',
      run: () => authenticatedClient.subscription.getMe(),
    },
    {
      name: 'GET /users/me/payment-methods',
      run: () => authenticatedClient.billing.getPaymentMethods(),
    },
    {
      name: 'GET /users/me/invoices',
      run: () => authenticatedClient.billing.getInvoices(),
    },
  ];

  for (const test of reads) {
    try {
      await test.run();
      pass(test.name);
    } catch (error) {
      fail(test.name, error);
    }
  }

  /* --- Perfil público ----------------------------------------- */

  if (TEST_USER_ID) {
    try {
      await authenticatedClient.users.getPublicProfile(TEST_USER_ID);
      pass('GET /users/:userId/profile');
    } catch (error) {
      fail('GET /users/:userId/profile', error);
    }
  } else {
    skip('GET /users/:userId/profile');
  }

  /* ============================================================
   * FASE 2b — MUTACIONES PROTEGIDAS
   * ============================================================
   *
   * Orden pensado para no dejar la cuenta en un estado inservible:
   *  - Primero las reversibles (privacy, preferences, profile, etc.).
   *  - Al final las que rompen el login (change-password) o la cuenta
   *    (deactivate), y se cancelan después.
   *
   * Nota: los nombres de métodos (`.update`, `.updateMe`, etc.) son
   * suposiciones. Verifica los reales antes de ejecutar.
   */

  const mutationTests: Array<{ name: string; run: () => Promise<unknown> }> = [
    {
      name: 'PUT /users/me/personal-data',
      run: () =>
        authenticatedClient.personalData.update({
          firstName: 'QA',
          lastName: 'Integration',
          phone: '+57 300 000 0000',
          country: 'CO',
          address: 'QA address',
        }),
    },
    {
      name: 'PUT /users/me/privacy',
      run: () =>
        authenticatedClient.privacy.update({
          profileVisibility: 'authenticated',
          allowDirectMessages: true,
        }),
    },
    {
      name: 'PUT /users/me/preferences',
      run: () =>
        authenticatedClient.preferences.update({
          language: 'es',
          theme: 'system',
          timezone: 'America/Bogota',
        }),
    },
    {
      name: 'PUT /users/me/profile',
      run: () =>
        authenticatedClient.users.updateProfile({
          bio: { title: 'QA', description: 'Perfil de pruebas' },
          interests: ['testing'],
        }),
    },
    {
      name: 'POST /users/me/security/request-email-change',
      run: () =>
        authenticatedClient.security.requestEmailChange({
          newEmail: `qa-${Date.now()}@example.com`,
        }),
    },
    {
      name: 'POST /users/me/security/2fa/setup',
      run: () => authenticatedClient.security.beginTwoFactorSetup(),
    },
    {
      name: 'POST /users/me/security/2fa/verify',
      run: () => authenticatedClient.security.verifyTwoFactorSetup('123456'),
    },
    {
      name: 'DELETE /users/me/security/2fa',
      run: () => authenticatedClient.security.disableTwoFactor('123456'),
    },
    {
      name: 'DELETE /users/me/security/sessions/:id',
      run: () => authenticatedClient.security.revokeSession('session-other'),
    },
    {
      name: 'POST /users/me/security/sessions/revoke-others',
      run: () => authenticatedClient.security.revokeOtherSessions(),
    },
    {
      name: 'POST /users/me/account/deactivate',
      run: () => authenticatedClient.account.requestDeactivation(),
    },
    {
      name: 'POST /users/me/account/cancel-deactivation',
      run: () => authenticatedClient.account.cancelDeactivation(),
    },
    {
      name: 'POST /users/me/subscription/change-plan',
      run: () => authenticatedClient.subscription.changePlan('premium'),
    },
    {
      name: 'POST /users/me/subscription/cancel',
      run: () => authenticatedClient.subscription.cancel(),
    },
    {
      name: 'DELETE /users/me/payment-methods/:id',
      run: () => authenticatedClient.billing.removePaymentMethod('payment-001'),
    },
    // change-password va al final: si el backend invalida los tokens
    // al cambiarla, no queremos romper los tests siguientes.
    {
      name: 'POST /users/me/security/change-password',
      run: () =>
        authenticatedClient.security.changePassword({
          currentPassword: TEST_PASSWORD!,
          newPassword: TEST_PASSWORD!,
        }),
    },
  ];

  if (RUN_DESTRUCTIVE_TESTS) {
    for (const test of mutationTests) {
      try {
        await test.run();
        pass(test.name);
      } catch (error) {
        fail(test.name, error);
      }
    }
  } else {
    for (const test of mutationTests) {
      skip(test.name);
    }
  }

  /* ============================================================
   * FASE 3 — CICLO DE VIDA DEL TOKEN
   * ============================================================ */

  try {
    const refreshed = await refreshToken(refreshTokenValue);

    accessToken = refreshed.token;
    refreshTokenValue = refreshed.refreshToken;

    pass('POST /auth/refresh');
  } catch (error) {
    fail('POST /auth/refresh', error);
  }

  if (refreshTokenValue) {
    try {
      await logout(refreshTokenValue);
      pass('POST /auth/logout');
    } catch (error) {
      fail('POST /auth/logout', error);
    }
  }

  printResults();

  const failed = results.filter((result) => result.status === 'FAIL');

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

function printResults() {
  console.log('\nResults:\n');

  for (const result of results) {
    const icon =
      result.status === 'PASS' ? '✓' : result.status === 'SKIP' ? '○' : '✗';

    console.log(`${icon} ${result.status.padEnd(4)} ${result.name}`);

    if (result.error) {
      console.log(`      ${result.error}`);
    }
  }

  const passed = results.filter((result) => result.status === 'PASS').length;

  const failed = results.filter((result) => result.status === 'FAIL').length;

  const skipped = results.filter((result) => result.status === 'SKIP').length;

  console.log('\n--------------------------------');
  console.log(`Passed:  ${passed}`);
  console.log(`Failed:  ${failed}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total:   ${results.length}`);
  console.log('--------------------------------\n');
}

run().catch((error) => {
  console.error('\nUnexpected test error:');

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exitCode = 1;
});
