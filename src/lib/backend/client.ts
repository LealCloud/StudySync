import type {
  BackendAccount,
  BackendConversation,
  BackendMessage,
  BackendCertificate,
  BackendChangePasswordInput,
  BackendCourseEnrollment,
  BackendInvoice,
  BackendPaymentMethod,
  BackendPersonalData,
  BackendPreferences,
  BackendPrivacySettings,
  BackendPublicProfile,
  BackendRequestEmailChangeInput,
  BackendSecurityOperationResult,
  BackendSecuritySettings,
  BackendSubscription,
  BackendSubscriptionPlan,
  BackendTwoFactorSetup,
  BackendUpdatePersonalDataInput,
  BackendUpdatePreferencesInput,
  BackendUpdatePrivacySettingsInput,
  BackendUpdateProfileInput,
  BackendUser,
} from './types';

export interface RestBackendResponse<T = unknown> {
  status: number;
  ok: boolean;
  body: T | null;
}

export interface BackendClient {
  messaging: {
    getConversations(): Promise<BackendConversation[]>;
    startConversation(participantId: string): Promise<BackendConversation>;
    getMessages(
      conversationId: string,
      before?: string,
      limit?: number,
    ): Promise<BackendMessage[]>;
    sendMessage(
      conversationId: string,
      content: string,
    ): Promise<BackendMessage>;
    markAsRead(conversationId: string): Promise<BackendConversation>;
    getUnreadCount(): Promise<number>;
  };
  users: {
    getMe(): Promise<BackendUser>;
    getPublicProfile(userId: string): Promise<BackendPublicProfile | null>;
    updateProfile(input: BackendUpdateProfileInput): Promise<BackendUser>;
  };
  personalData: {
    getMe(): Promise<BackendPersonalData>;
    update(input: BackendUpdatePersonalDataInput): Promise<BackendPersonalData>;
  };
  privacy: {
    getMe(): Promise<BackendPrivacySettings>;
    update(
      input: BackendUpdatePrivacySettingsInput,
    ): Promise<BackendPrivacySettings>;
  };
  security: {
    getMe(): Promise<BackendSecuritySettings>;
    requestEmailChange(
      input: BackendRequestEmailChangeInput,
    ): Promise<BackendSecurityOperationResult>;
    changePassword(
      input: BackendChangePasswordInput,
    ): Promise<BackendSecurityOperationResult>;
    beginTwoFactorSetup(): Promise<BackendTwoFactorSetup>;
    verifyTwoFactorSetup(code: string): Promise<BackendSecurityOperationResult>;
    disableTwoFactor(code: string): Promise<BackendSecurityOperationResult>;
  };
  preferences: {
    getMe(): Promise<BackendPreferences>;
    update(input: BackendUpdatePreferencesInput): Promise<BackendPreferences>;
  };
  account: {
    getMe(): Promise<BackendAccount>;
    requestDeactivation(): Promise<BackendAccount>;
    cancelDeactivation(): Promise<BackendAccount>;
  };
  courses: { getMe(): Promise<BackendCourseEnrollment[]> };
  certificates: { getMe(): Promise<BackendCertificate[]> };
  subscription: {
    getMe(): Promise<BackendSubscription | null>;
    changePlan(plan: BackendSubscriptionPlan): Promise<BackendSubscription>;
    cancel(): Promise<BackendSubscription>;
  };
  billing: {
    getPaymentMethods(): Promise<BackendPaymentMethod[]>;
    getInvoices(): Promise<BackendInvoice[]>;
    removePaymentMethod(paymentMethodId: string): Promise<boolean>;
  };
}
