import { requireAuth } from '../auth';
import type { GraphQLContext } from '../context';

export const userResolvers = {
  Query: {
    me: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      requireAuth(context);

      return context.backend.users.getMe();
    },

    publicProfile: async (
      _parent: unknown,
      args: { userId: string },
      context: GraphQLContext,
    ) => {
      return context.backend.users.getPublicProfile(args.userId);
    },
  },
  User: {
    unreadMessagesCount: (
      parent: { id: string },
      _args: unknown,
      context: GraphQLContext,
    ) => {
      if (!context.session?.user || context.session.user.id !== parent.id) {
        return 0;
      }
      return context.backend.messaging.getUnreadCount();
    },
  },
};
