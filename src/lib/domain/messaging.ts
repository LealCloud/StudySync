// Dominio de mensajería.
//
// Decisiones tácticas:
// - `include` siempre trae `sender`/`user` con `profile` y `personalData`
//   para evitar N+1 al construir `BackendUser`. Ningún mapper hace queries.
// - `unreadCount` = mensajes de otros participantes con `createdAt > lastReadAt`
//   del participante actual. Si `lastReadAt` es `null`, cuenta todos los
//   mensajes de otros (el usuario nunca abrió la conversación). Ver M5.
// - `allowDirectMessages` se valida en `startConversation` (M3). Un usuario
//   que bloquee DMs después de iniciada la conversación no bloquea los
//   mensajes existentes.
import { prisma } from '@/lib/db/prisma';
import { BackendOperationError } from '@/lib/backend/errors';
import { MESSAGE_MAX_LENGTH } from '@/lib/schemas/primitives';
import type {
  BackendConversation,
  BackendMessage,
  BackendUser,
} from '@/lib/backend/types';
import type { Prisma } from '@prisma/client';

// Include reutilizable: garantiza que todos los mappers tengan acceso a
// `sender`/`user` con `profile` y `personalData`, sin queries extra.
const senderInclude = {
  profile: true,
  personalData: true,
} as const;

const conversationInclude = {
  participants: {
    include: {
      user: { include: senderInclude },
    },
  },
  messages: {
    orderBy: { createdAt: 'desc' as const },
    take: 1,
    include: { sender: { include: senderInclude } },
  },
} as const;

type ConversationWithDetails = Prisma.ConversationGetPayload<{
  include: typeof conversationInclude;
}>;

type MessageWithSender = Prisma.MessageGetPayload<{
  include: { sender: { include: typeof senderInclude } };
}>;

type UserWithProfileAndPersonalData = Prisma.UserGetPayload<{
  include: typeof senderInclude;
}>;

/**
 * Mapea un `User` de Prisma (con `profile` y `personalData`) a `BackendUser`.
 * No hace queries: usa los datos ya cargados por el `include`.
 */
function toBackendUser(user: UserWithProfileAndPersonalData): BackendUser {
  const firstName = user.personalData?.firstName ?? '';
  const lastName = user.personalData?.lastName ?? '';
  const name = `${firstName} ${lastName}`.trim() || user.email;
  const bio = user.profile?.bio ?? null;
  return {
    id: user.id,
    name,
    email: user.email,
    image: user.profile?.image ?? null,
    role: user.role,
    profile: {
      bio:
        bio && typeof bio === 'object' && !Array.isArray(bio)
          ? {
              title:
                'title' in bio && typeof bio.title === 'string'
                  ? bio.title
                  : null,
              description:
                'description' in bio && typeof bio.description === 'string'
                  ? bio.description
                  : null,
            }
          : null,
      interests: user.profile?.interests ?? [],
    },
  };
}

/** Mapea un `Message` de Prisma (con `sender` incluido) a `BackendMessage`. */
function mapMessage(message: MessageWithSender): BackendMessage {
  return {
    id: message.id,
    conversationId: message.conversationId,
    sender: toBackendUser(message.sender),
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  };
}

/**
 * Mapea una `Conversation` (con `participants.user` y `messages.sender`
 * incluidos) a `BackendConversation`. El `unreadCount` se calcula aparte
 * en `mapConversationsWithUnread` para evitar queries dentro del mapper.
 */
function mapConversationBase(
  conversation: ConversationWithDetails,
): Omit<BackendConversation, 'unreadCount'> {
  const latest = conversation.messages[0] ?? null;
  return {
    id: conversation.id,
    type: conversation.type,
    participants: conversation.participants.map((participant) => ({
      id: participant.id,
      user: toBackendUser(participant.user),
      lastReadAt: participant.lastReadAt?.toISOString() ?? null,
    })),
    lastMessage: latest ? mapMessage(latest) : null,
    lastMessageAt: latest?.createdAt.toISOString() ?? null,
  };
}

/**
 * Calcula `unreadCount` para un lote de conversaciones en una sola query.
 * Evita N+1: agrupa por `conversationId` y filtra por `lastReadAt` de cada
 * participante actual.
 */
async function attachUnreadCounts(
  conversations: ConversationWithDetails[],
  userId: string,
): Promise<BackendConversation[]> {
  if (conversations.length === 0) return [];

  const ownParticipations = conversations.map((conversation) => ({
    conversationId: conversation.id,
    lastReadAt:
      conversation.participants.find((p) => p.userId === userId)?.lastReadAt ??
      null,
  }));

  // Una sola query: cuenta mensajes agrupados por conversación.
  const unreadGroups = await prisma.message.groupBy({
    by: ['conversationId'],
    where: {
      conversationId: { in: conversations.map((c) => c.id) },
      senderId: { not: userId },
      OR: ownParticipations.map((p) => ({
        conversationId: p.conversationId,
        ...(p.lastReadAt ? { createdAt: { gt: p.lastReadAt } } : {}),
      })),
    },
    _count: { _all: true },
  });

  const unreadByConversation = new Map<string, number>(
    unreadGroups.map((group) => [group.conversationId, group._count._all]),
  );

  return conversations.map((conversation) => ({
    ...mapConversationBase(conversation),
    unreadCount: unreadByConversation.get(conversation.id) ?? 0,
  }));
}

async function loadConversation(
  conversationId: string,
  userId: string,
): Promise<BackendConversation> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: conversationInclude,
  });
  if (!conversation) throw new BackendOperationError(404, 'NOT_FOUND');
  const [mapped] = await attachUnreadCounts([conversation], userId);
  return mapped;
}

async function requireParticipant(userId: string, conversationId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
    select: { id: true },
  });
  if (!participant) throw new BackendOperationError(403, 'FORBIDDEN');
  return participant;
}

export async function getConversations(
  userId: string,
): Promise<BackendConversation[]> {
  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { userId } } },
    orderBy: { updatedAt: 'desc' },
    include: conversationInclude,
  });
  return attachUnreadCounts(conversations, userId);
}

export async function startConversation(
  userId: string,
  participantId: string,
): Promise<BackendConversation> {
  if (participantId === userId)
    throw new BackendOperationError(422, 'VALIDATION_ERROR');
  const recipient = await prisma.user.findUnique({
    where: { id: participantId },
    include: { privacySettings: true },
  });
  if (!recipient) throw new BackendOperationError(404, 'NOT_FOUND');
  if (
    !recipient.privacySettings ||
    !recipient.privacySettings.allowDirectMessages
  ) {
    throw new BackendOperationError(403, 'FORBIDDEN');
  }
  const directKey = [userId, participantId].sort().join(':');
  const existing = await prisma.conversation.findUnique({
    where: { directKey },
  });
  if (existing) return loadConversation(existing.id, userId);
  const conversation = await prisma.$transaction(async (tx) => {
    const created = await tx.conversation.create({
      data: { type: 'direct', directKey },
    });
    await tx.conversationParticipant.createMany({
      data: [
        { conversationId: created.id, userId },
        { conversationId: created.id, userId: participantId },
      ],
    });
    return created;
  });
  return loadConversation(conversation.id, userId);
}

export async function getMessages(
  userId: string,
  conversationId: string,
  before?: string,
  limit = 50,
): Promise<BackendMessage[]> {
  await requireParticipant(userId, conversationId);
  const pageSize = Math.min(Math.max(Math.trunc(limit), 1), 100);
  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      ...(before ? { createdAt: { lt: new Date(before) } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: pageSize,
    include: { sender: { include: senderInclude } },
  });
  return messages.reverse().map(mapMessage);
}

export async function sendMessage(
  userId: string,
  conversationId: string,
  content: string,
): Promise<BackendMessage> {
  await requireParticipant(userId, conversationId);
  if (content.trim().length < 1 || content.length > MESSAGE_MAX_LENGTH)
    throw new BackendOperationError(422, 'VALIDATION_ERROR');
  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: { conversationId, senderId: userId, content },
      include: { sender: { include: senderInclude } },
    });
    // `@updatedAt` actualiza `updatedAt` automáticamente en cualquier
    // `update`. El `data: {}` es intencional: no queremos modificar nada
    // más que el timestamp, pero Prisma requiere un `data` no vacío.
    await tx.conversation.update({
      where: { id: conversationId },
      data: {},
    });
    return created;
  });
  return mapMessage(message);
}

export async function markAsRead(
  userId: string,
  conversationId: string,
): Promise<BackendConversation> {
  await requireParticipant(userId, conversationId);
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { lastReadAt: new Date() },
  });
  return loadConversation(conversationId, userId);
}
