---
resource: auth/reset-password
methods: [POST]
auth: None
consumers:
  - src/app/api/auth/reset-password/route.ts
contract_version: v2.0
---

# POST /auth/reset-password

Establece una nueva contraseña usando un token de recuperación.

## Autenticación

`None`. No se lee `Authorization`.

## Cuerpo

```json
{
  "token": "reset-token",
  "password": "NewPassword1!"
}
```

## Comportamiento

El token:

- es de un solo uso;
- caduca;
- no puede reutilizarse.

Token inválido, vencido o ya utilizado:

```text
400
```

Contraseña que no cumple las reglas:

```text
422
```

`password` debe cumplir las mismas reglas que en el registro: de 6 a 15 caracteres, con al menos una minúscula, una mayúscula y un carácter especial de la lista ``!@#$%^&*()_+-=[]{};:'",.<>/?\|`~``. El conjunto exacto está en `_convenciones/regex.md`.

El campo se llama `password` (no `newPassword`) para ser coherente con `register`, con el schema Zod (`src/lib/schemas/auth/reset-password.schema.ts`) y con el payload que envía `Resetpasswordform.tsx`. `PUT /users/me/security/password` sigue usando `newPassword` porque allí conviven `currentPassword` y `newPassword`; aquí no hay ambigüedad.

## Errores

|  HTTP | Código                | Cuándo                                 |
| ----: | --------------------- | -------------------------------------- |
| `400` | `INVALID_RESET_TOKEN` | Token inválido, vencido o ya utilizado |
| `422` | `VALIDATION_ERROR`    | Contraseña no cumple las reglas        |
| `429` | `RATE_LIMITED`        | Demasiados intentos                    |
| `500` | `INTERNAL_ERROR`      | Error interno                          |
| `503` | `SERVICE_UNAVAILABLE` | Servicio no disponible temporalmente   |

## Implementación (v2.0)

El route handler `src/app/api/auth/reset-password/route.ts` traduce los
códigos de dominio a los códigos públicos que consume la UI:

| Código de dominio     | Código público |
| :-------------------- | :------------- |
| `INVALID_RESET_TOKEN` | `invalidToken` |
| `VALIDATION_ERROR`    | `invalidData`  |

El resto de códigos (`RATE_LIMITED`, `INTERNAL_ERROR`,
`SERVICE_UNAVAILABLE`) se propagan sin traducción. La UI traduce por
`code`, nunca por texto. Ver `src/lib/errors/auth-errors.ts`.

Este mismo mapeo aplica a `validate-reset-token.md`. La coherencia entre
ambos endpoints es deliberada: la página `reset-password/[token]` valida el
token primero con `validate-reset-token` y luego envía la nueva contraseña
a `reset-password`; ambas respuestas deben hablar el mismo idioma.

---

Códigos generales en [`_convenciones/errores.md`](../../_convenciones/errores.md).
