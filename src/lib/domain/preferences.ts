import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { BackendOperationError } from '@/lib/backend/errors';
import type {
  BackendPreferences,
  BackendUpdatePreferencesInput,
} from '@/lib/backend/types';

function jsonObject(value: Prisma.JsonValue, keys: string[]): Record<string, boolean> {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    keys.some((key) => typeof value[key] !== 'boolean')
  ) {
    throw new BackendOperationError(500, 'INTERNAL_ERROR');
  }
  const result: Record<string, boolean> = {};
  for (const key of keys) result[key] = value[key] as boolean;
  return result;
}

function mapPreferences(row: {
  language: string;
  theme: string;
  timezone: string;
  notifications: Prisma.JsonValue;
  accessibility: Prisma.JsonValue;
}): BackendPreferences {
  if (!['system', 'light', 'dark'].includes(row.theme)) {
    throw new BackendOperationError(500, 'INTERNAL_ERROR');
  }
  return {
    language: row.language,
    theme: row.theme as BackendPreferences['theme'],
    timezone: row.timezone,
    notifications: jsonObject(row.notifications, ['email', 'push', 'inApp']) as BackendPreferences['notifications'],
    accessibility: jsonObject(row.accessibility, ['reducedMotion', 'highContrast']) as BackendPreferences['accessibility'],
  };
}

export async function getPreferences(userId: string): Promise<BackendPreferences> {
  const row = await prisma.preferences.findUnique({ where: { userId } });
  if (!row) throw new BackendOperationError(404, 'NOT_FOUND');
  return mapPreferences(row);
}

export async function updatePreferences(
  userId: string,
  input: BackendUpdatePreferencesInput,
): Promise<BackendPreferences> {
  if (
    Object.values(input).some((value) => value === null) ||
    (input.language !== undefined && !['es', 'en'].includes(input.language)) ||
    (input.theme !== undefined && !['system', 'light', 'dark'].includes(input.theme)) ||
    (input.timezone !== undefined && !isValidTimezone(input.timezone)) ||
    (input.notifications !== undefined &&
      Object.values(input.notifications).some((value) => typeof value !== 'boolean')) ||
    (input.accessibility !== undefined &&
      Object.values(input.accessibility).some((value) => typeof value !== 'boolean'))
  ) {
    throw new BackendOperationError(422, 'VALIDATION_ERROR');
  }
  const current = await prisma.preferences.findUnique({ where: { userId } });
  if (!current) throw new BackendOperationError(404, 'NOT_FOUND');
  const notifications = {
    ...jsonObject(current.notifications, ['email', 'push', 'inApp']),
    ...input.notifications,
  };
  const accessibility = {
    ...jsonObject(current.accessibility, ['reducedMotion', 'highContrast']),
    ...input.accessibility,
  };
  const row = await prisma.preferences.update({
    where: { userId },
    data: {
      ...(input.language !== undefined && { language: input.language }),
      ...(input.theme !== undefined && { theme: input.theme }),
      ...(input.timezone !== undefined && { timezone: input.timezone }),
      ...(input.notifications !== undefined && { notifications }),
      ...(input.accessibility !== undefined && { accessibility }),
    },
  });
  return mapPreferences(row);
}

function isValidTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
