---
kind: convention
source_legacy: '§4.1, §4.2, regla 401'
contract_version: v1.3.1
---

# Errores

Todos los errores deben utilizar el siguiente formato:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensaje legible",
    "details": null
  }
}
```

El campo `error.code` forma parte del contrato y debe ser estable.

El mensaje puede ser legible para diagnóstico, pero el frontend no debe depender del texto de `message`.

---

## Códigos HTTP generales

|  HTTP | Código                | Cuándo                                                               |
| ----: | --------------------- | -------------------------------------------------------------------- |
| `400` | `BAD_REQUEST`         | Petición mal formada                                                 |
| `401` | `UNAUTHENTICATED`     | Token ausente, inválido o vencido; credenciales de login incorrectas |
| `403` | `FORBIDDEN`           | Usuario autenticado sin permiso                                      |
| `404` | `NOT_FOUND`           | El recurso no existe o no puede mostrarse al solicitante             |
| `409` | `CONFLICT`            | La operación no es compatible con el estado actual                   |
| `422` | `VALIDATION_ERROR`    | Datos inválidos                                                      |
| `429` | `RATE_LIMITED`        | Se superó el límite de peticiones                                    |
| `500` | `INTERNAL_ERROR`      | Error interno                                                        |
| `502` | `UPSTREAM_ERROR`      | Falló una dependencia externa                                        |
| `503` | `SERVICE_UNAVAILABLE` | Servicio no disponible temporalmente                                 |

---

## Códigos de dominio

|  HTTP | Código                     | Endpoint                                        |
| ----: | -------------------------- | ----------------------------------------------- |
| `422` | `INVALID_CURRENT_PASSWORD` | [`PUT /users/me/security/password`](../_rutas/users-me/security/password.md) |
| `422` | `INVALID_CODE`             | 2FA [`verify`](../_rutas/users-me/security/two-factor.md) y [`disable`](../_rutas/users-me/security/two-factor.md) |
| `409` | `PAYMENT_METHOD_REQUIRED`  | [`PUT /users/me/subscription/plan`](../_rutas/users-me/subscription.md) |
| `409` | `EMAIL_TAKEN`              | [`POST /users/me/security/email-change`](../_rutas/users-me/security/email-change.md) |
| `409` | `EMAIL_UNCHANGED`          | [`POST /users/me/security/email-change`](../_rutas/users-me/security/email-change.md) |
| `409` | `SESSION_IS_CURRENT`       | [`DELETE /users/me/security/sessions/:sessionId`](../_rutas/users-me/security/sessions.md) |

---

## Regla importante sobre `401`

`401` se reserva para:

- problemas con el Access Token;
- credenciales incorrectas en `/auth/login`;
- Refresh Token inválido, vencido o revocado cuando corresponda.

Una contraseña actual incorrecta durante un cambio de contraseña **no debe responder `401`**.

Debe utilizar:

```text
422 INVALID_CURRENT_PASSWORD
```

Un código 2FA incorrecto tampoco debe responder `401`.

Debe utilizar:

```text
422 INVALID_CODE
```

Esto es importante porque el BFF interpreta `401` como un problema de autenticación/sesión.

---

## Errores por endpoint

Todos los endpoints con `Required` pueden responder:

```text
401 UNAUTHENTICATED
```

cuando existe un problema con el Access Token.

Los errores adicionales por endpoint están documentados en cada archivo de [`_rutas/`](../README.md#resumen-de-los-36-endpoints), en la sección "Errores".
