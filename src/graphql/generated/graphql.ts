/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type AccessibilityPreferencesInput = {
  highContrast?: boolean | null | undefined;
  reducedMotion?: boolean | null | undefined;
};

export type AccountStatus =
  | 'active'
  | 'inactive'
  | 'pending_deactivation'
  | 'suspended';

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export type CourseEnrollmentStatus =
  | 'active'
  | 'completed'
  | 'paused';

export type DocumentType =
  | 'dni'
  | 'passport';

export type InvoiceStatus =
  | 'draft'
  | 'open'
  | 'paid'
  | 'uncollectible'
  | 'void';

export type NotificationPreferencesInput = {
  email?: boolean | null | undefined;
  inApp?: boolean | null | undefined;
  push?: boolean | null | undefined;
};

export type ProfileVisibility =
  | 'authenticated'
  | 'everyone'
  | 'nobody';

export type RequestEmailChangeInput = {
  newEmail: string;
};

export type SubscriptionPlan =
  | 'enterprise'
  | 'free'
  | 'premium';

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'expired'
  | 'past_due'
  | 'trialing';

export type Theme =
  | 'dark'
  | 'light'
  | 'system';

export type UpdateBioInput = {
  description?: string | null | undefined;
  title?: string | null | undefined;
};

export type UpdatePersonalDataInput = {
  address?: string | null | undefined;
  country?: string | null | undefined;
  documentId?: string | null | undefined;
  documentType?: DocumentType | null | undefined;
  firstName?: string | null | undefined;
  lastName?: string | null | undefined;
  phone?: string | null | undefined;
};

export type UpdatePreferencesInput = {
  accessibility?: AccessibilityPreferencesInput | null | undefined;
  language?: string | null | undefined;
  notifications?: NotificationPreferencesInput | null | undefined;
  theme?: Theme | null | undefined;
  timezone?: string | null | undefined;
};

export type UpdatePrivacySettingsInput = {
  allowDirectMessages?: boolean | null | undefined;
  emailVisibility?: ProfileVisibility | null | undefined;
  phoneVisibility?: ProfileVisibility | null | undefined;
  profileVisibility?: ProfileVisibility | null | undefined;
};

export type UpdateProfileInput = {
  bio?: UpdateBioInput | null | undefined;
  image?: string | null | undefined;
  interests?: Array<string> | null | undefined;
};

export type UserRole =
  | 'admin'
  | 'student'
  | 'teacher';

export type CancelAccountDeactivationMutationVariables = Exact<{ [key: string]: never; }>;


export type CancelAccountDeactivationMutation = { cancelAccountDeactivation: { status: AccountStatus, deactivationScheduledAt: unknown } };

export type MyAccountQueryVariables = Exact<{ [key: string]: never; }>;


export type MyAccountQuery = { myAccount: { status: AccountStatus, deactivationScheduledAt: unknown } };

export type RequestAccountDeactivationMutationVariables = Exact<{ [key: string]: never; }>;


export type RequestAccountDeactivationMutation = { requestAccountDeactivation: { status: AccountStatus, deactivationScheduledAt: unknown } };

export type CancelSubscriptionMutationVariables = Exact<{ [key: string]: never; }>;


export type CancelSubscriptionMutation = { cancelSubscription: { id: string, plan: SubscriptionPlan, status: SubscriptionStatus, startedAt: unknown, currentPeriodEnd: unknown, cancelAtPeriodEnd: boolean } };

export type ChangeSubscriptionPlanMutationVariables = Exact<{
  plan: SubscriptionPlan;
}>;


export type ChangeSubscriptionPlanMutation = { changeSubscriptionPlan: { id: string, plan: SubscriptionPlan, status: SubscriptionStatus, startedAt: unknown, currentPeriodEnd: unknown, cancelAtPeriodEnd: boolean } };

export type MyInvoicesQueryVariables = Exact<{ [key: string]: never; }>;


export type MyInvoicesQuery = { myInvoices: Array<{ id: string, number: string, amount: number, currency: string, status: InvoiceStatus, issuedAt: unknown, downloadUrl: string | null }> };

export type MyPaymentMethodsQueryVariables = Exact<{ [key: string]: never; }>;


export type MyPaymentMethodsQuery = { myPaymentMethods: Array<{ id: string, brand: string | null, last4: string | null, expirationMonth: number | null, expirationYear: number | null }> };

export type MySubscriptionQueryVariables = Exact<{ [key: string]: never; }>;


export type MySubscriptionQuery = { mySubscription: { id: string, plan: SubscriptionPlan, status: SubscriptionStatus, startedAt: unknown, currentPeriodEnd: unknown, cancelAtPeriodEnd: boolean } | null };

export type RemovePaymentMethodMutationVariables = Exact<{
  paymentMethodId: string | number;
}>;


export type RemovePaymentMethodMutation = { removePaymentMethod: boolean };

export type MyCertificatesQueryVariables = Exact<{ [key: string]: never; }>;


export type MyCertificatesQuery = { myCertificates: Array<{ id: string, courseId: string, courseTitle: string, certificateNumber: string, issuedAt: unknown, downloadUrl: string }> };

export type MyCoursesQueryVariables = Exact<{ [key: string]: never; }>;


export type MyCoursesQuery = { myCourses: Array<{ courseId: string, title: string, progress: number, status: CourseEnrollmentStatus, enrolledAt: unknown, completedAt: unknown }> };

export type SidebarDataQueryVariables = Exact<{ [key: string]: never; }>;


export type SidebarDataQuery = { me: { id: string, name: string, email: string, image: string | null, role: UserRole }, mySubscription: { plan: SubscriptionPlan } | null, myAccount: { status: AccountStatus } };

export type MyPreferencesQueryVariables = Exact<{ [key: string]: never; }>;


export type MyPreferencesQuery = { myPreferences: { language: string, theme: Theme, timezone: string, notifications: { email: boolean, push: boolean, inApp: boolean }, accessibility: { reducedMotion: boolean, highContrast: boolean } } };

export type UpdatePreferencesMutationVariables = Exact<{
  input: UpdatePreferencesInput;
}>;


export type UpdatePreferencesMutation = { updatePreferences: { language: string, theme: Theme, timezone: string, notifications: { email: boolean, push: boolean, inApp: boolean }, accessibility: { reducedMotion: boolean, highContrast: boolean } } };

export type MyPrivacySettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type MyPrivacySettingsQuery = { myPrivacySettings: { profileVisibility: ProfileVisibility, emailVisibility: ProfileVisibility, phoneVisibility: ProfileVisibility, allowDirectMessages: boolean } };

export type UpdatePrivacySettingsMutationVariables = Exact<{
  input: UpdatePrivacySettingsInput;
}>;


export type UpdatePrivacySettingsMutation = { updatePrivacySettings: { profileVisibility: ProfileVisibility, emailVisibility: ProfileVisibility, phoneVisibility: ProfileVisibility, allowDirectMessages: boolean } };

export type MyProfileQueryVariables = Exact<{ [key: string]: never; }>;


export type MyProfileQuery = { me: { id: string, name: string, email: string, image: string | null, role: UserRole, profile: { interests: Array<string>, bio: { title: string | null, description: string | null } | null } } };

export type PublicProfileQueryVariables = Exact<{
  userId: string | number;
}>;


export type PublicProfileQuery = { publicProfile: { id: string, name: string, image: string | null, interests: Array<string>, email: string | null, phone: string | null, allowDirectMessages: boolean, bio: { title: string | null, description: string | null } | null } | null };

export type UpdateProfileMutationVariables = Exact<{
  input: UpdateProfileInput;
}>;


export type UpdateProfileMutation = { updateProfile: { id: string, name: string, email: string, image: string | null, role: UserRole, profile: { interests: Array<string>, bio: { title: string | null, description: string | null } | null } } };

export type BeginTwoFactorSetupMutationVariables = Exact<{ [key: string]: never; }>;


export type BeginTwoFactorSetupMutation = { beginTwoFactorSetup: { secret: string, qrCode: string } };

export type ChangePasswordMutationVariables = Exact<{
  input: ChangePasswordInput;
}>;


export type ChangePasswordMutation = { changePassword: { success: boolean, message: string | null } };

export type DisableTwoFactorMutationVariables = Exact<{
  code: string;
}>;


export type DisableTwoFactorMutation = { disableTwoFactor: { success: boolean, message: string | null } };

export type MySecuritySettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type MySecuritySettingsQuery = { mySecuritySettings: { email: string, emailVerified: boolean, twoFactorEnabled: boolean, twoFactorRequired: boolean, sessions: Array<{ id: string, deviceName: string | null, browser: string | null, ipAddress: string | null, lastActiveAt: unknown, current: boolean }> } };

export type RequestEmailChangeMutationVariables = Exact<{
  input: RequestEmailChangeInput;
}>;


export type RequestEmailChangeMutation = { requestEmailChange: { success: boolean, message: string | null } };

export type RevokeOtherSessionsMutationVariables = Exact<{ [key: string]: never; }>;


export type RevokeOtherSessionsMutation = { revokeOtherSessions: { success: boolean, message: string | null } };

export type RevokeSessionMutationVariables = Exact<{
  sessionId: string | number;
}>;


export type RevokeSessionMutation = { revokeSession: { success: boolean, message: string | null } };

export type VerifyTwoFactorSetupMutationVariables = Exact<{
  code: string;
}>;


export type VerifyTwoFactorSetupMutation = { verifyTwoFactorSetup: { success: boolean, message: string | null } };

export type MyPersonalDataQueryVariables = Exact<{ [key: string]: never; }>;


export type MyPersonalDataQuery = { myPersonalData: { firstName: string, lastName: string, documentType: DocumentType | null, documentId: string | null, phone: string | null, country: string | null, address: string | null, identityLocked: boolean } };

export type UpdatePersonalDataMutationVariables = Exact<{
  input: UpdatePersonalDataInput;
}>;


export type UpdatePersonalDataMutation = { updatePersonalData: { firstName: string, lastName: string, documentType: DocumentType | null, documentId: string | null, phone: string | null, country: string | null, address: string | null, identityLocked: boolean } };


export const CancelAccountDeactivationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CancelAccountDeactivation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cancelAccountDeactivation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"deactivationScheduledAt"}}]}}]}}]} as unknown as DocumentNode<CancelAccountDeactivationMutation, CancelAccountDeactivationMutationVariables>;
export const MyAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyAccount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myAccount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"deactivationScheduledAt"}}]}}]}}]} as unknown as DocumentNode<MyAccountQuery, MyAccountQueryVariables>;
export const RequestAccountDeactivationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestAccountDeactivation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestAccountDeactivation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"deactivationScheduledAt"}}]}}]}}]} as unknown as DocumentNode<RequestAccountDeactivationMutation, RequestAccountDeactivationMutationVariables>;
export const CancelSubscriptionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CancelSubscription"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cancelSubscription"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"plan"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"currentPeriodEnd"}},{"kind":"Field","name":{"kind":"Name","value":"cancelAtPeriodEnd"}}]}}]}}]} as unknown as DocumentNode<CancelSubscriptionMutation, CancelSubscriptionMutationVariables>;
export const ChangeSubscriptionPlanDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ChangeSubscriptionPlan"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"plan"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SubscriptionPlan"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"changeSubscriptionPlan"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"plan"},"value":{"kind":"Variable","name":{"kind":"Name","value":"plan"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"plan"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"currentPeriodEnd"}},{"kind":"Field","name":{"kind":"Name","value":"cancelAtPeriodEnd"}}]}}]}}]} as unknown as DocumentNode<ChangeSubscriptionPlanMutation, ChangeSubscriptionPlanMutationVariables>;
export const MyInvoicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyInvoices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myInvoices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"issuedAt"}},{"kind":"Field","name":{"kind":"Name","value":"downloadUrl"}}]}}]}}]} as unknown as DocumentNode<MyInvoicesQuery, MyInvoicesQueryVariables>;
export const MyPaymentMethodsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyPaymentMethods"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myPaymentMethods"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"brand"}},{"kind":"Field","name":{"kind":"Name","value":"last4"}},{"kind":"Field","name":{"kind":"Name","value":"expirationMonth"}},{"kind":"Field","name":{"kind":"Name","value":"expirationYear"}}]}}]}}]} as unknown as DocumentNode<MyPaymentMethodsQuery, MyPaymentMethodsQueryVariables>;
export const MySubscriptionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MySubscription"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mySubscription"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"plan"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"currentPeriodEnd"}},{"kind":"Field","name":{"kind":"Name","value":"cancelAtPeriodEnd"}}]}}]}}]} as unknown as DocumentNode<MySubscriptionQuery, MySubscriptionQueryVariables>;
export const RemovePaymentMethodDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemovePaymentMethod"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paymentMethodId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removePaymentMethod"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"paymentMethodId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paymentMethodId"}}}]}]}}]} as unknown as DocumentNode<RemovePaymentMethodMutation, RemovePaymentMethodMutationVariables>;
export const MyCertificatesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyCertificates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myCertificates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"courseId"}},{"kind":"Field","name":{"kind":"Name","value":"courseTitle"}},{"kind":"Field","name":{"kind":"Name","value":"certificateNumber"}},{"kind":"Field","name":{"kind":"Name","value":"issuedAt"}},{"kind":"Field","name":{"kind":"Name","value":"downloadUrl"}}]}}]}}]} as unknown as DocumentNode<MyCertificatesQuery, MyCertificatesQueryVariables>;
export const MyCoursesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyCourses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myCourses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"courseId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"progress"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"enrolledAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}}]}}]}}]} as unknown as DocumentNode<MyCoursesQuery, MyCoursesQueryVariables>;
export const SidebarDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SidebarData"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"Field","name":{"kind":"Name","value":"mySubscription"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"plan"}}]}},{"kind":"Field","name":{"kind":"Name","value":"myAccount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<SidebarDataQuery, SidebarDataQueryVariables>;
export const MyPreferencesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyPreferences"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myPreferences"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"notifications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"push"}},{"kind":"Field","name":{"kind":"Name","value":"inApp"}}]}},{"kind":"Field","name":{"kind":"Name","value":"accessibility"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reducedMotion"}},{"kind":"Field","name":{"kind":"Name","value":"highContrast"}}]}}]}}]}}]} as unknown as DocumentNode<MyPreferencesQuery, MyPreferencesQueryVariables>;
export const UpdatePreferencesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdatePreferences"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdatePreferencesInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updatePreferences"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"notifications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"push"}},{"kind":"Field","name":{"kind":"Name","value":"inApp"}}]}},{"kind":"Field","name":{"kind":"Name","value":"accessibility"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reducedMotion"}},{"kind":"Field","name":{"kind":"Name","value":"highContrast"}}]}}]}}]}}]} as unknown as DocumentNode<UpdatePreferencesMutation, UpdatePreferencesMutationVariables>;
export const MyPrivacySettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyPrivacySettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myPrivacySettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"profileVisibility"}},{"kind":"Field","name":{"kind":"Name","value":"emailVisibility"}},{"kind":"Field","name":{"kind":"Name","value":"phoneVisibility"}},{"kind":"Field","name":{"kind":"Name","value":"allowDirectMessages"}}]}}]}}]} as unknown as DocumentNode<MyPrivacySettingsQuery, MyPrivacySettingsQueryVariables>;
export const UpdatePrivacySettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdatePrivacySettings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdatePrivacySettingsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updatePrivacySettings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"profileVisibility"}},{"kind":"Field","name":{"kind":"Name","value":"emailVisibility"}},{"kind":"Field","name":{"kind":"Name","value":"phoneVisibility"}},{"kind":"Field","name":{"kind":"Name","value":"allowDirectMessages"}}]}}]}}]} as unknown as DocumentNode<UpdatePrivacySettingsMutation, UpdatePrivacySettingsMutationVariables>;
export const MyProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"profile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bio"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"interests"}}]}}]}}]}}]} as unknown as DocumentNode<MyProfileQuery, MyProfileQueryVariables>;
export const PublicProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PublicProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publicProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"bio"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"interests"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"allowDirectMessages"}}]}}]}}]} as unknown as DocumentNode<PublicProfileQuery, PublicProfileQueryVariables>;
export const UpdateProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateProfileInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"profile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bio"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"interests"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateProfileMutation, UpdateProfileMutationVariables>;
export const BeginTwoFactorSetupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BeginTwoFactorSetup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"beginTwoFactorSetup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"secret"}},{"kind":"Field","name":{"kind":"Name","value":"qrCode"}}]}}]}}]} as unknown as DocumentNode<BeginTwoFactorSetupMutation, BeginTwoFactorSetupMutationVariables>;
export const ChangePasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ChangePassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChangePasswordInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"changePassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<ChangePasswordMutation, ChangePasswordMutationVariables>;
export const DisableTwoFactorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DisableTwoFactor"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"code"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"disableTwoFactor"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"code"},"value":{"kind":"Variable","name":{"kind":"Name","value":"code"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<DisableTwoFactorMutation, DisableTwoFactorMutationVariables>;
export const MySecuritySettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MySecuritySettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mySecuritySettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}},{"kind":"Field","name":{"kind":"Name","value":"twoFactorEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"twoFactorRequired"}},{"kind":"Field","name":{"kind":"Name","value":"sessions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"deviceName"}},{"kind":"Field","name":{"kind":"Name","value":"browser"}},{"kind":"Field","name":{"kind":"Name","value":"ipAddress"}},{"kind":"Field","name":{"kind":"Name","value":"lastActiveAt"}},{"kind":"Field","name":{"kind":"Name","value":"current"}}]}}]}}]}}]} as unknown as DocumentNode<MySecuritySettingsQuery, MySecuritySettingsQueryVariables>;
export const RequestEmailChangeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestEmailChange"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RequestEmailChangeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestEmailChange"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<RequestEmailChangeMutation, RequestEmailChangeMutationVariables>;
export const RevokeOtherSessionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RevokeOtherSessions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"revokeOtherSessions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<RevokeOtherSessionsMutation, RevokeOtherSessionsMutationVariables>;
export const RevokeSessionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RevokeSession"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"revokeSession"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"sessionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sessionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<RevokeSessionMutation, RevokeSessionMutationVariables>;
export const VerifyTwoFactorSetupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"VerifyTwoFactorSetup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"code"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verifyTwoFactorSetup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"code"},"value":{"kind":"Variable","name":{"kind":"Name","value":"code"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<VerifyTwoFactorSetupMutation, VerifyTwoFactorSetupMutationVariables>;
export const MyPersonalDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyPersonalData"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myPersonalData"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"documentType"}},{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"identityLocked"}}]}}]}}]} as unknown as DocumentNode<MyPersonalDataQuery, MyPersonalDataQueryVariables>;
export const UpdatePersonalDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdatePersonalData"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdatePersonalDataInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updatePersonalData"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"documentType"}},{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"identityLocked"}}]}}]}}]} as unknown as DocumentNode<UpdatePersonalDataMutation, UpdatePersonalDataMutationVariables>;