import type { GraphQLContext } from '../context';
import { requireRole } from '../auth';

export const coursesResolvers = {
  Query: {
    myCourses: (_: unknown, __: unknown, c: GraphQLContext) => {
      requireRole(c, ['student']);
      return c.backend.courses.getMe();
    },
  },
};
