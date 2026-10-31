import { requireAuth, requireRole } from '../auth';
import type { GraphQLContext } from '../context';

export const securityResolvers = {
  Query: {
    mySecuritySettings: (_: unknown, __: unknown, context: GraphQLContext) => {
      requireAuth(context);
      return context.backend.security.getMe();
    },
  },
  Mutation: {
    requestEmailChange: (
      _: unknown,
      args: { input: { newEmail: string } },
      context: GraphQLContext,
    ) => {
      requireAuth(context);
      return context.backend.security.requestEmailChange(args.input);
    },
    changePassword: (
      _: unknown,
      args: { input: { currentPassword: string; newPassword: string } },
      context: GraphQLContext,
    ) => {
      requireAuth(context);
      return context.backend.security.changePassword(args.input);
    },
    beginTwoFactorSetup: (
      _: unknown,
      __: unknown,
      context: GraphQLContext,
    ) => {
      requireAuth(context);
      return context.backend.security.beginTwoFactorSetup();
    },
    verifyTwoFactorSetup: (
      _: unknown,
      args: { code: string },
      context: GraphQLContext,
    ) => {
      requireAuth(context);
      return context.backend.security.verifyTwoFactorSetup(args.code);
    },
    disableTwoFactor: (
      _: unknown,
      args: { code: string },
      context: GraphQLContext,
    ) => {
      requireRole(context, ['student']);
      return context.backend.security.disableTwoFactor(args.code);
    },
    revokeSession: (
      _: unknown,
      args: { sessionId: string },
      context: GraphQLContext,
    ) => {
      requireAuth(context);
      return context.backend.security.revokeSession(args.sessionId);
    },
    revokeOtherSessions: (
      _: unknown,
      __: unknown,
      context: GraphQLContext,
    ) => {
      requireAuth(context);
      return context.backend.security.revokeOtherSessions();
    },
  },
};
