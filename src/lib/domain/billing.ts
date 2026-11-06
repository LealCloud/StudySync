import { prisma } from '@/lib/db/prisma';
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
