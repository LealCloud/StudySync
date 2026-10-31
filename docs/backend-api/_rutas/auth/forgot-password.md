---
resource: auth/forgot-password
methods: [POST]
auth: None
consumers:
  - src/app/api/auth/forgot-password/route.ts
  - src/lib/backend/services/auth.ts
source_legacy: "§3.4, §11"
contract_version: v1.3.1
---

# POST /auth/forgot-password

Solicita el correo de recuperación de contraseña.

## Autenticación

`None`. No se lee `Authorization`.

## Cuerpo

```json
{
  "email": "user@example.com"
}
```

`email` se normaliza con `trim()` + `toLowerCase()` antes de procesarse. Formato: `^[^\s@]+@[^\s@]+\.[^\s@]+$`, hasta 254 caracteres.

## Comportamiento

Para evitar enumeración de usuarios, el backend debe responder `200` aunque el correo no exista.

## Errores

| HTTP  | Código            | Cuándo                                |
| ----: | ----------------- | ------------------------------------- |
| `400` | `BAD_REQUEST`     | Petición mal formada                  |
| `422` | `VALIDATION_ERROR`| Datos inválidos                       |
| `429` | `RATE_LIMITED`    | Demasiados intentos                   |
| `500` | `INTERNAL_ERROR`  | Error interno                         |
| `503` | `SERVICE_UNAVAILABLE` | Servicio no disponible temporalmente |

Códigos generales en [`_convenciones/errores.md`](../../_convenciones/errores.md).
