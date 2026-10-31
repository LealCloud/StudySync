import { makeExecutableSchema } from '@graphql-tools/schema';

import { typeDefs } from './generated/schema';
import { resolvers } from './resolvers';

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
