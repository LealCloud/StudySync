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
};
