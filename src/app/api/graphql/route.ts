import { auth } from '@/auth';
import { createBackendClient } from '@/lib/backend';
import { BackendOperationError } from '@/lib/backend/errors';
import { createYoga, type Plugin } from 'graphql-yoga';
import { GraphQLError, type ExecutionResult } from 'graphql';
import { getToken } from 'next-auth/jwt';
import { schema } from '../../../graphql';

function normalizeBackendErrors(result: ExecutionResult): ExecutionResult {
  if (!result.errors?.length) return result;

  return {
    ...result,
    errors: result.errors.map((error) => {
      const originalError = error.originalError;
      if (!(originalError instanceof BackendOperationError)) return error;

      return new GraphQLError(error.message, {
        nodes: error.nodes,
        source: error.source,
        positions: error.positions,
        path: error.path,
        extensions: {
          ...error.extensions,
          code: originalError.code,
          status: originalError.status,
        },
      });
    }),
  };
}

function isAsyncIterable<T>(value: unknown): value is AsyncIterable<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Symbol.asyncIterator in value
  );
}

const backendOperationErrorPlugin: Plugin = {
  onExecute() {
    return {
      onExecuteDone({ result, setResult }) {
        if (isAsyncIterable<ExecutionResult>(result)) {
          return {
            onNext({ result: nextResult, setResult: setNextResult }) {
              setNextResult(normalizeBackendErrors(nextResult));
            },
          };
        }

        setResult(normalizeBackendErrors(result as ExecutionResult));
      },
    };
  },
};

const yoga = createYoga({
  schema,
  plugins: [backendOperationErrorPlugin],
  context: async ({ request }) => {
    const session = await auth();
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    });

    return {
      session,
      backend: createBackendClient(token?.accessToken as string | undefined),
    };
  },
  graphqlEndpoint: '/api/graphql',
});

export { yoga as GET, yoga as POST };
