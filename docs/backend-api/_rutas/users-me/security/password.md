---
resource: users-me-security-password
methods: [PUT]
auth: Required
consumers:
  - src/graphql/resolvers/security.ts
source_legacy: "§3.8, §11"
contract_version: v1.3.1
---

# PUT /users/me/security/password

Cambia la contraseña del usuario autenticado.

## Autenticación

`Required`.

## Cuerpo

`BackendChangePasswordInput`:

```json
{
  "currentPassword": "OldPassword1!",
  "newPassword": "NewPassword1!"
}
```

## Reglas de `newPassword`

- De 6 a 15 caracteres.
- Al menos una letra minúscula, una letra mayúscula y un carácter especial de la lista ``!@#$%^&*()_+-=[]{};:'",.<>/?\|`~``.
- Se aplican las mismas reglas que en registro y restablecimiento de contraseña (ver [`../../auth/register.md`](../../auth/register.md) y [`../../auth/reset-password.md`](../../auth/reset-password.md)).
- Si `newPassword` es igual a `currentPassword`, responde `409 CONFLICT`.
- Si `currentPassword` es incorrecta, responde `422 INVALID_CURRENT_PASSWORD`.

El conjunto exacto de caracteres especiales está en [`_convenciones/regex.md`](../../../_convenciones/regex.md). No se admiten otros caracteres especiales (por ejemplo, no se acepta `€` ni `ñ` como "carácter especial").

## Efecto secundario: cierre de otras sesiones

Al cambiar la contraseña, el backend revoca todas las sesiones del usuario excepto la actual. Tras el éxito, la UI debe refrescar `mySecuritySettings` con `network-only`.

## Respuesta

`BackendSecurityOperationResult`:

```json
{
  "success": true,
  "message": "Password updated"
}
```

## Errores

| HTTP  | Código                     | Cuándo                              |
| ----: | -------------------------- | ----------------------------------- |
| `401` | `UNAUTHENTICATED`          | Token ausente, inválido o vencido   |
| `409` | `CONFLICT`                 | `newPassword` igual a `currentPassword` |
| `422` | `VALIDATION_ERROR`         | `newPassword` no cumple las reglas  |
| `422` | `INVALID_CURRENT_PASSWORD` | `currentPassword` incorrecta        |

Una contraseña actual incorrecta **no** debe responder `401` (ver [`_convenciones/errores.md`](../../../_convenciones/errores.md), regla del 401).

Códigos generales en [`_convenciones/errores.md`](../../../_convenciones/errores.md).
