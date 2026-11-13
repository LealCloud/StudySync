import { requireAuth } from '../auth';
import type { GraphQLContext } from '../context';

export const messagingResolvers = {
  Query: {
    myConversations: (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      requireAuth(context);
      return context.backend.messaging.getConversations();
    },
    messages: (
      _parent: unknown,
      args: { conversationId: string; before?: string; limit?: number },
      context: GraphQLContext,
    ) => {
      requireAuth(context);
      return context.backend.messaging.getMessages(
        args.conversationId,
        args.before,
        args.limit,
      );
    },
  },
  Mutation: {
    startConversation: (
      _parent: unknown,
      args: { participantId: string },
      context: GraphQLContext,
    ) => {
      requireAuth(context);
      return context.backend.messaging.startConversation(args.participantId);
    },
    sendMessage: (
      _parent: unknown,
      args: { conversationId: string; content: string },
      context: GraphQLContext,
    ) => {
      requireAuth(context);
      return context.backend.messaging.sendMessage(
        args.conversationId,
        args.content,
      );
    },
    markConversationAsRead: (
      _parent: unknown,
      args: { conversationId: string },
      context: GraphQLContext,
    ) => {
      requireAuth(context);
      return context.backend.messaging.markAsRead(args.conversationId);
    },
  },
};
