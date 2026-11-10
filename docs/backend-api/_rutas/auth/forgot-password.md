---
resource: auth/forgot-password
methods: [POST]
auth: None
consumers:
  - src/app/api/auth/forgot-password/route.ts
contract_version: v2.0
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

|  HTTP | Código        | Cuándo               |
| ----: | ------------- | -------------------- |
| `400` | `BAD_REQUEST` | Petición mal formada |
| `400` | `invalidData` | Datos inválidos      |
| `429` | `rateLimited` | Demasiados intentos  |
| `500` | `serverError` | Error interno        |

Códigos generales en [`_convenciones/errores.md`](../../_convenciones/errores.md).

## Implementación (v2.0)

El route handler `src/app/api/auth/forgot-password/route.ts` responde
directamente los códigos públicos que consume la UI, sin capa de
traducción intermedia:

- `400 invalidData` cuando Zod rechaza el cuerpo.
- `429 rateLimited` cuando se supera el rate limit por IP (5/15m) o por
  email (3/15m).
- `500 serverError` para fallos internos no controlados.

Anti-enumeración: la respuesta es `200` independientemente de si el email
existe o no. El dominio (`requestPasswordReset` en
`src/lib/domain/auth.ts`) hace `if (!user) return;` sin distinguir el
resultado.

**Deuda pendiente (fuera de alcance de esta auditoría):** el envío real
del correo con el token no está implementado. El dominio solo loggea el
token por consola en desarrollo (`TODO(password-reset-email)`). La
integración con Resend, ya usada en `POST /contact`, se planifica como
fase aparte.
