import { randomUUID } from 'node:crypto';
import { BackendOperationError } from '../src/lib/backend/errors';
import { prisma } from '../src/lib/db/prisma';
import { updatePersonalData } from '../src/lib/domain/personal-data';
import { getPublicProfile, updateProfile } from '../src/lib/domain/users';
import { changePlan } from '../src/lib/domain/subscription';
import { submitContact } from '../src/lib/domain/contact';

type TestCase = { name: string; run: () => Promise<void> };
const results: { name: string; passed: boolean; error?: string }[] = [];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function expectDomainError(
  run: () => Promise<unknown>,
  status: number,
  code: string,
) {
  try {
    await run();
  } catch (error) {
    assert(error instanceof BackendOperationError, 'Expected a domain error');
    assert(
      error.status === status,
      `Expected status ${status}, got ${error.status}`,
    );
    assert(error.code === code, `Expected code ${code}, got ${error.code}`);
    return;
  }
  throw new Error(`Expected ${status} ${code}`);
}

async function withUser(run: (userId: string) => Promise<void>): Promise<void> {
  const userId = randomUUID();
  const email = `domain-${userId}@example.test`;
  await prisma.user.create({
    data: {
      id: userId,
      email,
      passwordHash: 'unused-test-hash',
      role: 'student',
      personalData: {
        create: {
          firstName: 'Domain',
          lastName: 'Test',
          identityLocked: true,
        },
      },
      profile: {
        create: {
          bio: { title: 'Original title', description: 'Original description' },
          interests: ['testing'],
        },
      },
      privacySettings: { create: {} },
    },
  });
  try {
    await run(userId);
  } finally {
    await prisma.user.deleteMany({ where: { id: userId } });
  }
}

const tests: TestCase[] = [
  {
    name: 'identityLocked rejects mixed identity/contact patch atomically',
    run: () =>
      withUser(async (userId) => {
        await expectDomainError(
          () =>
            updatePersonalData(userId, {
              firstName: 'Changed',
              phone: '+573001234567',
            }),
          403,
          'FORBIDDEN',
        );
        const data = await prisma.personalData.findUniqueOrThrow({
          where: { userId },
        });
        assert(data.firstName === 'Domain', 'Identity field was modified');
        assert(data.phone === null, 'Contact field was partially modified');
      }),
  },
  {
    name: 'profile bio merges partial fields and clears with DbNull',
    run: () =>
      withUser(async (userId) => {
        await updateProfile(userId, { bio: { title: 'Updated title' } });
        const merged = await prisma.profile.findUniqueOrThrow({
          where: { userId },
        });
        assert(
          JSON.stringify(merged.bio) ===
            JSON.stringify({
              title: 'Updated title',
              description: 'Original description',
            }),
          'Partial bio update did not preserve description',
        );
        await updateProfile(userId, { bio: null });
        const cleared = await prisma.profile.findUniqueOrThrow({
          where: { userId },
        });
        assert(cleared.bio === null, 'bio: null did not clear JSON value');
      }),
  },
  {
    name: 'public profile visibility matrix',
    run: () =>
      withUser(async (userId) => {
        const otherRequester = randomUUID();
        const cases = [
          {
            visibility: 'everyone' as const,
            anonymous: true,
            authenticated: true,
          },
          {
            visibility: 'authenticated' as const,
            anonymous: false,
            authenticated: true,
          },
          {
            visibility: 'nobody' as const,
            anonymous: false,
            authenticated: false,
          },
        ];
        for (const item of cases) {
          await prisma.privacySettings.update({
            where: { userId },
            data: { profileVisibility: item.visibility },
          });
          const anonymous = await getPublicProfile(userId, null);
          const authenticated = await getPublicProfile(userId, otherRequester);
          assert(
            (anonymous !== null) === item.anonymous,
            `Anonymous visibility mismatch for ${item.visibility}`,
          );
          assert(
            (authenticated !== null) === item.authenticated,
            `Authenticated visibility mismatch for ${item.visibility}`,
          );
        }
      }),
  },
  {
    name: 'subscription upgrade, downgrade, conflict, enterprise and payment rules',
    run: () =>
      withUser(async (userId) => {
        await prisma.subscription.create({
          data: { userId, plan: 'free', status: 'active' },
        });
        await prisma.paymentMethod.create({ data: { userId } });

        const upgraded = await changePlan(userId, 'premium');
        assert(
          upgraded.plan === 'premium',
          'Upgrade did not apply immediately',
        );
        assert(
          upgraded.currentPeriodEnd !== null,
          'Upgrade period was not set',
        );
        await expectDomainError(
          () => changePlan(userId, 'premium'),
          409,
          'CONFLICT',
        );
        await expectDomainError(
          () => changePlan(userId, 'enterprise'),
          403,
          'FORBIDDEN',
        );

        const downgraded = await changePlan(userId, 'free');
        assert(downgraded.plan === 'premium', 'Downgrade changed plan early');
        assert(downgraded.cancelAtPeriodEnd, 'Downgrade was not scheduled');

        await prisma.subscription.update({
          where: { userId },
          data: { plan: 'free', cancelAtPeriodEnd: false },
        });
        await prisma.paymentMethod.deleteMany({ where: { userId } });
        await expectDomainError(
          () => changePlan(userId, 'premium'),
          409,
          'PAYMENT_METHOD_REQUIRED',
        );
      }),
  },
  {
    name: 'contact stub resolves successfully',
    run: async () => {
      const result = await submitContact({
        name: 'Domain Test',
        email: 'domain@example.test',
        subject: 'A test subject',
        message: 'This is a sufficiently long test contact message.',
      });
      assert(result === undefined, 'Contact stub should resolve void');
    },
  },
];

async function main() {
  console.log('\n=== Domain tests ===\n');
  for (const test of tests) {
    try {
      await test.run();
      results.push({ name: test.name, passed: true });
    } catch (error) {
      results.push({
        name: test.name,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  for (const result of results) {
    console.log(`${result.passed ? '✓ PASS' : '✗ FAIL'} ${result.name}`);
    if (result.error) console.log(`       ${result.error}`);
  }
  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;
  console.log(`\nPassed: ${passed}/${results.length}`);
  console.log(`Failed: ${failed}/${results.length}`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
