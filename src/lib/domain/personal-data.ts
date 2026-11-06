import { prisma } from '@/lib/db/prisma';
import { BackendOperationError } from '@/lib/backend/errors';
import type {
  BackendPersonalData,
  BackendUpdatePersonalDataInput,
} from '@/lib/backend/types';

export async function getPersonalData(
  userId: string,
): Promise<BackendPersonalData> {
  const data = await prisma.personalData.findUnique({
    where: { userId },
    select: {
      firstName: true,
      lastName: true,
      documentType: true,
      documentId: true,
      phone: true,
      country: true,
      address: true,
      identityLocked: true,
    },
  });
  if (!data) throw new BackendOperationError(404, 'NOT_FOUND');
  return data;
}

export async function updatePersonalData(
  userId: string,
  input: BackendUpdatePersonalDataInput,
): Promise<BackendPersonalData> {
  const current = await prisma.personalData.findUnique({
    where: { userId },
    select: { identityLocked: true },
  });
  if (!current) throw new BackendOperationError(404, 'NOT_FOUND');
  if (
    (input.firstName === null || input.lastName === null) ||
    (input.documentType !== undefined &&
      input.documentType !== null &&
      !['passport', 'dni'].includes(input.documentType))
  ) {
    throw new BackendOperationError(422, 'VALIDATION_ERROR');
  }
  const identityChanged =
    input.firstName !== undefined ||
    input.lastName !== undefined ||
    input.documentType !== undefined ||
    input.documentId !== undefined;
  if (current.identityLocked && identityChanged) {
    throw new BackendOperationError(403, 'FORBIDDEN');
  }
  const data = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
  return prisma.personalData.update({
    where: { userId },
    data,
    select: {
      firstName: true,
      lastName: true,
      documentType: true,
      documentId: true,
      phone: true,
      country: true,
      address: true,
      identityLocked: true,
    },
  });
}
