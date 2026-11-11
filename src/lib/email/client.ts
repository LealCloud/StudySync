// Cliente de correo genérico basado en Resend.
//
// Centraliza la inicialización de Resend y el manejo de errores
// de bajo nivel. Los dominios (contact, auth, etc.) construyen el
// contenido del correo y delegan el envío a esta función.
//
// Contrato:
// - Lanza `BackendOperationError(500, 'INTERNAL_ERROR')` si falta
//   `RESEND_API_KEY` o si Resend devuelve error. El route handler
//   que invoque al dominio traducirá este error al código público
//   correspondiente (p. ej. `sendFailed`).
// - La `idempotencyKey` es opcional; si no se pasa, Resend usa una
//   basada en el contenido del correo. Para flujos transaccionales
//   como reset de contraseña, es recomendable pasarla para evitar
//   duplicados en reintentos.
//
// Deuda técnica conocida:
// - `src/lib/domain/contact.ts` todavía inicializa Resend por su cuenta.
//   Debe refactorizarse para usar `sendEmail` en una fase de limpieza.
//   `TODO(refactor-contact-email)`.

import 'server-only';

import { BackendOperationError } from '@/lib/backend/errors';
import { Resend } from 'resend';

interface SendEmailInput {
  to: string | string[];
  from: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  idempotencyKey?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    console.error(
      JSON.stringify({
        level: 'error',
        service: 'email-client',
        timestamp: new Date().toISOString(),
        message: 'RESEND_API_KEY no está configurada; no se envió el correo.',
      }),
    );
    throw new BackendOperationError(500, 'INTERNAL_ERROR');
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send(
    {
      from: input.from,
      to: Array.isArray(input.to) ? input.to : [input.to],
      replyTo: input.replyTo,
      subject: input.subject,
      html: input.html,
      text: input.text,
    },
    input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined,
  );

  if (error) {
    console.error(
      JSON.stringify({
        level: 'error',
        service: 'email-client',
        timestamp: new Date().toISOString(),
        message: 'Resend rechazó el envío del correo.',
        errorName: error.name,
        errorMessage: error.message,
        to: input.to,
        subject: input.subject,
      }),
    );
    throw new BackendOperationError(500, 'INTERNAL_ERROR');
  }
}
