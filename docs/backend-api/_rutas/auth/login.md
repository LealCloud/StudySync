---
resource: auth/login
methods: [POST]
auth: None
consumers:
  - src/auth.ts
  - src/lib/backend/services/auth.ts
source_legacy: "§3.1, §3.2, §11"
contract_version: v1.3.1
---

# POST /auth/login

Autentica al usuario y devuelve un par de tokens.

## Autenticación

`None`. No se lee `Authorization`.

## Cuerpo

```json
{
  "email": "user@example.com",
  "password": "Password1!"
}
```

`email` se normaliza con `trim()` + `toLowerCase()` antes de procesarse. Formato: `^[^\s@]+@[^\s@]+\.[^\s@]+$`, hasta 254 caracteres. Ver [`_convenciones/regex.md`](../../_convenciones/regex.md).

## Respuesta

Dentro de `data`:

| Campo              | Tipo     | Descripción                            |
| ------------------ | -------- | -------------------------------------- |
| `id`               | `string` | Identificador único del usuario        |
| `role`             | `string` | Rol del usuario                        |
| `token`            | `string` | Access Token                           |
| `refreshToken`     | `string` | Refresh Token                          |
| `expiresIn`        | `number` | Duración del Access Token en segundos  |
| `refreshExpiresIn` | `number` | Duración del Refresh Token en segundos |

`id` debe ser **el mismo valor** que devuelve [`GET /users/me`](../users-me/me.md) en su campo `id` (ver [`me.md`](../users-me/me.md)).

Los valores permitidos para `role` son:

```text
student
teacher
admin
```

Los datos de presentación (nombre, correo, imagen, plan) no forman parte de la respuesta de login. Se obtienen del BFF vía GraphQL a partir de [`GET /users/me`](../users-me/me.md) y [`GET /users/me/subscription`](../users-me/subscription.md) (ver [`me.md`](../users-me/me.md) y [`subscription.md`](../users-me/subscription.md)).

## Errores

| HTTP  | Código            | Cuándo                                                  |
| ----: | ----------------- | ------------------------------------------------------- |
| `400` | `BAD_REQUEST`     | Petición mal formada                                    |
| `401` | `UNAUTHENTICATED` | Credenciales incorrectas                                |
| `422` | `VALIDATION_ERROR`| Datos inválidos                                         |
| `429` | `RATE_LIMITED`    | Demasiados intentos                                     |
| `500` | `INTERNAL_ERROR`  | Error interno                                           |
| `503` | `SERVICE_UNAVAILABLE` | Servicio no disponible temporalmente                |

Códigos generales en [`_convenciones/errores.md`](../../_convenciones/errores.md).
