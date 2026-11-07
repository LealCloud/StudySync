// AUTO-GENERADO por graphql-codegen. No editar a mano.
export const typeDefs = /* GraphQL */ `
schema {
  query: Query
  mutation: Mutation
}

type AccessibilityPreferences {
  highContrast: Boolean!
  reducedMotion: Boolean!
}

input AccessibilityPreferencesInput {
  highContrast: Boolean
  reducedMotion: Boolean
}

type Account {
  deactivationScheduledAt: DateTime
  status: AccountStatus!
}

enum AccountStatus {
  active
  inactive
  pending_deactivation
  suspended
}

type Bio {
  description: String
  title: String
}

type Certificate {
  certificateNumber: String!
  courseId: ID!
  courseTitle: String!
  downloadUrl: String!
  id: ID!
  issuedAt: DateTime!
}

input ChangePasswordInput {
  currentPassword: String!
  newPassword: String!
}

type CourseEnrollment {
  completedAt: DateTime
  courseId: ID!
  enrolledAt: DateTime!
  progress: Float!
  status: CourseEnrollmentStatus!
  title: String!
}

enum CourseEnrollmentStatus {
  active
  completed
  paused
}

scalar DateTime

enum DocumentType {
  dni
  passport
}

type Invoice {
  amount: Int!
  currency: String!
  downloadUrl: String
  id: ID!
  issuedAt: DateTime!
  number: String!
  status: InvoiceStatus!
}

enum InvoiceStatus {
  draft
  open
  paid
  uncollectible
  void
}

type Mutation {
  beginTwoFactorSetup: TwoFactorSetup!
  cancelAccountDeactivation: Account!
  cancelSubscription: UserSubscription!
  changePassword(input: ChangePasswordInput!): SecurityOperationResult!
  changeSubscriptionPlan(plan: SubscriptionPlan!): UserSubscription!
  disableTwoFactor(code: String!): SecurityOperationResult!
  removePaymentMethod(paymentMethodId: ID!): Boolean!
  requestAccountDeactivation: Account!
  requestEmailChange(input: RequestEmailChangeInput!): SecurityOperationResult!
  updatePersonalData(input: UpdatePersonalDataInput!): PersonalData!
  updatePreferences(input: UpdatePreferencesInput!): Preferences!
  updatePrivacySettings(input: UpdatePrivacySettingsInput!): PrivacySettings!
  updateProfile(input: UpdateProfileInput!): User!
  verifyTwoFactorSetup(code: String!): SecurityOperationResult!
}

type NotificationPreferences {
  email: Boolean!
  inApp: Boolean!
  push: Boolean!
}

input NotificationPreferencesInput {
  email: Boolean
  inApp: Boolean
  push: Boolean
}

type PaymentMethod {
  brand: String
  expirationMonth: Int
  expirationYear: Int
  id: ID!
  last4: String
}

type PersonalData {
  address: String
  country: String
  documentId: String
  documentType: DocumentType
  firstName: String!
  identityLocked: Boolean!
  lastName: String!
  phone: String
}

type Preferences {
  accessibility: AccessibilityPreferences!
  language: String!
  notifications: NotificationPreferences!
  theme: Theme!
  timezone: String!
}

type PrivacySettings {
  allowDirectMessages: Boolean!
  emailVisibility: ProfileVisibility!
  phoneVisibility: ProfileVisibility!
  profileVisibility: ProfileVisibility!
}

type Profile {
  bio: Bio
  interests: [String!]!
}

enum ProfileVisibility {
  authenticated
  everyone
  nobody
}

type PublicProfile {
  allowDirectMessages: Boolean!
  bio: Bio
  email: String
  id: ID!
  image: String
  interests: [String!]!
  name: String!
  phone: String
}

type Query {
  me: User!
  myAccount: Account!
  myCertificates: [Certificate!]!
  myCourses: [CourseEnrollment!]!
  myInvoices: [Invoice!]!
  myPaymentMethods: [PaymentMethod!]!
  myPersonalData: PersonalData!
  myPreferences: Preferences!
  myPrivacySettings: PrivacySettings!
  mySecuritySettings: SecuritySettings!
  mySubscription: UserSubscription
  publicProfile(userId: ID!): PublicProfile
}

input RequestEmailChangeInput {
  newEmail: String!
}

type SecurityOperationResult {
  message: String
  success: Boolean!
}

type SecuritySettings {
  email: String!
  emailVerified: Boolean!
  twoFactorEnabled: Boolean!
  twoFactorRequired: Boolean!
}

enum SubscriptionPlan {
  enterprise
  free
  premium
}

enum SubscriptionStatus {
  active
  canceled
  expired
  past_due
  trialing
}

enum Theme {
  dark
  light
  system
}

type TwoFactorSetup {
  qrCode: String!
  secret: String!
}

input UpdateBioInput {
  description: String
  title: String
}

input UpdatePersonalDataInput {
  address: String
  country: String
  documentId: String
  documentType: DocumentType
  firstName: String
  lastName: String
  phone: String
}

input UpdatePreferencesInput {
  accessibility: AccessibilityPreferencesInput
  language: String
  notifications: NotificationPreferencesInput
  theme: Theme
  timezone: String
}

input UpdatePrivacySettingsInput {
  allowDirectMessages: Boolean
  emailVisibility: ProfileVisibility
  phoneVisibility: ProfileVisibility
  profileVisibility: ProfileVisibility
}

input UpdateProfileInput {
  bio: UpdateBioInput
  image: String
  interests: [String!]
}

type User {
  email: String!
  id: ID!
  image: String
  name: String!
  profile: Profile!
  role: UserRole!
}

enum UserRole {
  admin
  student
  teacher
}

type UserSubscription {
  cancelAtPeriodEnd: Boolean!
  currentPeriodEnd: DateTime
  id: ID!
  plan: SubscriptionPlan!
  startedAt: DateTime!
  status: SubscriptionStatus!
}
`;