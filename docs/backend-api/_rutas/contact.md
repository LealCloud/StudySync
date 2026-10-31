---
resource: contact
methods: [POST]
auth: None
consumers:
  - src/app/api/contact/route.ts
  - src/lib/backend/services/contact.ts
source_legacy: "§3.4, §11"
contract_version: v1.3.1
---

# POST /contact

Formulario de contacto del sitio público.

## Autenticación

`None`. No se lee `Authorization`.

## Cuerpo

```json
{
  "name": "Juan Pérez",
  "email": "user@example.com",
  "contactNumber": "+573001234567",
  "subject": "Consulta sobre planes",
  "message": "Quisiera saber más sobre el plan Premium y sus beneficios."
}
```

`contactNumber` es opcional. Cuando se proporciona, debe utilizar formato internacional E.164. Se omite cuando está vacío.

## Reglas de validación

| Campo           | Regla                                                                                                                             |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `name`          | De 2 a 100 caracteres. Regex: `^[\p{L}\s'.-]+$` (flag `u`).                                                                       |
| `email`         | Hasta 254 caracteres. Regex: `^[^\s@]+@[^\s@]+\.[^\s@]+$`. Se normaliza con `trim()` + `toLowerCase()` antes de enviarse.         |
| `contactNumber` | Opcional. Formato E.164 estricto. Regex: `^\+[1-9]\d{1,14}$`. Longitud total entre 8 y 16 caracteres. Se omite cuando está vacío. |
| `subject`       | De 5 a 150 caracteres. Regex: `^[^<>{}]*$`.                                                                                       |
| `message`       | De 20 a 2000 caracteres. Regex: `^[^<>]*$`.                                                                                       |

El primer dígito tras el `+` en `contactNumber` no puede ser `0` (lo impone `^\+[1-9]\d{1,14}$`).

El conjunto exacto de regex está en [`_convenciones/regex.md`](../_convenciones/regex.md).

## Errores

| HTTP  | Código                | Cuándo                                |
| ----: | --------------------- | ------------------------------------- |
| `400` | `BAD_REQUEST`         | Petición mal formada                  |
| `422` | `VALIDATION_ERROR`    | Datos inválidos                       |
| `429` | `RATE_LIMITED`        | Demasiados intentos                   |
| `500` | `INTERNAL_ERROR`      | Error interno                         |
| `503` | `SERVICE_UNAVAILABLE` | Servicio no disponible temporalmente  |

Códigos generales en [`_convenciones/errores.md`](../_convenciones/errores.md).
