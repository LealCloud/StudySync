import type { UpdatePrivacySettingsInput } from '@/graphql/generated/graphql';
import { GraphQLError } from 'graphql';
import { requireAuth } from '../auth';
import type { GraphQLContext } from '../context';

/**
 * Aplica la regla general del contrato (BACKEND_API.md §9):
 *   - undefined → no modificar (se omite)
 *   - null      → borrar (no permitido en Privacy → 422, ver §8.2.18)
 *   - valor     → asignar
 *
 * En Privacy ningún campo admite null porque todos son obligatorios
 * en la respuesta y no tienen estado "vacío".
 */
function normalizePrivacyInput(
  input: UpdatePrivacySettingsInput,
): Parameters<GraphQLContext['backend']['privacy']['update']>[0] {
  function rejectNull<T>(
    value: T,
    field: string,
  ): asserts value is Exclude<T, null> {
    if (value === null) {
      throw new GraphQLError(`${field} does not accept null`, {
        extensions: { code: 'VALIDATION_ERROR', status: 422 },
      });
    }
  }

  rejectNull(input.profileVisibility, 'profileVisibility');
  rejectNull(input.emailVisibility, 'emailVisibility');
  rejectNull(input.phoneVisibility, 'phoneVisibility');
  rejectNull(input.allowDirectMessages, 'allowDirectMessages');

  const normalized: Parameters<
    GraphQLContext['backend']['privacy']['update']
  >[0] = {};

  if (input.profileVisibility !== undefined) {
    normalized.profileVisibility = input.profileVisibility;
  }
  if (input.emailVisibility !== undefined) {
    normalized.emailVisibility = input.emailVisibility;
  }
  if (input.phoneVisibility !== undefined) {
    normalized.phoneVisibility = input.phoneVisibility;
  }
  if (input.allowDirectMessages !== undefined) {
    normalized.allowDirectMessages = input.allowDirectMessages;
  }

  return normalized;
}

export const privacyResolvers = {
  Query: {
    myPrivacySettings: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      requireAuth(context);
      return context.backend.privacy.getMe();
    },
  },
  Mutation: {
    updatePrivacySettings: async (
      _parent: unknown,
      args: { input: UpdatePrivacySettingsInput },
      context: GraphQLContext,
    ) => {
      requireAuth(context);
      return context.backend.privacy.update(
        normalizePrivacyInput(args.input),
      );
    },
  },
};
