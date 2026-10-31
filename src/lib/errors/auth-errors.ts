import { COMMON_ERROR_CODES } from './api-errors';

export const FORGOT_PASSWORD_ERROR_CODES = [...COMMON_ERROR_CODES] as const;
export type ForgotPasswordErrorCode =
  (typeof FORGOT_PASSWORD_ERROR_CODES)[number];

export const RESET_PASSWORD_ERROR_CODES = [
  ...COMMON_ERROR_CODES,
  'invalidToken', // enlace inválido, expirado o ya usado
] as const;
export type ResetPasswordErrorCode =
  (typeof RESET_PASSWORD_ERROR_CODES)[number];

export const REGISTER_ERROR_CODES = [
  ...COMMON_ERROR_CODES,
  'emailTaken',
] as const;
export type RegisterErrorCode = (typeof REGISTER_ERROR_CODES)[number];
