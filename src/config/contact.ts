// Configuración del formulario de contacto.
//
// Fuente única de verdad del remitente y destinatario del correo de contacto.
// Este archivo NO hardcodea valores por defecto: los defaults viven SOLO en
// `.env.example`. Si una variable falta, el consumidor decide cómo manejarlo:
//   - El dominio (`src/lib/domain/contact.ts`) lanza
//     `BackendOperationError(500, 'INTERNAL_ERROR')` porque sin remitente ni
//     destinatario no se puede enviar.
//   - La UI (`contact/page.tsx`) oculta el canal de email, pero deja el
//     formulario y los demás canales funcionando.
//
// `RESEND_API_KEY` NO se expone aquí: es un secreto y solo lo lee el dominio
// en el momento del envío. Este archivo es importable desde Server Components
// y desde el dominio; nunca desde Client Components.

/**
 * Remitente del correo de contacto. Debe coincidir con un dominio o
 * dirección verificada en Resend. En proyecto académico se usa el
 * remitente sandbox de Resend (`onboarding@resend.dev`).
 *
 * @returns El email configurado, o `undefined` si no existe o está vacío.
 */
export function getContactFromEmail(): string | undefined {
  const value = process.env.CONTACT_FROM_EMAIL?.trim();
  return value === '' ? undefined : value;
}

/**
 * Destinatario del correo de contacto. También es el email que se muestra
 * en la UI del formulario, para que ambos coincidan siempre.
 *
 * @returns El email configurado, o `undefined` si no existe o está vacío.
 */
export function getContactToEmail(): string | undefined {
  const value = process.env.CONTACT_TO_EMAIL?.trim();
  return value === '' ? undefined : value;
}
