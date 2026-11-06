import { prisma } from '@/lib/db/prisma';
import { BackendOperationError } from '@/lib/backend/errors';
import type {
  BackendInvoice,
  BackendPaymentMethod,
  BackendSubscription,
} from '@/lib/backend/types';

export async function getSubscription(
  userId: string,
): Promise<BackendSubscription | null> {
  const row = await prisma.subscription.findUnique({ where: { userId } });
  if (!row) return null;
  return {
    id: row.id,
    plan: row.plan,
    status: row.status,
    startedAt: row.startedAt.toISOString(),
    currentPeriodEnd: row.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
  };
}

export async function getPaymentMethods(
  userId: string,
): Promise<BackendPaymentMethod[]> {
  return prisma.paymentMethod.findMany({
    where: { userId },
    select: { id: true, brand: true, last4: true, expirationMonth: true, expirationYear: true },
  });
}

export async function getInvoices(userId: string): Promise<BackendInvoice[]> {
  const rows = await prisma.invoice.findMany({ where: { userId } });
  return rows.map(({ id, number, amount, currency, status, issuedAt, downloadUrl }) => ({
    id,
    number,
    amount,
    currency,
    status,
    issuedAt: issuedAt.toISOString(),
    downloadUrl,
  }));
}

export async function removePaymentMethod(
  userId: string,
  paymentMethodId: string,
): Promise<boolean> {
  const paymentMethod = await prisma.paymentMethod.findFirst({
    where: { id: paymentMethodId, userId },
    select: { id: true },
  });
  if (!paymentMethod) throw new BackendOperationError(404, 'NOT_FOUND');

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true, status: true },
  });
  if (
    subscription?.plan === 'premium' &&
    subscription.status === 'active' &&
    (await prisma.paymentMethod.count({ where: { userId } })) === 1
  ) {
    throw new BackendOperationError(409, 'CONFLICT');
  }

  await prisma.paymentMethod.deleteMany({
    where: { id: paymentMethodId, userId },
  });
  return true;
}
