import type { GraphQLContext } from '../context';
import { requireAuth } from '../auth';

export const profileResolvers = {
  Query: {
    publicProfile: (_: unknown, a: { userId: string }, c: GraphQLContext) =>
      c.backend.users.getPublicProfile(a.userId),
  },
  Mutation: {
    updateProfile: (
      _: unknown,
      a: {
        input: Parameters<
          GraphQLContext['backend']['users']['updateProfile']
        >[0];
      },
      c: GraphQLContext,
    ) => {
      requireAuth(c);
      return c.backend.users.updateProfile(a.input);
    },
  },
};
