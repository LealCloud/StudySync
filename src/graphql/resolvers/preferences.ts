import type { UpdatePreferencesInput } from '@/graphql/generated/graphql';
import { GraphQLError } from 'graphql';
import { requireAuth } from '../auth';
import type { GraphQLContext } from '../context';

const SUPPORTED_LANGUAGES = ['es', 'en'] as const;

/**
 * Aplica la regla general del contrato (BACKEND_API.md §9):
 *   - undefined → no modificar (se omite)
 *   - null      → borrar (no permitido en Preferences → 422, ver §8.1)
 *   - valor     → asignar
 *
 * En Preferences ningún campo admite null porque todos son obligatorios
 * en la respuesta y no tienen estado "vacío".
 */
function normalizePreferencesInput(
  input: UpdatePreferencesInput,
): Parameters<GraphQLContext['backend']['preferences']['update']>[0] {
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

  rejectNull(input.language, 'language');
  rejectNull(input.theme, 'theme');
  rejectNull(input.timezone, 'timezone');
  rejectNull(input.notifications, 'notifications');
  rejectNull(input.accessibility, 'accessibility');

  if (
    input.language !== undefined &&
    !SUPPORTED_LANGUAGES.includes(input.language as never)
  ) {
    throw new GraphQLError('Unsupported language', {
      extensions: { code: 'VALIDATION_ERROR', status: 422 },
    });
  }

  const normalized: Parameters<
    GraphQLContext['backend']['preferences']['update']
  >[0] = {};

  if (input.language !== undefined) normalized.language = input.language;
  if (input.theme !== undefined) normalized.theme = input.theme;
  if (input.timezone !== undefined) normalized.timezone = input.timezone;
  if (input.notifications !== undefined) {
    normalized.notifications = input.notifications as NonNullable<
      typeof normalized.notifications
    >;
  }
  if (input.accessibility !== undefined) {
    normalized.accessibility = input.accessibility as NonNullable<
      typeof normalized.accessibility
    >;
  }

  return normalized;
}

export const preferencesResolvers = {
  Query: {
    myPreferences: (_: unknown, __: unknown, c: GraphQLContext) => {
      requireAuth(c);
      return c.backend.preferences.getMe();
    },
  },
  Mutation: {
    updatePreferences: (
      _: unknown,
      a: { input: UpdatePreferencesInput },
      c: GraphQLContext,
    ) => {
      requireAuth(c);
      return c.backend.preferences.update(normalizePreferencesInput(a.input));
    },
  },
};
