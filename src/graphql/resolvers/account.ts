import type { GraphQLContext } from '../context';
import { requireAuth, requireRole } from '../auth';

export const accountResolvers = {
  Query: {
    myAccount: (_: unknown, __: unknown, c: GraphQLContext) => {
      requireAuth(c);
      return c.backend.account.getMe();
    },
  },
  Mutation: {
    requestAccountDeactivation: (_: unknown, __: unknown, c: GraphQLContext) => {
      requireRole(c, ['student']);
      return c.backend.account.requestDeactivation();
    },
    cancelAccountDeactivation: (_: unknown, __: unknown, c: GraphQLContext) => {
      requireRole(c, ['student']);
      return c.backend.account.cancelDeactivation();
    },
  },
};
