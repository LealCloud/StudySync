---
resource: users-me-security-email-change
methods: [POST]
auth: Required
consumers:
  - src/graphql/resolvers/security.ts
source_legacy: "§3.8, §11"
contract_version: v1.3.1
---

# POST /users/me/security/email-change

Solicita el cambio de correo electrónico.

## Autenticación

`Required`.

## Cuerpo

`BackendRequestEmailChangeInput`:

```json
{
  "newEmail": "nuevo@example.com"
}
```

## Comportamiento

El correo no cambia hasta que se confirme el enlace de verificación enviado a `newEmail`.

- Si el correo nuevo ya está registrado → `409 EMAIL_TAKEN`.
- Si es igual al actual → `409 EMAIL_UNCHANGED`.

## Respuesta

`BackendSecurityOperationResult`:

```json
{
  "success": true,
  "message": "Verification email sent"
}
```

`message` es informativo. La UI decide por `success` y por código de error, nunca por texto.

## Errores

| HTTP  | Código             | Cuándo                             |
| ----: | ------------------ | ---------------------------------- |
| `401` | `UNAUTHENTICATED`  | Token ausente, inválido o vencido  |
| `409` | `EMAIL_TAKEN`      | El correo nuevo ya está registrado |
| `409` | `EMAIL_UNCHANGED`  | El correo nuevo es igual al actual |
| `422` | `VALIDATION_ERROR` | Formato de correo inválido         |

Códigos generales en [`_convenciones/errores.md`](../../../_convenciones/errores.md).
