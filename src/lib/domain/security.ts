import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { BackendOperationError } from '@/lib/backend/errors';
import type {
  BackendChangePasswordInput,
  BackendSecurityOperationResult,
  BackendSecuritySettings,
  BackendTwoFactorSetup,
} from '@/lib/backend/types';

const pendingSetups = new Map<string, string>();
const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+=\-[\]{};:'",.<>/?\\|`~]).{6,15}$/;

function base32(bytes: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let result = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) result += alphabet[(value << (5 - bits)) & 31];
  return result;
}

function validCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

export async function getSecuritySettings(
  userId: string,
): Promise<BackendSecuritySettings> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { securitySettings: true },
  });
  if (!user || !user.securitySettings) {
    throw new BackendOperationError(404, 'NOT_FOUND');
  }
  return {
    email: user.email,
    emailVerified: user.securitySettings.emailVerified,
    twoFactorEnabled: user.securitySettings.twoFactorEnabled,
    twoFactorRequired: user.role !== 'student',
    sessions: [],
  };
}

export async function changePassword(
  userId: string,
  input: BackendChangePasswordInput,
): Promise<BackendSecurityOperationResult> {
  if (!PASSWORD_PATTERN.test(input.newPassword)) {
    throw new BackendOperationError(422, 'VALIDATION_ERROR');
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user) throw new BackendOperationError(404, 'NOT_FOUND');
  const matches = await bcrypt.compare(
    input.currentPassword,
    user.passwordHash,
  );
  if (!matches)
    throw new BackendOperationError(422, 'INVALID_CURRENT_PASSWORD');
  if (input.newPassword === input.currentPassword) {
    throw new BackendOperationError(409, 'CONFLICT');
  }
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(input.newPassword, 10) },
  });
  return { success: true, message: null };
}

export async function beginTwoFactorSetup(
  userId: string,
): Promise<BackendTwoFactorSetup> {
  const [user, settings] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
    prisma.securitySettings.findUnique({ where: { userId } }),
  ]);
  if (!user || !settings) throw new BackendOperationError(404, 'NOT_FOUND');
  if (settings.twoFactorEnabled) {
    throw new BackendOperationError(409, 'CONFLICT');
  }
  const secret = base32(randomBytes(20));
  pendingSetups.set(userId, secret);
  const label = encodeURIComponent(`StudySync:${user.email}`);
  const uri = `otpauth://totp/${label}?secret=${secret}&issuer=StudySync`;
  // TODO(two-factor-email): setup delivery and QR rendering require email integration.
  return {
    secret,
    qrCode: `data:text/plain;base64,${Buffer.from(uri).toString('base64')}`,
  };
}

export async function verifyTwoFactorSetup(
  userId: string,
  code: string,
): Promise<BackendSecurityOperationResult> {
  if (!validCode(code))
    throw new BackendOperationError(422, 'VALIDATION_ERROR');
  if (!pendingSetups.has(userId)) {
    throw new BackendOperationError(409, 'CONFLICT');
  }
  // TODO(two-factor-code-validation): replace simulated code acceptance with email verification.
  const settings = await prisma.securitySettings.updateMany({
    where: { userId },
    data: { twoFactorEnabled: true },
  });
  if (settings.count === 0) throw new BackendOperationError(404, 'NOT_FOUND');
  pendingSetups.delete(userId);
  return { success: true, message: null };
}

export async function disableTwoFactor(
  userId: string,
  code: string,
): Promise<BackendSecurityOperationResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) throw new BackendOperationError(404, 'NOT_FOUND');
  if (user.role !== 'student')
    throw new BackendOperationError(403, 'FORBIDDEN');
  if (!validCode(code))
    throw new BackendOperationError(422, 'VALIDATION_ERROR');
  const settings = await prisma.securitySettings.updateMany({
    where: { userId },
    data: { twoFactorEnabled: false },
  });
  if (settings.count === 0) throw new BackendOperationError(404, 'NOT_FOUND');
  return { success: true, message: null };
}

// TODO(phase-g): eliminar junto con SessionsSection.tsx (D-7 = B).
// El contrato v2.0 no tiene modelo `Session`, así que estas funciones
// no se pueden implementar. Se mantienen como stubs para satisfacer la
// interfaz `BackendClient` mientras `SessionsSection.tsx` siga existiendo.
// Se eliminan en Fase G.
export async function revokeSession(
  _userId: string,
  _sessionId: string,
): Promise<BackendSecurityOperationResult> {
  throw new BackendOperationError(404, 'NOT_FOUND');
}

export async function revokeOtherSessions(
  _userId: string,
): Promise<BackendSecurityOperationResult> {
  throw new BackendOperationError(404, 'NOT_FOUND');
}
