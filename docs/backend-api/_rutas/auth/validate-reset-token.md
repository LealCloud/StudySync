---
resource: auth/validate-reset-token
methods: [POST]
auth: None
consumers:
  - src/app/api/auth/validate-reset-token/route.ts
  - src/lib/backend/services/auth.ts
source_legacy: "§3.4, §11"
contract_version: v1.3.1
---

# POST /auth/validate-reset-token

Valida un token de recuperación antes de mostrar la página de restablecimiento.

## Autenticación

`None`. No se lee `Authorization`.

## Cuerpo

```json
{
  "token": "reset-token"
}
```

## Comportamiento

El endpoint únicamente valida el token. No cambia la contraseña ni consume el token.

Si el token es válido, responde:

```text
200
```

con la respuesta `ResetTokenValidationResponse`:

```json
{
  "valid": true
}
```

La respuesta no debe incluir información del usuario (correo, nombre, etc.).

Si el token es inválido, vencido o ya fue utilizado, responde:

```text
400
```

con el código `INVALID_RESET_TOKEN`:

```json
{
  "error": {
    "code": "INVALID_RESET_TOKEN",
    "message": "El token de recuperación no es válido o ha expirado.",
    "details": null
  }
}
```

El frontend debe utilizar este endpoint para determinar si puede mostrar la página de restablecimiento de contraseña.

La validación del token no debe consumirlo. El token únicamente se consume cuando se ejecuta correctamente `POST /auth/reset-password` (ver [`reset-password.md`](reset-password.md)).

## Errores

| HTTP  | Código                | Cuándo                                   |
| ----: | --------------------- | ---------------------------------------- |
| `400` | `INVALID_RESET_TOKEN` | Token inválido, vencido o ya utilizado   |
| `429` | `RATE_LIMITED`        | Demasiados intentos                      |
| `500` | `INTERNAL_ERROR`      | Error interno                            |
| `503` | `SERVICE_UNAVAILABLE` | Servicio no disponible temporalmente     |

Códigos generales en [`_convenciones/errores.md`](../../_convenciones/errores.md).
