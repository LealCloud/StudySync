import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { BackendOperationError } from '@/lib/backend/errors';
import type {
  BackendRegisterInput,
  BackendResetTokenValidationResponse,
  BackendUser,
} from '@/lib/backend/types';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

export async function registerUser(
  input: BackendRegisterInput,
): Promise<BackendUser> {
  const passwordHash = await bcrypt.hash(input.password, 10);
  let userId: string;
  try {
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          role: 'student',
        },
      });
      await tx.personalData.create({
        data: {
          userId: created.id,
          firstName: input.firstName,
          lastName: input.lastName,
          identityLocked: false,
        },
      });
      await tx.profile.create({
        data: {
          userId: created.id,
          image: null,
          bio: Prisma.DbNull,
          interests: [],
        },
      });
      await tx.privacySettings.create({ data: { userId: created.id } });
      await tx.preferences.create({
        data: {
          userId: created.id,
          notifications: { email: true, push: true, inApp: true },
          accessibility: { reducedMotion: false, highContrast: false },
        },
      });
      await tx.securitySettings.create({
        data: {
          userId: created.id,
          emailVerified: false,
          twoFactorEnabled: false,
          twoFactorSecret: null,
        },
      });
      await tx.account.create({
        data: { userId: created.id, status: 'active' },
      });
      return created;
    });
    userId = user.id;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new BackendOperationError(409, 'CONFLICT');
    }
    throw error;
  }
  const createdUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { personalData: true },
  });
  if (!createdUser?.personalData) {
    throw new BackendOperationError(500, 'INTERNAL_ERROR');
  }
  return {
    id: createdUser.id,
    name: `${createdUser.personalData.firstName} ${createdUser.personalData.lastName}`,
    email: createdUser.email,
    image: null,
    role: createdUser.role,
    profile: { bio: null, interests: [] },
  };
}

export async function requestPasswordReset(email: string): Promise<void> {
  // El email llega ya normalizado por el schema Zod (trim) y por el route
  // handler (toLowerCase), pero se vuelve a normalizar aquí como defensa
  // en profundidad: esta función es pública dentro del dominio y podría
  // invocarse desde otros flujos futuros sin pasar por el route handler.
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (!user) return;

  const token = randomBytes(32).toString('hex');
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });
    await tx.passwordResetToken.create({
      data: {
        userId: user.id,
        token: tokenHash(token),
        expiresAt: new Date(now.getTime() + RESET_TOKEN_TTL_MS),
      },
    });
  });
  // TODO(password-reset-email): connect email delivery in a later phase.
  if (process.env.NODE_ENV !== 'production') {
    console.info('[password-reset] development token', token);
  }
}

export async function validateResetToken(
  token: string,
): Promise<BackendResetTokenValidationResponse> {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: tokenHash(token) },
  });
  if (
    !resetToken ||
    resetToken.usedAt !== null ||
    resetToken.expiresAt < new Date()
  ) {
    throw new BackendOperationError(400, 'INVALID_RESET_TOKEN');
  }
  return { valid: true };
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  // Doble validación intencional:
  //   1. Aquí: fast-fail barato, evita pagar bcrypt.hash (~100ms) si el
  //      token ya es inválido.
  //   2. En la transacción: fuente de verdad contra carreras entre dos
  //      requests con el mismo token; solo uno debe consumirlo.
  await validateResetToken(token);
  const passwordHash = await bcrypt.hash(newPassword, 10);
  const hashedToken = tokenHash(token);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const resetToken = await tx.passwordResetToken.findUnique({
      where: { token: hashedToken },
    });
    if (
      !resetToken ||
      resetToken.usedAt !== null ||
      resetToken.expiresAt < now
    ) {
      throw new BackendOperationError(400, 'INVALID_RESET_TOKEN');
    }
    await tx.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });
    await tx.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: now },
    });
  });
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<{ id: string; role: 'student' | 'teacher' | 'admin' }> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, passwordHash: true },
  });

  if (!user) {
    throw new BackendOperationError(401, 'UNAUTHENTICATED');
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    throw new BackendOperationError(401, 'UNAUTHENTICATED');
  }

  return { id: user.id, role: user.role };
}
