---
kind: history
source_legacy: "§13"
contract_version: v1.3.1
---

# Historial de cambios

## v1

Contrato inicial formalizado para la integración entre el frontend/BFF y el backend.

Este contrato puede implementarse en dos modos equivalentes: `rest` (backend real) y `mock` (entorno controlado sin backend). Ver [`../_convenciones/arquitectura.md`](../_convenciones/arquitectura.md).

Incluye:

- nombres de campos en inglés;
- autenticación mediante Access Token y Refresh Token;
- rotación de Refresh Token;
- endpoints de autenticación;
- endpoints de usuario;
- perfil público con autenticación opcional;
- configuración de privacidad;
- seguridad y 2FA;
- sesiones;
- preferencias;
- cuenta y desactivación;
- cursos;
- certificados;
- suscripción;
- métodos de pago;
- facturas;
- contrato estándar de errores;
- códigos de dominio;
- reglas de actualización parcial;
- reglas de seguridad y autorización.

El contrato `v1` debe considerarse compartido entre frontend/BFF y backend.

Los cambios incompatibles deben generar una nueva versión del contrato.

## v1.1

Cambios compatibles hacia atrás. El backend puede seguir enviando los campos retirados del contrato; el frontend los ignora.

- `POST /auth/login`: la respuesta se limita a `id`, `role`, `token`, `refreshToken`, `expiresIn` y `refreshExpiresIn`.
- `firstName`, `lastName`, `subscription` e `image` dejan de formar parte del contrato de login. Los datos de presentación (nombre, correo, imagen, plan) provienen del BFF vía GraphQL.
- Nueva sección de alcance de la sesión del frontend y fuente de los datos de presentación (actualmente en [`../_convenciones/autenticacion.md`](../_convenciones/autenticacion.md)).
- Se aclara que los datos de presentación se obtienen a partir de [`GET /users/me`](../_rutas/users-me/me.md) y [`GET /users/me/subscription`](../_rutas/users-me/subscription.md).

## v1.2

Cambios compatibles hacia atrás. El backend puede seguir operando sin los nuevos campos o validaciones; el frontend los aprovecha cuando están presentes.

### Preferencias

- Formalizada la semántica transversal de `PATCH`: `undefined` = no modificar, `null` = borrar, valor = asignar. Ver [`../_convenciones/reglas-transversales.md`](../_convenciones/reglas-transversales.md).
- `PATCH /users/me/preferences` no admite `null` en ningún campo (`422 VALIDATION_ERROR`). Excepción documentada en [`../_rutas/users-me/preferences.md`](../_rutas/users-me/preferences.md).
- `language` restringido a `es` | `en`. `notifications: {}` no modifica ningún subcampo.

### Privacy

- `PATCH /users/me/privacy` no admite `null` en ningún campo (`422 VALIDATION_ERROR`).
- Documentada la matriz de visibilidad de `publicProfile` en [`../_rutas/users-me/public-profile.md`](../_rutas/users-me/public-profile.md).
- `BackendPublicProfile` expone `allowDirectMessages: boolean`.

### Account

- Documentados los estados `suspended` e `inactive` como no autoasignables desde User Settings.
- `403 FORBIDDEN` para `teacher` / `admin` en `POST/DELETE /users/me/account/deactivation`.

### Courses

- `progress` documentado en rango `[0.0, 1.0]`.
- `403 FORBIDDEN` para `teacher` / `admin` en `GET /users/me/courses`.

### Certificates

- `downloadUrl` documentada como URL firmada con expiración.
- `403 FORBIDDEN` para `teacher` / `admin` en `GET /users/me/certificates`.

### Billing

- `changeSubscriptionPlan`: upgrade inmediato, downgrade a fin de período.
- `cancelSubscription`: detiene cobros futuros, mantiene acceso hasta `currentPeriodEnd`.
- `403 FORBIDDEN` para `teacher` / `admin` en todas las queries y mutations de Billing.

### Autorización por rol

- Documentada la matriz de autorización por rol en [`../README.md`](../README.md).
- Documentado `403 FORBIDDEN` en los endpoints exclusivos de `student`.

## v1.3

Cambios compatibles hacia atrás que completan el contrato de User Settings según los ajustes acordados.

- Añadido [`personal-data.md`](../_rutas/users-me/personal-data.md) para datos personales: campos, `documentType`, validaciones, semántica PATCH, excepción de `null` en `firstName`/`lastName` y rechazo atómico por `identityLocked`.
- Añadido `security/` para Security: reglas de contraseña, cierre de otras sesiones, códigos de email diferenciados, flujo y formato de 2FA y gestión de sesiones.
- La antigua sección de alcance de sesión del frontend pasa a [`../_convenciones/autenticacion.md`](../_convenciones/autenticacion.md); actualizadas sus referencias cruzadas.
- Añadido `409 SESSION_IS_CURRENT` y códigos `EMAIL_TAKEN` / `EMAIL_UNCHANGED` a [`../_convenciones/errores.md`](../_convenciones/errores.md).
- Añadidas reglas de `progress`, estado `paused` y `downloadUrl` en [`courses.md`](../_rutas/users-me/courses.md) y [`certificates.md`](../_rutas/users-me/certificates.md); reforzados los errores por endpoint.

## v1.3.1

Cambios **compatibles hacia atrás** desde el punto de vista del frontend, pero que **endurecen las validaciones del backend**. Alinean el contrato con lo ya implementado en `src/lib/schemas/primitives.ts` (Fase 0.6, cerrada e implementada el 2026-10-19).

- [`register.md`](../_rutas/auth/register.md): regex explícitos para `firstName`, `lastName`, `email` y lista explícita de caracteres especiales para `password`. Se documenta que `acceptedTerms` no forma parte del contrato.
- [`contact.md`](../_rutas/contact.md): regex explícitos para `name`, `email`, `contactNumber` (E.164 estricto con `^\+[1-9]\d{1,14}$`), `subject` y `message`. Se explicita que el primer dígito tras `+` no puede ser `0`.
- [`forgot-password.md`](../_rutas/auth/forgot-password.md): se generaliza la normalización `trim()` + `toLowerCase()` a `POST /auth/register`, `POST /auth/forgot-password` y `POST /auth/login`.
- [`reset-password.md`](../_rutas/auth/reset-password.md): se explicita la lista de caracteres especiales de `newPassword`.
- [`profile.md`](../_rutas/users-me/profile.md): se documentan los regex de `image` (URL absoluta, protocol-relative, data URI con `;base64,`).
- [`personal-data.md`](../_rutas/users-me/personal-data.md): regex explícitos para `firstName`, `lastName`, `documentId`, `phone`, `country` y `address`.
- [`security/password.md`](../_rutas/users-me/security/password.md): lista explícita de caracteres especiales de `newPassword`.
- Nuevo [`../_convenciones/regex.md`](../_convenciones/regex.md): tabla consolidada de regex de referencia.

**Nota de despliegue:** el frontend ya aplica estos endurecimientos desde la Fase 0.6. El backend debe adoptarlos para cumplir el contrato. Mientras no los adopte, puede aceptar payloads que el frontend ya rechaza; ese desfase es tolerado durante la ventana de migración y **no constituye un cambio de contrato**. Una vez el backend adopte los regex, ambos lados estarán alineados.
