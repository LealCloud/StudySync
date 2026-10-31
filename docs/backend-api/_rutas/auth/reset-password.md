---
resource: auth/reset-password
methods: [POST]
auth: None
consumers:
  - src/app/api/auth/reset-password/route.ts
  - src/lib/backend/services/auth.ts
source_legacy: "§3.4, §11"
contract_version: v1.3.1
---

# POST /auth/reset-password

Establece una nueva contraseña usando un token de recuperación.

## Autenticación

`None`. No se lee `Authorization`.

## Cuerpo

```json
{
  "token": "reset-token",
  "newPassword": "NewPassword1!"
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

`newPassword` debe cumplir las mismas reglas que `password` en el registro: de 6 a 15 caracteres, con al menos una minúscula, una mayúscula y un carácter especial de la lista ``!@#$%^&*()_+-=[]{};:'",.<>/?\|`~``. El conjunto exacto está en `_convenciones/regex.md`.

## Errores

| HTTP  | Código                | Cuándo                                |
| ----: | --------------------- | ------------------------------------- |
| `400` | `INVALID_RESET_TOKEN` | Token inválido, vencido o ya utilizado |
| `422` | `VALIDATION_ERROR`    | Contraseña no cumple las reglas       |
| `429` | `RATE_LIMITED`        | Demasiados intentos                   |
| `500` | `INTERNAL_ERROR`      | Error interno                         |
| `503` | `SERVICE_UNAVAILABLE` | Servicio no disponible temporalmente  |

Códigos generales en [`_convenciones/errores.md`](../../_convenciones/errores.md).
