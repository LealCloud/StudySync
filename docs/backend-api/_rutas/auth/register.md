---
resource: auth/register
methods: [POST]
auth: None
consumers:
  - src/app/api/auth/register/route.ts
  - src/lib/backend/services/auth.ts
source_legacy: "§3.4, §11"
contract_version: v1.3.1
---

# POST /auth/register

Crea una cuenta.

## Autenticación

`None`. No se lee `Authorization`.

## Cuerpo

```json
{
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "user@example.com",
  "password": "Password1!"
}
```

`email` se normaliza con `trim()` + `toLowerCase()` antes de enviarse.

## Respuesta

```text
201
```

## Reglas de validación

| Campo       | Regla                                                                                                                                                             |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `firstName` | De 2 a 100 caracteres. Regex: `^[\p{L}\s'.-]+$` (flag `u`).                                                                                                       |
| `lastName`  | De 2 a 100 caracteres. Regex: `^[\p{L}\s'.-]+$` (flag `u`).                                                                                                       |
| `email`     | Hasta 254 caracteres. Regex: `^[^\s@]+@[^\s@]+\.[^\s@]+$`. Se normaliza con `trim()` + `toLowerCase()` antes de enviarse.                                         |
| `password`  | De 6 a 15 caracteres, con al menos una minúscula, una mayúscula y un carácter especial de la lista ``!@#$%^&*()_+-=[]{};:'",.<>/?\|`~``.                         |

El conjunto exacto de caracteres especiales aceptados está en [`_convenciones/regex.md`](../../_convenciones/regex.md).

`acceptedTerms` no forma parte del contrato: es un campo solo-cliente del formulario y se descarta antes de enviar.

## Errores

| HTTP  | Código            | Cuándo                                |
| ----: | ----------------- | ------------------------------------- |
| `400` | `BAD_REQUEST`     | Petición mal formada                  |
| `409` | `CONFLICT`        | Email repetido                        |
| `422` | `VALIDATION_ERROR`| Datos inválidos                       |
| `429` | `RATE_LIMITED`    | Demasiados intentos                   |
| `500` | `INTERNAL_ERROR`  | Error interno                         |
| `503` | `SERVICE_UNAVAILABLE` | Servicio no disponible temporalmente |

Códigos generales en [`_convenciones/errores.md`](../../_convenciones/errores.md).
