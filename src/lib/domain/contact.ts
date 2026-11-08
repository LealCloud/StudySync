import { createHash } from 'node:crypto';
import { Resend } from 'resend';
import { getContactFromEmail, getContactToEmail } from '@/config/contact';
import { BackendOperationError } from '@/lib/backend/errors';
import type { BackendContactInput } from '@/lib/backend/types';

/* ============================================================
   Envío de correo del formulario de contacto — Resend
   ============================================================

   Contrato: docs/backend-api/_rutas/contact.md (v2.0).

   Decisiones cerradas (ver plan del trabajo):
   - Resend vive en el dominio, no en el route handler.
   - HTML inline + texto plano, sin `react-email`.
   - `from` y `to` salen de `src/config/contact.ts`, que lee de `.env`
     sin defaults hardcodeados. Los valores viven SOLO en `.env.example`.
   - `replyTo` es el email del usuario.
   - Falta de `RESEND_API_KEY`, `CONTACT_FROM_EMAIL` o `CONTACT_TO_EMAIL`,
     y errores de Resend, se mapean a `500 INTERNAL_ERROR`; el route
     handler lo traduce a `sendFailed`.
   - Idempotencia por hash de `email|subject|message`: un reintento tras
     timeout no duplica el correo.
   - Todos los campos se escapan en HTML. `name` y `email` no están
     restringidos por `contactSchema` (solo `subject` y `message` prohíben
     `<`/`>`), así que el escape es obligatorio.
   ============================================================ */

interface ContactEmailPayload {
  name: string;
  email: string;
  contactNumber?: string;
  subject: string;
  message: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildIdempotencyKey(input: ContactEmailPayload): string {
  const seed = `${input.email}|${input.subject}|${input.message}`;
  const hash = createHash('sha256').update(seed).digest('hex');
  return `contact/${hash}`;
}

function buildHtml(input: ContactEmailPayload): string {
  const phone = input.contactNumber
    ? `<tr><td style="padding:4px 0;color:#6b7280;">Teléfono</td><td style="padding:4px 0;">${escapeHtml(input.contactNumber)}</td></tr>`
    : '';

  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:24px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <tr>
        <td style="padding:20px 24px;background:#4f46e5;color:#ffffff;font-size:18px;font-weight:600;">
          Nuevo mensaje de contacto — StudySync
        </td>
      </tr>
      <tr>
        <td style="padding:20px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
            <tr><td style="padding:4px 0;color:#6b7280;">Nombre</td><td style="padding:4px 0;">${escapeHtml(input.name)}</td></tr>
            <tr><td style="padding:4px 0;color:#6b7280;">Email</td><td style="padding:4px 0;">${escapeHtml(input.email)}</td></tr>
            ${phone}
            <tr><td style="padding:4px 0;color:#6b7280;">Asunto</td><td style="padding:4px 0;">${escapeHtml(input.subject)}</td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
          <p style="margin:0;white-space:pre-wrap;font-size:14px;line-height:1.6;">${escapeHtml(input.message)}</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildText(input: ContactEmailPayload): string {
  const lines = [
    'Nuevo mensaje de contacto — StudySync',
    '',
    `Nombre: ${input.name}`,
    `Email: ${input.email}`,
  ];
  if (input.contactNumber) lines.push(`Teléfono: ${input.contactNumber}`);
  lines.push(`Asunto: ${input.subject}`, '', 'Mensaje:', input.message);
  return lines.join('\n');
}

export async function submitContact(input: BackendContactInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = getContactFromEmail();
  const toEmail = getContactToEmail();

  const missing: string[] = [];
  if (!apiKey) missing.push('RESEND_API_KEY');
  if (!fromEmail) missing.push('CONTACT_FROM_EMAIL');
  if (!toEmail) missing.push('CONTACT_TO_EMAIL');

  if (missing.length > 0) {
    console.error(
      JSON.stringify({
        level: 'error',
        service: 'contact',
        timestamp: new Date().toISOString(),
        message:
          'Configuración incompleta del correo de contacto; no se envió.',
        missing,
      }),
    );
    throw new BackendOperationError(500, 'INTERNAL_ERROR');
  }

  // `missing.length === 0` garantiza que las tres variables están
  // definidas y no vacías. El `as` documenta la intención al lector;
  // el chequeo de runtime ya se hizo arriba.
  const resend = new Resend(apiKey!);

  const { error } = await resend.emails.send(
    {
      from: fromEmail!,
      to: [toEmail!],
      replyTo: input.email,
      subject: `[Contacto StudySync] ${input.subject}`,
      html: buildHtml(input),
      text: buildText(input),
    },
    { idempotencyKey: buildIdempotencyKey(input) },
  );

  if (error) {
    console.error(
      JSON.stringify({
        level: 'error',
        service: 'contact',
        timestamp: new Date().toISOString(),
        message: 'Resend rechazó el envío del correo de contacto.',
        errorName: error.name,
        errorMessage: error.message,
      }),
    );
    throw new BackendOperationError(500, 'INTERNAL_ERROR');
  }
}
