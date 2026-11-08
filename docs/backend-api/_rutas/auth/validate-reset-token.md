---
resource: auth/validate-reset-token
methods: [POST]
auth: None
consumers:
  - src/app/api/auth/validate-reset-token/route.ts
contract_version: v2.0
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

con el código `INVALID_RESET_TOKEN`. La respuesta sigue la forma
común de error v2.0 (`apiError`):

```json
{
  "status": 400,
  "code": "invalidToken"
}
```

El código de dominio del contrato es `INVALID_RESET_TOKEN`; el
route handler lo traduce al código público `invalidToken` que
consume la UI (ver `src/lib/errors/auth-errors.ts`). El campo
`message` no forma parte de la respuesta v2.0: el frontend
traduce por `code`, nunca por texto.

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

## Rate limiting

- Por IP: `10` peticiones / `15` minutos.
- Por valor de token: `5` peticiones / `15` minutos.

Ambos límites responden `429 RATE_LIMITED`. El límite por token
protege contra reintentos automatizados sobre un mismo enlace; el
límite por IP protege contra sondeo masivo de tokens desde un
mismo origen.
