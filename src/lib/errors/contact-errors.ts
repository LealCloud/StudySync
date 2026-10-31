import { COMMON_ERROR_CODES } from './api-errors';

// Códigos comunes + los propios de esta ruta.
export const CONTACT_ERROR_CODES = [
  ...COMMON_ERROR_CODES,
  'sendFailed',
] as const;

export type ContactErrorCode = (typeof CONTACT_ERROR_CODES)[number];
