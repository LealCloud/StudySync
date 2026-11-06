import { prisma } from '@/lib/db/prisma';
import { BackendOperationError } from '@/lib/backend/errors';
import type {
  BackendSubscription,
  BackendSubscriptionPlan,
} from '@/lib/backend/types';

const PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

function toBackendSubscription(row: {
  id: string;
  plan: BackendSubscriptionPlan;
  status: BackendSubscription['status'];
  startedAt: Date;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}): BackendSubscription {
  return {
    id: row.id,
    plan: row.plan,
    status: row.status,
    startedAt: row.startedAt.toISOString(),
    currentPeriodEnd: row.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
  };
}

export async function changePlan(
  userId: string,
  plan: BackendSubscriptionPlan,
): Promise<BackendSubscription> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });
  if (!subscription) throw new BackendOperationError(404, 'NOT_FOUND');
  if (subscription.plan === 'enterprise' || plan === 'enterprise') {
    throw new BackendOperationError(403, 'FORBIDDEN');
  }
  if (plan === subscription.plan)
    throw new BackendOperationError(409, 'CONFLICT');
  if (plan === 'premium') {
    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: { userId },
      select: { id: true },
    });
    if (!paymentMethod) {
      throw new BackendOperationError(409, 'PAYMENT_METHOD_REQUIRED');
    }
  }

  const currentPeriodEnd = new Date(Date.now() + PERIOD_MS);
  const updated = await prisma.subscription.update({
    where: { userId },
    data:
      plan === 'free'
        ? { cancelAtPeriodEnd: true, currentPeriodEnd }
        : {
            plan,
            status: 'active',
            cancelAtPeriodEnd: false,
            currentPeriodEnd,
          },
  });
  return toBackendSubscription(updated);
}

export async function cancelSubscription(
  userId: string,
): Promise<BackendSubscription> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });
  if (!subscription) throw new BackendOperationError(404, 'NOT_FOUND');
  if (subscription.cancelAtPeriodEnd) {
    throw new BackendOperationError(409, 'CONFLICT');
  }
  const updated = await prisma.subscription.update({
    where: { userId },
    data: { cancelAtPeriodEnd: true },
  });
  return toBackendSubscription(updated);
}
