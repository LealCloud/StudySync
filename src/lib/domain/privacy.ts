import { prisma } from '@/lib/db/prisma';
import { BackendOperationError } from '@/lib/backend/errors';
import type {
  BackendPrivacySettings,
  BackendUpdatePrivacySettingsInput,
} from '@/lib/backend/types';

export async function getPrivacySettings(
  userId: string,
): Promise<BackendPrivacySettings> {
  const settings = await prisma.privacySettings.findUnique({
    where: { userId },
    select: {
      profileVisibility: true,
      emailVisibility: true,
      phoneVisibility: true,
      allowDirectMessages: true,
    },
  });
  if (!settings) throw new BackendOperationError(404, 'NOT_FOUND');
  return settings;
}

export async function updatePrivacySettings(
  userId: string,
  input: BackendUpdatePrivacySettingsInput,
): Promise<BackendPrivacySettings> {
  const allowed = ['everyone', 'authenticated', 'nobody'];
  if (
    Object.values(input).some((value) => value === null) ||
    [input.profileVisibility, input.emailVisibility, input.phoneVisibility].some(
      (value) => value !== undefined && !allowed.includes(value),
    ) ||
    (input.allowDirectMessages !== undefined &&
      typeof input.allowDirectMessages !== 'boolean')
  ) {
    throw new BackendOperationError(422, 'VALIDATION_ERROR');
  }
  const current = await prisma.privacySettings.findUnique({
    where: { userId },
    select: { userId: true },
  });
  if (!current) throw new BackendOperationError(404, 'NOT_FOUND');
  return prisma.privacySettings.update({
    where: { userId },
    data: input,
    select: {
      profileVisibility: true,
      emailVisibility: true,
      phoneVisibility: true,
      allowDirectMessages: true,
    },
  });
}
