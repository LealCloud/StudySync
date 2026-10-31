import { makeExecutableSchema } from '@graphql-tools/schema';

import { typeDefs } from '../src/graphql/generated/schema';

try {
  makeExecutableSchema({
    typeDefs,
    resolvers: {},
  });

  console.log('✓ GraphQL schema válido');
} catch (error) {
  console.error('✗ GraphQL schema inválido');
  console.error(error);
  process.exit(1);
}
