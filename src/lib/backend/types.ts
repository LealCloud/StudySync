import type { UserRole } from '@/types/user';

export interface BackendUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: UserRole;
  profile: BackendProfile;
}

export interface BackendBio {
  title: string | null;
  description: string | null;
}

export interface BackendProfile {
  bio: BackendBio | null;
  interests: string[];
}

export type BackendDocumentType = 'passport' | 'dni';

export interface BackendPersonalData {
  firstName: string;
  lastName: string;
  documentType: BackendDocumentType | null;
  documentId: string | null;
  phone: string | null;
  country: string | null;
  address: string | null;
  identityLocked: boolean;
}

export type ProfileVisibility = 'everyone' | 'authenticated' | 'nobody';
export interface BackendPrivacySettings {
  profileVisibility: ProfileVisibility;
  emailVisibility: ProfileVisibility;
  phoneVisibility: ProfileVisibility;
  allowDirectMessages: boolean;
}
export type BackendUpdatePrivacySettingsInput = Partial<BackendPrivacySettings>;
export type BackendUpdatePersonalDataInput = Partial<
  Omit<BackendPersonalData, 'identityLocked'>
>;

export interface BackendSecuritySession {
  id: string;
  deviceName: string | null;
  browser: string | null;
  ipAddress: string | null;
  lastActiveAt: string;
  current: boolean;
}
export interface BackendSecuritySettings {
  email: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  twoFactorRequired: boolean;
  sessions: BackendSecuritySession[];
}
export interface BackendSecurityOperationResult {
  success: boolean;
  message: string | null;
}
export interface BackendTwoFactorSetup {
  secret: string;
  qrCode: string;
}
export interface BackendChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}
export interface BackendRequestEmailChangeInput {
  newEmail: string;
}

export type BackendTheme = 'system' | 'light' | 'dark';
export interface BackendPreferences {
  language: string;
  theme: BackendTheme;
  timezone: string;
  notifications: { email: boolean; push: boolean; inApp: boolean };
  accessibility: { reducedMotion: boolean; highContrast: boolean };
}
export interface BackendUpdatePreferencesInput {
  language?: string;
  theme?: BackendTheme;
  timezone?: string;
  notifications?: Partial<BackendPreferences['notifications']>;
  accessibility?: Partial<BackendPreferences['accessibility']>;
}

export type BackendAccountStatus =
  'active' | 'pending_deactivation' | 'suspended' | 'inactive';
export interface BackendAccount {
  status: BackendAccountStatus;
  deactivationScheduledAt: string | null;
}
export type BackendCourseStatus = 'active' | 'completed' | 'paused';
export interface BackendCourseEnrollment {
  courseId: string;
  title: string;
  progress: number;
  status: BackendCourseStatus;
  enrolledAt: string;
  completedAt: string | null;
}
export interface BackendCertificate {
  id: string;
  courseId: string;
  courseTitle: string;
  certificateNumber: string;
  issuedAt: string;
  downloadUrl: string;
}

export type BackendSubscriptionPlan = 'free' | 'premium' | 'enterprise';
export type BackendSubscriptionStatus =
  'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';
export interface BackendSubscription {
  id: string;
  plan: BackendSubscriptionPlan;
  status: BackendSubscriptionStatus;
  startedAt: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}
export interface BackendPaymentMethod {
  id: string;
  brand: string | null;
  last4: string | null;
  expirationMonth: number | null;
  expirationYear: number | null;
}
export type BackendInvoiceStatus =
  'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
export interface BackendInvoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: BackendInvoiceStatus;
  issuedAt: string;
  downloadUrl: string | null;
}
export interface BackendPublicProfile {
  id: string;
  name: string;
  image: string | null;
  bio: BackendBio | null;
  interests: string[];
  email: string | null;
  phone: string | null;
  allowDirectMessages: boolean;
}
export interface BackendUpdateBioInput {
  title?: string | null;
  description?: string | null;
}

export interface BackendUpdateProfileInput {
  bio?: BackendUpdateBioInput | null;
  interests?: string[] | null;
  image?: string | null;
}

export interface BackendLoginInput {
  email: string;
  password: string;
}

export interface BackendRegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface BackendForgotPasswordInput {
  email: string;
}

export interface BackendValidateResetTokenInput {
  token: string;
}

export interface BackendResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface BackendContactInput {
  name: string;
  email: string;
  contactNumber?: string;
  subject: string;
  message: string;
}

export interface BackendTokenPair {
  token: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export interface BackendLoginData extends BackendTokenPair {
  firstName: string;
  lastName: string;
  id: string;
  role: 'student' | 'teacher' | 'admin';
  subscription?: 'free' | 'premium' | 'enterprise' | null;
  image: string | null;
}

export interface BackendDataResponse<T> {
  status: number;
  message: string;
  data: T;
}

export type BackendLoginResponse = BackendDataResponse<BackendLoginData>;
export type BackendTokenPairResponse = BackendDataResponse<BackendTokenPair>;

export interface BackendResetTokenValidationResponse {
  valid: true;
}

export interface BackendContractError {
  code: string;
  message: string;
  details: unknown;
}

export interface BackendContractErrorBody {
  error: BackendContractError;
}
