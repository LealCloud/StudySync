import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { BackendOperationError } from '@/lib/backend/errors';
import type {
  BackendBio,
  BackendPublicProfile,
  BackendUpdateProfileInput,
  BackendUser,
  ProfileVisibility,
} from '@/lib/backend/types';

function bioFromJson(value: Prisma.JsonValue | null): BackendBio | null {
  if (value === null) return null;
  if (
    typeof value !== 'object' ||
    Array.isArray(value) ||
    !('title' in value) ||
    !('description' in value) ||
    (value.title !== null && typeof value.title !== 'string') ||
    (value.description !== null && typeof value.description !== 'string')
  ) {
    throw new BackendOperationError(500, 'INTERNAL_ERROR');
  }
  return { title: value.title, description: value.description };
}

export async function getUser(userId: string): Promise<BackendUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true, personalData: true },
  });
  if (!user || !user.personalData) {
    throw new BackendOperationError(404, 'NOT_FOUND');
  }
  return {
    id: user.id,
    name: `${user.personalData.firstName} ${user.personalData.lastName}`,
    email: user.email,
    image: user.profile?.image ?? null,
    role: user.role,
    profile: {
      bio: bioFromJson(user.profile?.bio ?? null),
      interests: user.profile?.interests ?? [],
    },
  };
}

function canView(visibility: ProfileVisibility, requesterId: string | null) {
  return (
    visibility === 'everyone' ||
    (visibility === 'authenticated' && requesterId !== null)
  );
}

export async function getPublicProfile(
  userId: string,
  requesterId: string | null,
): Promise<BackendPublicProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true, personalData: true, privacySettings: true },
  });
  if (!user || !user.personalData || !user.privacySettings) return null;

  const privacy = user.privacySettings;
  const isSelf = requesterId === userId;
  if (
    !isSelf &&
    (privacy.profileVisibility === 'nobody' ||
      (privacy.profileVisibility === 'authenticated' && requesterId === null))
  ) {
    return null;
  }

  const fieldVisible = (visibility: ProfileVisibility) =>
    isSelf || canView(visibility, requesterId);
  return {
    id: user.id,
    name: `${user.personalData.firstName} ${user.personalData.lastName}`,
    image: user.profile?.image ?? null,
    bio: bioFromJson(user.profile?.bio ?? null),
    interests: user.profile?.interests ?? [],
    email: fieldVisible(privacy.emailVisibility) ? user.email : null,
    phone: fieldVisible(privacy.phoneVisibility)
      ? user.personalData.phone
      : null,
    allowDirectMessages: privacy.allowDirectMessages,
  };
}

export async function updateProfile(
  userId: string,
  input: BackendUpdateProfileInput,
): Promise<BackendUser> {
  const data: Prisma.ProfileUpdateInput = {};
  if (input.image !== undefined) {
    if (input.image !== null && typeof input.image !== 'string') {
      throw new BackendOperationError(422, 'VALIDATION_ERROR');
    }
    data.image = input.image;
  }
  if (input.interests !== undefined) {
    if (
      input.interests !== null &&
      (!Array.isArray(input.interests) ||
        !input.interests.every((interest) => typeof interest === 'string'))
    ) {
      throw new BackendOperationError(422, 'VALIDATION_ERROR');
    }
    data.interests = input.interests ?? [];
  }
  if (input.bio !== undefined) {
    if (input.bio === null) {
      data.bio = Prisma.DbNull;
    } else {
      const bio = input.bio as Record<string, unknown>;
      if (
        !bio ||
        typeof bio !== 'object' ||
        Array.isArray(bio) ||
        Object.keys(bio).some((key) => !['title', 'description'].includes(key)) ||
        ['title', 'description'].some(
          (key) =>
            key in bio && bio[key] !== null && typeof bio[key] !== 'string',
        )
      ) {
        throw new BackendOperationError(422, 'VALIDATION_ERROR');
      }
      const current = await prisma.profile.findUnique({ where: { userId } });
      const existing = bioFromJson(current?.bio ?? null);
      data.bio = {
        title: 'title' in bio ? bio.title : (existing?.title ?? null),
        description:
          'description' in bio
            ? bio.description
            : (existing?.description ?? null),
      } as Prisma.InputJsonValue;
    }
  }
  await getUser(userId);
  await prisma.profile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
  await prisma.profile.update({ where: { userId }, data });
  return getUser(userId);
}
