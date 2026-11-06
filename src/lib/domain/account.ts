import { prisma } from '@/lib/db/prisma';
import { BackendOperationError } from '@/lib/backend/errors';
import type { BackendAccount } from '@/lib/backend/types';

const GRACE_PERIOD_DAYS = 14; // TODO(grace-period-config)

export async function getAccount(userId: string): Promise<BackendAccount> {
  const account = await prisma.account.findUnique({ where: { userId } });
  if (!account) throw new BackendOperationError(404, 'NOT_FOUND');
  return {
    status: account.status,
    deactivationScheduledAt: account.deactivationScheduledAt?.toISOString() ?? null,
  };
}

export async function requestAccountDeactivation(
  userId: string,
): Promise<BackendAccount> {
  const account = await prisma.account.findUnique({ where: { userId } });
  if (!account) throw new BackendOperationError(404, 'NOT_FOUND');
  if (account.status !== 'active') {
    throw new BackendOperationError(409, 'CONFLICT');
  }
  const updated = await prisma.account.update({
    where: { userId },
    data: {
      status: 'pending_deactivation',
      deactivationScheduledAt: new Date(
        Date.now() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000,
      ),
    },
  });
  return {
    status: updated.status,
    deactivationScheduledAt: updated.deactivationScheduledAt?.toISOString() ?? null,
  };
}

export async function cancelAccountDeactivation(
  userId: string,
): Promise<BackendAccount> {
  const account = await prisma.account.findUnique({ where: { userId } });
  if (!account) throw new BackendOperationError(404, 'NOT_FOUND');
  if (account.status !== 'pending_deactivation') {
    throw new BackendOperationError(409, 'CONFLICT');
  }
  const updated = await prisma.account.update({
    where: { userId },
    data: { status: 'active', deactivationScheduledAt: null },
  });
  return {
    status: updated.status,
    deactivationScheduledAt: updated.deactivationScheduledAt?.toISOString() ?? null,
  };
}
