import type { BackendClient } from '../client';
import { BackendOperationError } from '../errors';
import { getUser, getPublicProfile, updateProfile } from '@/lib/domain/users';
import {
  getPersonalData,
  updatePersonalData,
} from '@/lib/domain/personal-data';
import {
  getPrivacySettings,
  updatePrivacySettings,
} from '@/lib/domain/privacy';
import { getPreferences, updatePreferences } from '@/lib/domain/preferences';
import {
  getSecuritySettings,
  changePassword,
  beginTwoFactorSetup,
  verifyTwoFactorSetup,
  disableTwoFactor,
} from '@/lib/domain/security';
import {
  getAccount,
  requestAccountDeactivation,
  cancelAccountDeactivation,
} from '@/lib/domain/account';
import { getCourseEnrollments } from '@/lib/domain/courses';
import { getCertificates } from '@/lib/domain/certificates';
import {
  getSubscription,
  getPaymentMethods,
  getInvoices,
  removePaymentMethod,
} from '@/lib/domain/billing';
import { changePlan, cancelSubscription } from '@/lib/domain/subscription';
import {
  getConversations,
  startConversation,
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
} from '@/lib/domain/messaging';

/** Implementa el contrato de cliente BFF utilizando la capa de dominio local. */
export class LocalBackendClient implements BackendClient {
  constructor(private readonly userId: string | null) {}

  private requireUserId(): string {
    if (this.userId === null) {
      throw new BackendOperationError(401, 'UNAUTHENTICATED');
    }
    return this.userId;
  }

  messaging: BackendClient['messaging'] = {
    getConversations: () => getConversations(this.requireUserId()),
    startConversation: (participantId) =>
      startConversation(this.requireUserId(), participantId),
    getMessages: (conversationId, before, limit) =>
      getMessages(this.requireUserId(), conversationId, before, limit),
    sendMessage: (conversationId, content) =>
      sendMessage(this.requireUserId(), conversationId, content),
    markAsRead: (conversationId) =>
      markAsRead(this.requireUserId(), conversationId),
    getUnreadCount: () => getUnreadCount(this.requireUserId()),
  };

  users: BackendClient['users'] = {
    getMe: () => getUser(this.requireUserId()),
    getPublicProfile: (targetUserId) =>
      getPublicProfile(targetUserId, this.userId),
    updateProfile: (input) => updateProfile(this.requireUserId(), input),
  };

  personalData: BackendClient['personalData'] = {
    getMe: () => getPersonalData(this.requireUserId()),
    update: (input) => updatePersonalData(this.requireUserId(), input),
  };

  privacy: BackendClient['privacy'] = {
    getMe: () => getPrivacySettings(this.requireUserId()),
    update: (input) => updatePrivacySettings(this.requireUserId(), input),
  };

  security: BackendClient['security'] = {
    getMe: () => getSecuritySettings(this.requireUserId()),
    requestEmailChange: (_input) => {
      // TODO(phase-e): implement after email delivery is integrated.
      throw new BackendOperationError(501, 'NOT_IMPLEMENTED');
    },
    changePassword: (input) => changePassword(this.requireUserId(), input),
    beginTwoFactorSetup: () => beginTwoFactorSetup(this.requireUserId()),
    verifyTwoFactorSetup: (code) =>
      verifyTwoFactorSetup(this.requireUserId(), code),
    disableTwoFactor: (code) => disableTwoFactor(this.requireUserId(), code),
  };

  preferences: BackendClient['preferences'] = {
    getMe: () => getPreferences(this.requireUserId()),
    update: (input) => updatePreferences(this.requireUserId(), input),
  };

  account: BackendClient['account'] = {
    getMe: () => getAccount(this.requireUserId()),
    requestDeactivation: () => requestAccountDeactivation(this.requireUserId()),
    cancelDeactivation: () => cancelAccountDeactivation(this.requireUserId()),
  };

  courses: BackendClient['courses'] = {
    getMe: () => getCourseEnrollments(this.requireUserId()),
  };

  certificates: BackendClient['certificates'] = {
    getMe: () => getCertificates(this.requireUserId()),
  };

  subscription: BackendClient['subscription'] = {
    getMe: () => getSubscription(this.requireUserId()),
    changePlan: (plan) => changePlan(this.requireUserId(), plan),
    cancel: () => cancelSubscription(this.requireUserId()),
  };

  billing: BackendClient['billing'] = {
    getPaymentMethods: () => getPaymentMethods(this.requireUserId()),
    getInvoices: () => getInvoices(this.requireUserId()),
    removePaymentMethod: (paymentMethodId) =>
      removePaymentMethod(this.requireUserId(), paymentMethodId),
  };
}
