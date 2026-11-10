---
resource: auth/register
methods: [POST]
auth: None
consumers:
  - src/app/api/auth/register/route.ts
contract_version: v2.0
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

| Campo       | Regla                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `firstName` | De 2 a 100 caracteres. Regex: `^[\p{L}\s'.-]+$` (flag `u`).                                                                              |
| `lastName`  | De 2 a 100 caracteres. Regex: `^[\p{L}\s'.-]+$` (flag `u`).                                                                              |
| `email`     | Hasta 254 caracteres. Regex: `^[^\s@]+@[^\s@]+\.[^\s@]+$`. Se normaliza con `trim()` + `toLowerCase()` antes de enviarse.                |
| `password`  | De 6 a 15 caracteres, con al menos una minúscula, una mayúscula y un carácter especial de la lista ``!@#$%^&*()_+-=[]{};:'",.<>/?\|`~``. |

El conjunto exacto de caracteres especiales aceptados está en [`_convenciones/regex.md`](../../_convenciones/regex.md).

`acceptedTerms` no forma parte del contrato: es un campo solo-cliente del
formulario y se descarta antes de enviar. El backend no lo valida; si
llega en el payload, el route handler lo ignora (Zod solo acepta los
campos de `registerSchema`).

`confirmPassword` tampoco viaja al backend. Es un campo cliente-only que
se usa para confirmar la contraseña en el formulario; `toRegisterPayload`
lo descarta antes del `fetch`. Si llega en el payload, el backend lo
ignora por la misma razón que `acceptedTerms`.

## Errores

|  HTTP | Código        | Cuándo               |
| ----: | ------------- | -------------------- |
| `400` | `BAD_REQUEST` | Petición mal formada |
| `400` | `invalidData` | Datos inválidos      |
| `409` | `emailTaken`  | Email repetido       |
| `429` | `rateLimited` | Demasiados intentos  |
| `500` | `serverError` | Error interno        |

Códigos generales en [`_convenciones/errores.md`](../../_convenciones/errores.md).

## Implementación (v2.0)

El route handler `src/app/api/auth/register/route.ts` responde
directamente los códigos públicos que consume la UI, sin capa de
traducción intermedia:

- `400 invalidData` cuando Zod rechaza el cuerpo.
- `409 emailTaken` cuando el email ya está registrado. Internamente el
  dominio lanza `BackendOperationError(409, 'CONFLICT')` y el route
  handler lo traduce a `emailTaken`.
- `429 rateLimited` cuando se supera el rate limit por IP o por email.
- `500 serverError` para fallos internos no controlados.

El usuario creado tiene `role: 'student'`. Los roles `teacher` y `admin`
no se asignan por este endpoint.

## Rate limiting

- Por IP: `5` peticiones / `30` minutos.
- Por email (normalizado con `toLowerCase()`): `3` peticiones / `30`
  minutos.

Ambos límites responden `429 rateLimited`.
