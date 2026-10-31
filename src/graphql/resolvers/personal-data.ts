import { GraphQLError } from 'graphql';
import type { UpdatePersonalDataInput } from '@/graphql/generated/graphql';
import type {
  BackendDocumentType,
  BackendUpdatePersonalDataInput,
} from '@/lib/backend/types';
import type { GraphQLContext } from '../context';
import { requireAuth } from '../auth';

function normalizePersonalDataInput(
  input: UpdatePersonalDataInput,
): BackendUpdatePersonalDataInput {
  if (input.firstName === null || input.lastName === null) {
    throw new GraphQLError('firstName and lastName cannot be null', {
      extensions: { code: 'VALIDATION_ERROR', status: 422 },
    });
  }

  const documentType: unknown = input.documentType;
  if (
    documentType !== undefined &&
    documentType !== null &&
    !isBackendDocumentType(documentType)
  ) {
    throw new GraphQLError('Unsupported documentType', {
      extensions: { code: 'VALIDATION_ERROR', status: 422 },
    });
  }

  const normalized: BackendUpdatePersonalDataInput = {};
  if (input.firstName !== undefined) normalized.firstName = input.firstName;
  if (input.lastName !== undefined) normalized.lastName = input.lastName;
  if (input.documentType !== undefined) {
    normalized.documentType = input.documentType as BackendDocumentType | null;
  }
  if (input.documentId !== undefined) normalized.documentId = input.documentId;
  if (input.phone !== undefined) normalized.phone = input.phone;
  if (input.country !== undefined) normalized.country = input.country;
  if (input.address !== undefined) normalized.address = input.address;
  return normalized;
}

function isBackendDocumentType(value: unknown): value is BackendDocumentType {
  return value === 'passport' || value === 'dni';
}

export const personalDataResolvers = {
  Query: {
    myPersonalData: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      requireAuth(context);
      return context.backend.personalData.getMe();
    },
  },
  Mutation: {
    updatePersonalData: async (
      _parent: unknown,
      args: {
        input: UpdatePersonalDataInput;
      },
      context: GraphQLContext,
    ) => {
      requireAuth(context);
      const input = normalizePersonalDataInput(args.input);
      const personalData = await context.backend.personalData.getMe();
      const identityFields = [
        'firstName',
        'lastName',
        'documentType',
        'documentId',
      ] as const;
      const includesIdentityField = identityFields.some((field) =>
        Object.prototype.hasOwnProperty.call(args.input, field),
      );

      if (personalData.identityLocked && includesIdentityField) {
        throw new GraphQLError('Identity fields are locked', {
          extensions: { code: 'FORBIDDEN', status: 403 },
        });
      }

      return context.backend.personalData.update(input);
    },
  },
};
