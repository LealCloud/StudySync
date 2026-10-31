import type { GraphQLContext } from '../context';
import { requireRole } from '../auth';

export const certificatesResolvers = {
  Query: {
    myCertificates: (_: unknown, __: unknown, c: GraphQLContext) => {
      requireRole(c, ['student']);
      return c.backend.certificates.getMe();
    },
  },
};
