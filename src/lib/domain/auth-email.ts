// Construcción del contenido de los correos transaccionales de
// autenticación (recuperación de contraseña, verificación de email, etc.).
//
// Separado de `auth.ts` para mantener la responsabilidad del dominio
// clara: `auth.ts` implementa reglas de negocio, este archivo construye
// los mensajes que se envían al usuario.
//
// Regla de escape: todos los valores interpolados en el HTML pasan por
// `escapeHtml`, igual que en `contact.ts`. Aunque hoy el único valor
// dinámico es una URL que construimos nosotros, mantener la regla
// evita sorpresas cuando se añadan más campos (p. ej. el nombre del
// usuario en el saludo).

interface PasswordResetEmailInput {
  firstName: string;
  resetUrl: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildPasswordResetEmail(input: PasswordResetEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const safeName = escapeHtml(input.firstName);
  const safeUrl = escapeHtml(input.resetUrl);

  // TODO(i18n-emails): construir el correo en el idioma del usuario
  // (`Preferences.language`). Hoy se envía siempre en español, alineado
  // con `defaultLocale: 'es'`. Requiere:
  //   - Recibir `language` como input.
  //   - Tener las cadenas del correo en `messages/{es,en}.json` o en un
  //     módulo dedicado (los correos no los consume `next-intl`).
  //   - Actualizar el flujo en `requestPasswordReset`.

  // TODO(sync-reset-ttl): el texto "1 hora" está hardcodeado aquí y el
  // TTL real vive en `RESET_TOKEN_TTL_MS` (`src/lib/domain/auth.ts`).
  // Si se cambia el TTL, actualizar ambos.
  const EXPIRY_TEXT_HTML =
    'Este enlace caduca en 1 hora y solo puede usarse una vez.';
  const EXPIRY_TEXT_PLAIN =
    'Este enlace caduca en 1 hora y solo puede usarse una vez.';

  const subject = 'Restablece tu contraseña en StudySync';

  const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:24px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <tr>
        <td style="padding:20px 24px;background:#4f46e5;color:#ffffff;font-size:18px;font-weight:600;">
          Restablece tu contraseña
        </td>
      </tr>
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;">Hola ${safeName},</p>
          <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta en StudySync.
            Si no fuiste tú, puedes ignorar este correo.
          </p>
          <p style="margin:16px 0;">
            <a href="${safeUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
              Restablecer contraseña
            </a>
          </p>
          <p style="margin:0 0 12px 0;font-size:12px;line-height:1.6;color:#6b7280;">
            O copia este enlace en tu navegador:<br />
            <span style="word-break:break-all;">${safeUrl}</span>
          </p>
          <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280;">
            ${EXPIRY_TEXT_HTML}
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    `Hola ${input.firstName},`,
    '',
    'Recibimos una solicitud para restablecer la contraseña de tu cuenta en StudySync.',
    'Si no fuiste tú, puedes ignorar este correo.',
    '',
    'Abre este enlace para restablecer tu contraseña:',
    input.resetUrl,
    '',
    EXPIRY_TEXT_PLAIN,
  ].join('\n');

  return { subject, html, text };
}
