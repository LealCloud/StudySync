---
resource: users-me-security
methods: [GET]
auth: Required
consumers:
  - src/graphql/resolvers/security.ts
source_legacy: "§3.8, §10"
contract_version: v1.3.1
---

# GET /users/me/security

Configuración de seguridad del usuario autenticado.

## Autenticación

`Required`.

## Respuesta

`BackendSecuritySettings`:

| Campo               | Tipo                       |
| :------------------ | :------------------------- |
| `email`             | `string`                   |
| `emailVerified`     | `boolean`                  |
| `twoFactorEnabled`  | `boolean`                  |
| `twoFactorRequired` | `boolean`                  |
| `sessions`          | `BackendSecuritySession[]` |

`BackendSecuritySession`:

| Campo          | Tipo                |
| :------------- | :------------------ |
| `id`           | `string`            |
| `deviceName`   | `string \| null`    |
| `browser`      | `string \| null`    |
| `ipAddress`    | `string \| null`    |
| `lastActiveAt` | `string` (ISO 8601) |
| `current`      | `boolean`           |

`twoFactorRequired` es un discriminador de rol:

- `student` → 2FA opcional. `twoFactorRequired` puede ser `true` o `false`.
- `teacher` / `admin` → 2FA obligatorio. `twoFactorRequired` es `true` y `disable` responde `403` (ver [`two-factor.md`](two-factor.md)).

## Sub-recursos

- [`email-change.md`](email-change.md) — cambio de correo.
- [`password.md`](password.md) — cambio de contraseña.
- [`two-factor.md`](two-factor.md) — activación y desactivación de 2FA.
- [`sessions.md`](sessions.md) — revocación de sesiones.

## Errores

| HTTP  | Código            | Cuándo                                |
| ----: | ----------------- | ------------------------------------- |
| `401` | `UNAUTHENTICATED` | Token ausente, inválido o vencido     |

Códigos generales en [`_convenciones/errores.md`](../../../_convenciones/errores.md).
