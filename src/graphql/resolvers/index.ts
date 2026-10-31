import { accountResolvers } from './account';
import { billingResolvers } from './billing';
import { certificatesResolvers } from './certificates';
import { coursesResolvers } from './courses';
import { personalDataResolvers } from './personal-data';
import { preferencesResolvers } from './preferences';
import { privacyResolvers } from './privacy';
import { profileResolvers } from './profile';
import { securityResolvers } from './security';
import { userResolvers } from './user';

export const resolvers = {
  Query: {
    ...userResolvers.Query,
    ...personalDataResolvers.Query,
    ...privacyResolvers.Query,
    ...securityResolvers.Query,
    ...preferencesResolvers.Query,
    ...accountResolvers.Query,
    ...coursesResolvers.Query,
    ...certificatesResolvers.Query,
    ...billingResolvers.Query,
    ...profileResolvers.Query,
  },
  Mutation: {
    ...personalDataResolvers.Mutation,
    ...privacyResolvers.Mutation,
    ...securityResolvers.Mutation,
    ...preferencesResolvers.Mutation,
    ...accountResolvers.Mutation,
    ...billingResolvers.Mutation,
    ...profileResolvers.Mutation,
  },
};
