import { randomUUID } from 'node:crypto';
import { BackendOperationError } from '../src/lib/backend/errors';
import { prisma } from '../src/lib/db/prisma';
import { updatePersonalData } from '../src/lib/domain/personal-data';
import { getPublicProfile, updateProfile } from '../src/lib/domain/users';
import { changePlan } from '../src/lib/domain/subscription';
import { removePaymentMethod } from '../src/lib/domain/billing';
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
  {
    name: 'removePaymentMethod rejects last premium card and deletes otherwise',
    run: () =>
      withUser(async (userId) => {
        const pm1 = await prisma.paymentMethod.create({
          data: { userId, brand: 'Visa', last4: '4242' },
        });
        const removed1 = await removePaymentMethod(userId, pm1.id);
        assert(removed1 === true, 'Expected true when no subscription');
        const after1 = await prisma.paymentMethod.count({ where: { userId } });
        assert(after1 === 0, 'Payment method was not deleted');

        await prisma.subscription.create({
          data: { userId, plan: 'premium', status: 'active' },
        });
        const pm2 = await prisma.paymentMethod.create({
          data: { userId, brand: 'Visa', last4: '4242' },
        });
        await expectDomainError(
          () => removePaymentMethod(userId, pm2.id),
          409,
          'CONFLICT',
        );

        const pm3 = await prisma.paymentMethod.create({
          data: { userId, brand: 'Mastercard', last4: '5555' },
        });
        const removed3 = await removePaymentMethod(userId, pm2.id);
        assert(removed3 === true, 'Expected true when 2 payment methods');
        const after3 = await prisma.paymentMethod.count({ where: { userId } });
        assert(after3 === 1, 'Expected 1 payment method remaining');

        await expectDomainError(
          () => removePaymentMethod(userId, 'nonexistent-id'),
          404,
          'NOT_FOUND',
        );

        await prisma.paymentMethod.deleteMany({ where: { userId } });
        await prisma.subscription.deleteMany({ where: { userId } });
        void pm3;
      }),
  },
  {
    name: 'updatePersonalData clears optional contact fields with null',
    run: () =>
      withUser(async (userId) => {
        // 1. Desbloquear identidad para poder borrar `documentId` (que
        //    es un campo de identidad). En la UI real, un usuario no
        //    bloqueado puede borrar los 4 campos opcionales.
        await prisma.personalData.update({
          where: { userId },
          data: { identityLocked: false },
        });

        // 2. Llenar todos los campos opcionales.
        await updatePersonalData(userId, {
          documentType: 'dni',
          documentId: '12345678',
          phone: '+573001234567',
          country: 'CO',
          address: 'Calle 123 #45-67',
        });

        // 3. Borrarlos todos con null (equivalente a vaciar los
        //    campos en la UI).
        await updatePersonalData(userId, {
          documentId: null,
          phone: null,
          country: null,
          address: null,
        });

        // 4. Verificar que se borraron y que documentType no cambió.
        const data = await prisma.personalData.findUniqueOrThrow({
          where: { userId },
        });
        assert(data.documentId === null, 'documentId no se borró');
        assert(data.phone === null, 'phone no se borró');
        assert(data.country === null, 'country no se borró');
        assert(data.address === null, 'address no se borró');
        assert(
          data.documentType === 'dni',
          'documentType no debía cambiar (solo se borró documentId)',
        );
      }),
  },
  {
    name: 'personalDataSchema normalizes empty string to null',
    run: async () => {
      const { personalDataSchema } =
        await import('../src/lib/schemas/user-settings/personal-data.schema');
      const parsed = personalDataSchema.parse({
        phone: '',
        address: '',
        documentId: '',
        country: '',
      });
      assert(parsed.phone === null, 'phone: "" no se normalizó a null');
      assert(parsed.address === null, 'address: "" no se normalizó a null');
      assert(
        parsed.documentId === null,
        'documentId: "" no se normalizó a null',
      );
      assert(parsed.country === null, 'country: "" no se normalizó a null');
    },
  },
  {
    name: 'timezones catalog has no duplicates and all zones are valid IANA',
    run: async () => {
      const { TIMEZONES, getTimezonesByGroup, isTimezoneInCatalog } =
        await import('../src/config/timezones');

      const seen = new Set<string>();
      for (const tz of TIMEZONES) {
        assert(
          !seen.has(tz.value),
          `Timezone duplicada en el catálogo: ${tz.value}`,
        );
        seen.add(tz.value);
      }

      for (const tz of TIMEZONES) {
        try {
          new Intl.DateTimeFormat('en-US', { timeZone: tz.value });
        } catch {
          throw new Error(`Timezone IANA inválida: ${tz.value}`);
        }
      }

      const groups = getTimezonesByGroup('es');
      assert(groups.length === 6, 'Deben existir 6 grupos');
      const utcGroup = groups.find((g) => g.group === 'utc');
      assert(utcGroup !== undefined, 'Falta el grupo UTC');
      assert(
        utcGroup.options.length === 1,
        'UTC debe tener exactamente 1 zona',
      );
      assert(utcGroup.options[0].value === 'UTC', 'La única zona UTC debe ser "UTC"');

      assert(
        isTimezoneInCatalog('America/Bogota'),
        'Bogotá debe estar en el catálogo',
      );
      assert(
        !isTimezoneInCatalog('XX/Invalid'),
        'XX/Invalid no debe estar en el catálogo',
      );

      for (const tz of TIMEZONES) {
        assert(tz.labelEs.length > 0, `labelEs vacío en ${tz.value}`);
        assert(tz.labelEn.length > 0, `labelEn vacío en ${tz.value}`);
      }
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
