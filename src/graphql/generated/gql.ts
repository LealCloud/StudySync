/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "mutation CancelAccountDeactivation {\n  cancelAccountDeactivation {\n    status\n    deactivationScheduledAt\n  }\n}": typeof types.CancelAccountDeactivationDocument,
    "query MyAccount {\n  myAccount {\n    status\n    deactivationScheduledAt\n  }\n}": typeof types.MyAccountDocument,
    "mutation RequestAccountDeactivation {\n  requestAccountDeactivation {\n    status\n    deactivationScheduledAt\n  }\n}": typeof types.RequestAccountDeactivationDocument,
    "mutation CancelSubscription {\n  cancelSubscription {\n    id\n    plan\n    status\n    startedAt\n    currentPeriodEnd\n    cancelAtPeriodEnd\n  }\n}": typeof types.CancelSubscriptionDocument,
    "mutation ChangeSubscriptionPlan($plan: SubscriptionPlan!) {\n  changeSubscriptionPlan(plan: $plan) {\n    id\n    plan\n    status\n    startedAt\n    currentPeriodEnd\n    cancelAtPeriodEnd\n  }\n}": typeof types.ChangeSubscriptionPlanDocument,
    "query MyInvoices {\n  myInvoices {\n    id\n    number\n    amount\n    currency\n    status\n    issuedAt\n    downloadUrl\n  }\n}": typeof types.MyInvoicesDocument,
    "query MyPaymentMethods {\n  myPaymentMethods {\n    id\n    brand\n    last4\n    expirationMonth\n    expirationYear\n  }\n}": typeof types.MyPaymentMethodsDocument,
    "query MySubscription {\n  mySubscription {\n    id\n    plan\n    status\n    startedAt\n    currentPeriodEnd\n    cancelAtPeriodEnd\n  }\n}": typeof types.MySubscriptionDocument,
    "mutation RemovePaymentMethod($paymentMethodId: ID!) {\n  removePaymentMethod(paymentMethodId: $paymentMethodId)\n}": typeof types.RemovePaymentMethodDocument,
    "query MyCertificates {\n  myCertificates {\n    id\n    courseId\n    courseTitle\n    certificateNumber\n    issuedAt\n    downloadUrl\n  }\n}": typeof types.MyCertificatesDocument,
    "query MyCourses {\n  myCourses {\n    courseId\n    title\n    progress\n    status\n    enrolledAt\n    completedAt\n  }\n}": typeof types.MyCoursesDocument,
    "query SidebarData {\n  me {\n    id\n    name\n    email\n    image\n    role\n  }\n  mySubscription {\n    plan\n  }\n  myAccount {\n    status\n  }\n}": typeof types.SidebarDataDocument,
    "query MyPreferences {\n  myPreferences {\n    language\n    theme\n    timezone\n    notifications {\n      email\n      push\n      inApp\n    }\n    accessibility {\n      reducedMotion\n      highContrast\n    }\n  }\n}": typeof types.MyPreferencesDocument,
    "mutation UpdatePreferences($input: UpdatePreferencesInput!) {\n  updatePreferences(input: $input) {\n    language\n    theme\n    timezone\n    notifications {\n      email\n      push\n      inApp\n    }\n    accessibility {\n      reducedMotion\n      highContrast\n    }\n  }\n}": typeof types.UpdatePreferencesDocument,
    "query MyPrivacySettings {\n  myPrivacySettings {\n    profileVisibility\n    emailVisibility\n    phoneVisibility\n    allowDirectMessages\n  }\n}": typeof types.MyPrivacySettingsDocument,
    "mutation UpdatePrivacySettings($input: UpdatePrivacySettingsInput!) {\n  updatePrivacySettings(input: $input) {\n    profileVisibility\n    emailVisibility\n    phoneVisibility\n    allowDirectMessages\n  }\n}": typeof types.UpdatePrivacySettingsDocument,
    "query MyProfile {\n  me {\n    id\n    name\n    email\n    image\n    role\n    profile {\n      bio {\n        title\n        description\n      }\n      interests\n    }\n  }\n}": typeof types.MyProfileDocument,
    "query PublicProfile($userId: ID!) {\n  publicProfile(userId: $userId) {\n    id\n    name\n    image\n    bio {\n      title\n      description\n    }\n    interests\n    email\n    phone\n    allowDirectMessages\n  }\n}": typeof types.PublicProfileDocument,
    "mutation UpdateProfile($input: UpdateProfileInput!) {\n  updateProfile(input: $input) {\n    id\n    name\n    email\n    image\n    role\n    profile {\n      bio {\n        title\n        description\n      }\n      interests\n    }\n  }\n}": typeof types.UpdateProfileDocument,
    "mutation BeginTwoFactorSetup {\n  beginTwoFactorSetup {\n    secret\n    qrCode\n  }\n}": typeof types.BeginTwoFactorSetupDocument,
    "mutation ChangePassword($input: ChangePasswordInput!) {\n  changePassword(input: $input) {\n    success\n    message\n  }\n}": typeof types.ChangePasswordDocument,
    "mutation DisableTwoFactor($code: String!) {\n  disableTwoFactor(code: $code) {\n    success\n    message\n  }\n}": typeof types.DisableTwoFactorDocument,
    "query MySecuritySettings {\n  mySecuritySettings {\n    email\n    emailVerified\n    twoFactorEnabled\n    twoFactorRequired\n    sessions {\n      id\n      deviceName\n      browser\n      ipAddress\n      lastActiveAt\n      current\n    }\n  }\n}": typeof types.MySecuritySettingsDocument,
    "mutation RequestEmailChange($input: RequestEmailChangeInput!) {\n  requestEmailChange(input: $input) {\n    success\n    message\n  }\n}": typeof types.RequestEmailChangeDocument,
    "mutation RevokeOtherSessions {\n  revokeOtherSessions {\n    success\n    message\n  }\n}": typeof types.RevokeOtherSessionsDocument,
    "mutation RevokeSession($sessionId: ID!) {\n  revokeSession(sessionId: $sessionId) {\n    success\n    message\n  }\n}": typeof types.RevokeSessionDocument,
    "mutation VerifyTwoFactorSetup($code: String!) {\n  verifyTwoFactorSetup(code: $code) {\n    success\n    message\n  }\n}": typeof types.VerifyTwoFactorSetupDocument,
    "query MyPersonalData {\n  myPersonalData {\n    firstName\n    lastName\n    documentType\n    documentId\n    phone\n    country\n    address\n    identityLocked\n  }\n}": typeof types.MyPersonalDataDocument,
    "mutation UpdatePersonalData($input: UpdatePersonalDataInput!) {\n  updatePersonalData(input: $input) {\n    firstName\n    lastName\n    documentType\n    documentId\n    phone\n    country\n    address\n    identityLocked\n  }\n}": typeof types.UpdatePersonalDataDocument,
};
const documents: Documents = {
    "mutation CancelAccountDeactivation {\n  cancelAccountDeactivation {\n    status\n    deactivationScheduledAt\n  }\n}": types.CancelAccountDeactivationDocument,
    "query MyAccount {\n  myAccount {\n    status\n    deactivationScheduledAt\n  }\n}": types.MyAccountDocument,
    "mutation RequestAccountDeactivation {\n  requestAccountDeactivation {\n    status\n    deactivationScheduledAt\n  }\n}": types.RequestAccountDeactivationDocument,
    "mutation CancelSubscription {\n  cancelSubscription {\n    id\n    plan\n    status\n    startedAt\n    currentPeriodEnd\n    cancelAtPeriodEnd\n  }\n}": types.CancelSubscriptionDocument,
    "mutation ChangeSubscriptionPlan($plan: SubscriptionPlan!) {\n  changeSubscriptionPlan(plan: $plan) {\n    id\n    plan\n    status\n    startedAt\n    currentPeriodEnd\n    cancelAtPeriodEnd\n  }\n}": types.ChangeSubscriptionPlanDocument,
    "query MyInvoices {\n  myInvoices {\n    id\n    number\n    amount\n    currency\n    status\n    issuedAt\n    downloadUrl\n  }\n}": types.MyInvoicesDocument,
    "query MyPaymentMethods {\n  myPaymentMethods {\n    id\n    brand\n    last4\n    expirationMonth\n    expirationYear\n  }\n}": types.MyPaymentMethodsDocument,
    "query MySubscription {\n  mySubscription {\n    id\n    plan\n    status\n    startedAt\n    currentPeriodEnd\n    cancelAtPeriodEnd\n  }\n}": types.MySubscriptionDocument,
    "mutation RemovePaymentMethod($paymentMethodId: ID!) {\n  removePaymentMethod(paymentMethodId: $paymentMethodId)\n}": types.RemovePaymentMethodDocument,
    "query MyCertificates {\n  myCertificates {\n    id\n    courseId\n    courseTitle\n    certificateNumber\n    issuedAt\n    downloadUrl\n  }\n}": types.MyCertificatesDocument,
    "query MyCourses {\n  myCourses {\n    courseId\n    title\n    progress\n    status\n    enrolledAt\n    completedAt\n  }\n}": types.MyCoursesDocument,
    "query SidebarData {\n  me {\n    id\n    name\n    email\n    image\n    role\n  }\n  mySubscription {\n    plan\n  }\n  myAccount {\n    status\n  }\n}": types.SidebarDataDocument,
    "query MyPreferences {\n  myPreferences {\n    language\n    theme\n    timezone\n    notifications {\n      email\n      push\n      inApp\n    }\n    accessibility {\n      reducedMotion\n      highContrast\n    }\n  }\n}": types.MyPreferencesDocument,
    "mutation UpdatePreferences($input: UpdatePreferencesInput!) {\n  updatePreferences(input: $input) {\n    language\n    theme\n    timezone\n    notifications {\n      email\n      push\n      inApp\n    }\n    accessibility {\n      reducedMotion\n      highContrast\n    }\n  }\n}": types.UpdatePreferencesDocument,
    "query MyPrivacySettings {\n  myPrivacySettings {\n    profileVisibility\n    emailVisibility\n    phoneVisibility\n    allowDirectMessages\n  }\n}": types.MyPrivacySettingsDocument,
    "mutation UpdatePrivacySettings($input: UpdatePrivacySettingsInput!) {\n  updatePrivacySettings(input: $input) {\n    profileVisibility\n    emailVisibility\n    phoneVisibility\n    allowDirectMessages\n  }\n}": types.UpdatePrivacySettingsDocument,
    "query MyProfile {\n  me {\n    id\n    name\n    email\n    image\n    role\n    profile {\n      bio {\n        title\n        description\n      }\n      interests\n    }\n  }\n}": types.MyProfileDocument,
    "query PublicProfile($userId: ID!) {\n  publicProfile(userId: $userId) {\n    id\n    name\n    image\n    bio {\n      title\n      description\n    }\n    interests\n    email\n    phone\n    allowDirectMessages\n  }\n}": types.PublicProfileDocument,
    "mutation UpdateProfile($input: UpdateProfileInput!) {\n  updateProfile(input: $input) {\n    id\n    name\n    email\n    image\n    role\n    profile {\n      bio {\n        title\n        description\n      }\n      interests\n    }\n  }\n}": types.UpdateProfileDocument,
    "mutation BeginTwoFactorSetup {\n  beginTwoFactorSetup {\n    secret\n    qrCode\n  }\n}": types.BeginTwoFactorSetupDocument,
    "mutation ChangePassword($input: ChangePasswordInput!) {\n  changePassword(input: $input) {\n    success\n    message\n  }\n}": types.ChangePasswordDocument,
    "mutation DisableTwoFactor($code: String!) {\n  disableTwoFactor(code: $code) {\n    success\n    message\n  }\n}": types.DisableTwoFactorDocument,
    "query MySecuritySettings {\n  mySecuritySettings {\n    email\n    emailVerified\n    twoFactorEnabled\n    twoFactorRequired\n    sessions {\n      id\n      deviceName\n      browser\n      ipAddress\n      lastActiveAt\n      current\n    }\n  }\n}": types.MySecuritySettingsDocument,
    "mutation RequestEmailChange($input: RequestEmailChangeInput!) {\n  requestEmailChange(input: $input) {\n    success\n    message\n  }\n}": types.RequestEmailChangeDocument,
    "mutation RevokeOtherSessions {\n  revokeOtherSessions {\n    success\n    message\n  }\n}": types.RevokeOtherSessionsDocument,
    "mutation RevokeSession($sessionId: ID!) {\n  revokeSession(sessionId: $sessionId) {\n    success\n    message\n  }\n}": types.RevokeSessionDocument,
    "mutation VerifyTwoFactorSetup($code: String!) {\n  verifyTwoFactorSetup(code: $code) {\n    success\n    message\n  }\n}": types.VerifyTwoFactorSetupDocument,
    "query MyPersonalData {\n  myPersonalData {\n    firstName\n    lastName\n    documentType\n    documentId\n    phone\n    country\n    address\n    identityLocked\n  }\n}": types.MyPersonalDataDocument,
    "mutation UpdatePersonalData($input: UpdatePersonalDataInput!) {\n  updatePersonalData(input: $input) {\n    firstName\n    lastName\n    documentType\n    documentId\n    phone\n    country\n    address\n    identityLocked\n  }\n}": types.UpdatePersonalDataDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation CancelAccountDeactivation {\n  cancelAccountDeactivation {\n    status\n    deactivationScheduledAt\n  }\n}"): (typeof documents)["mutation CancelAccountDeactivation {\n  cancelAccountDeactivation {\n    status\n    deactivationScheduledAt\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query MyAccount {\n  myAccount {\n    status\n    deactivationScheduledAt\n  }\n}"): (typeof documents)["query MyAccount {\n  myAccount {\n    status\n    deactivationScheduledAt\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation RequestAccountDeactivation {\n  requestAccountDeactivation {\n    status\n    deactivationScheduledAt\n  }\n}"): (typeof documents)["mutation RequestAccountDeactivation {\n  requestAccountDeactivation {\n    status\n    deactivationScheduledAt\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation CancelSubscription {\n  cancelSubscription {\n    id\n    plan\n    status\n    startedAt\n    currentPeriodEnd\n    cancelAtPeriodEnd\n  }\n}"): (typeof documents)["mutation CancelSubscription {\n  cancelSubscription {\n    id\n    plan\n    status\n    startedAt\n    currentPeriodEnd\n    cancelAtPeriodEnd\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation ChangeSubscriptionPlan($plan: SubscriptionPlan!) {\n  changeSubscriptionPlan(plan: $plan) {\n    id\n    plan\n    status\n    startedAt\n    currentPeriodEnd\n    cancelAtPeriodEnd\n  }\n}"): (typeof documents)["mutation ChangeSubscriptionPlan($plan: SubscriptionPlan!) {\n  changeSubscriptionPlan(plan: $plan) {\n    id\n    plan\n    status\n    startedAt\n    currentPeriodEnd\n    cancelAtPeriodEnd\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query MyInvoices {\n  myInvoices {\n    id\n    number\n    amount\n    currency\n    status\n    issuedAt\n    downloadUrl\n  }\n}"): (typeof documents)["query MyInvoices {\n  myInvoices {\n    id\n    number\n    amount\n    currency\n    status\n    issuedAt\n    downloadUrl\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query MyPaymentMethods {\n  myPaymentMethods {\n    id\n    brand\n    last4\n    expirationMonth\n    expirationYear\n  }\n}"): (typeof documents)["query MyPaymentMethods {\n  myPaymentMethods {\n    id\n    brand\n    last4\n    expirationMonth\n    expirationYear\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query MySubscription {\n  mySubscription {\n    id\n    plan\n    status\n    startedAt\n    currentPeriodEnd\n    cancelAtPeriodEnd\n  }\n}"): (typeof documents)["query MySubscription {\n  mySubscription {\n    id\n    plan\n    status\n    startedAt\n    currentPeriodEnd\n    cancelAtPeriodEnd\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation RemovePaymentMethod($paymentMethodId: ID!) {\n  removePaymentMethod(paymentMethodId: $paymentMethodId)\n}"): (typeof documents)["mutation RemovePaymentMethod($paymentMethodId: ID!) {\n  removePaymentMethod(paymentMethodId: $paymentMethodId)\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query MyCertificates {\n  myCertificates {\n    id\n    courseId\n    courseTitle\n    certificateNumber\n    issuedAt\n    downloadUrl\n  }\n}"): (typeof documents)["query MyCertificates {\n  myCertificates {\n    id\n    courseId\n    courseTitle\n    certificateNumber\n    issuedAt\n    downloadUrl\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query MyCourses {\n  myCourses {\n    courseId\n    title\n    progress\n    status\n    enrolledAt\n    completedAt\n  }\n}"): (typeof documents)["query MyCourses {\n  myCourses {\n    courseId\n    title\n    progress\n    status\n    enrolledAt\n    completedAt\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query SidebarData {\n  me {\n    id\n    name\n    email\n    image\n    role\n  }\n  mySubscription {\n    plan\n  }\n  myAccount {\n    status\n  }\n}"): (typeof documents)["query SidebarData {\n  me {\n    id\n    name\n    email\n    image\n    role\n  }\n  mySubscription {\n    plan\n  }\n  myAccount {\n    status\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query MyPreferences {\n  myPreferences {\n    language\n    theme\n    timezone\n    notifications {\n      email\n      push\n      inApp\n    }\n    accessibility {\n      reducedMotion\n      highContrast\n    }\n  }\n}"): (typeof documents)["query MyPreferences {\n  myPreferences {\n    language\n    theme\n    timezone\n    notifications {\n      email\n      push\n      inApp\n    }\n    accessibility {\n      reducedMotion\n      highContrast\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation UpdatePreferences($input: UpdatePreferencesInput!) {\n  updatePreferences(input: $input) {\n    language\n    theme\n    timezone\n    notifications {\n      email\n      push\n      inApp\n    }\n    accessibility {\n      reducedMotion\n      highContrast\n    }\n  }\n}"): (typeof documents)["mutation UpdatePreferences($input: UpdatePreferencesInput!) {\n  updatePreferences(input: $input) {\n    language\n    theme\n    timezone\n    notifications {\n      email\n      push\n      inApp\n    }\n    accessibility {\n      reducedMotion\n      highContrast\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query MyPrivacySettings {\n  myPrivacySettings {\n    profileVisibility\n    emailVisibility\n    phoneVisibility\n    allowDirectMessages\n  }\n}"): (typeof documents)["query MyPrivacySettings {\n  myPrivacySettings {\n    profileVisibility\n    emailVisibility\n    phoneVisibility\n    allowDirectMessages\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation UpdatePrivacySettings($input: UpdatePrivacySettingsInput!) {\n  updatePrivacySettings(input: $input) {\n    profileVisibility\n    emailVisibility\n    phoneVisibility\n    allowDirectMessages\n  }\n}"): (typeof documents)["mutation UpdatePrivacySettings($input: UpdatePrivacySettingsInput!) {\n  updatePrivacySettings(input: $input) {\n    profileVisibility\n    emailVisibility\n    phoneVisibility\n    allowDirectMessages\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query MyProfile {\n  me {\n    id\n    name\n    email\n    image\n    role\n    profile {\n      bio {\n        title\n        description\n      }\n      interests\n    }\n  }\n}"): (typeof documents)["query MyProfile {\n  me {\n    id\n    name\n    email\n    image\n    role\n    profile {\n      bio {\n        title\n        description\n      }\n      interests\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query PublicProfile($userId: ID!) {\n  publicProfile(userId: $userId) {\n    id\n    name\n    image\n    bio {\n      title\n      description\n    }\n    interests\n    email\n    phone\n    allowDirectMessages\n  }\n}"): (typeof documents)["query PublicProfile($userId: ID!) {\n  publicProfile(userId: $userId) {\n    id\n    name\n    image\n    bio {\n      title\n      description\n    }\n    interests\n    email\n    phone\n    allowDirectMessages\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation UpdateProfile($input: UpdateProfileInput!) {\n  updateProfile(input: $input) {\n    id\n    name\n    email\n    image\n    role\n    profile {\n      bio {\n        title\n        description\n      }\n      interests\n    }\n  }\n}"): (typeof documents)["mutation UpdateProfile($input: UpdateProfileInput!) {\n  updateProfile(input: $input) {\n    id\n    name\n    email\n    image\n    role\n    profile {\n      bio {\n        title\n        description\n      }\n      interests\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation BeginTwoFactorSetup {\n  beginTwoFactorSetup {\n    secret\n    qrCode\n  }\n}"): (typeof documents)["mutation BeginTwoFactorSetup {\n  beginTwoFactorSetup {\n    secret\n    qrCode\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation ChangePassword($input: ChangePasswordInput!) {\n  changePassword(input: $input) {\n    success\n    message\n  }\n}"): (typeof documents)["mutation ChangePassword($input: ChangePasswordInput!) {\n  changePassword(input: $input) {\n    success\n    message\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation DisableTwoFactor($code: String!) {\n  disableTwoFactor(code: $code) {\n    success\n    message\n  }\n}"): (typeof documents)["mutation DisableTwoFactor($code: String!) {\n  disableTwoFactor(code: $code) {\n    success\n    message\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query MySecuritySettings {\n  mySecuritySettings {\n    email\n    emailVerified\n    twoFactorEnabled\n    twoFactorRequired\n    sessions {\n      id\n      deviceName\n      browser\n      ipAddress\n      lastActiveAt\n      current\n    }\n  }\n}"): (typeof documents)["query MySecuritySettings {\n  mySecuritySettings {\n    email\n    emailVerified\n    twoFactorEnabled\n    twoFactorRequired\n    sessions {\n      id\n      deviceName\n      browser\n      ipAddress\n      lastActiveAt\n      current\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation RequestEmailChange($input: RequestEmailChangeInput!) {\n  requestEmailChange(input: $input) {\n    success\n    message\n  }\n}"): (typeof documents)["mutation RequestEmailChange($input: RequestEmailChangeInput!) {\n  requestEmailChange(input: $input) {\n    success\n    message\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation RevokeOtherSessions {\n  revokeOtherSessions {\n    success\n    message\n  }\n}"): (typeof documents)["mutation RevokeOtherSessions {\n  revokeOtherSessions {\n    success\n    message\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation RevokeSession($sessionId: ID!) {\n  revokeSession(sessionId: $sessionId) {\n    success\n    message\n  }\n}"): (typeof documents)["mutation RevokeSession($sessionId: ID!) {\n  revokeSession(sessionId: $sessionId) {\n    success\n    message\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation VerifyTwoFactorSetup($code: String!) {\n  verifyTwoFactorSetup(code: $code) {\n    success\n    message\n  }\n}"): (typeof documents)["mutation VerifyTwoFactorSetup($code: String!) {\n  verifyTwoFactorSetup(code: $code) {\n    success\n    message\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query MyPersonalData {\n  myPersonalData {\n    firstName\n    lastName\n    documentType\n    documentId\n    phone\n    country\n    address\n    identityLocked\n  }\n}"): (typeof documents)["query MyPersonalData {\n  myPersonalData {\n    firstName\n    lastName\n    documentType\n    documentId\n    phone\n    country\n    address\n    identityLocked\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation UpdatePersonalData($input: UpdatePersonalDataInput!) {\n  updatePersonalData(input: $input) {\n    firstName\n    lastName\n    documentType\n    documentId\n    phone\n    country\n    address\n    identityLocked\n  }\n}"): (typeof documents)["mutation UpdatePersonalData($input: UpdatePersonalDataInput!) {\n  updatePersonalData(input: $input) {\n    firstName\n    lastName\n    documentType\n    documentId\n    phone\n    country\n    address\n    identityLocked\n  }\n}"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;