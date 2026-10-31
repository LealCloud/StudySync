import type { RestBackendResponse } from './http';
import type {
  BackendAccount,
  BackendCertificate,
  BackendChangePasswordInput,
  BackendContactInput,
  BackendCourseEnrollment,
  BackendForgotPasswordInput,
  BackendInvoice,
  BackendLoginInput,
  BackendLoginResponse,
  BackendPaymentMethod,
  BackendPersonalData,
  BackendPreferences,
  BackendPrivacySettings,
  BackendPublicProfile,
  BackendRegisterInput,
  BackendRequestEmailChangeInput,
  BackendResetPasswordInput,
  BackendResetTokenValidationResponse,
  BackendSecurityOperationResult,
  BackendSecuritySettings,
  BackendSubscription,
  BackendSubscriptionPlan,
  BackendTokenPairResponse,
  BackendTwoFactorSetup,
  BackendUpdatePersonalDataInput,
  BackendUpdatePreferencesInput,
  BackendUpdatePrivacySettingsInput,
  BackendUpdateProfileInput,
  BackendUser,
  BackendValidateResetTokenInput,
} from './types';

export interface BackendClient {
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
    revokeSession(sessionId: string): Promise<BackendSecurityOperationResult>;
    revokeOtherSessions(): Promise<BackendSecurityOperationResult>;
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

export interface PublicBackendClient {
  auth: {
    login(
      input: BackendLoginInput,
    ): Promise<RestBackendResponse<BackendLoginResponse>>;
    refresh(
      refreshToken: string,
    ): Promise<RestBackendResponse<BackendTokenPairResponse>>;
    logout(refreshToken: string): Promise<RestBackendResponse>;
    register(input: BackendRegisterInput): Promise<RestBackendResponse>;
    forgotPassword(
      input: BackendForgotPasswordInput,
    ): Promise<RestBackendResponse>;
    validateResetToken(
      input: BackendValidateResetTokenInput,
    ): Promise<RestBackendResponse<BackendResetTokenValidationResponse>>;
    resetPassword(
      input: BackendResetPasswordInput,
    ): Promise<RestBackendResponse>;
  };
  contact: {
    submit(input: BackendContactInput): Promise<RestBackendResponse>;
  };
}
