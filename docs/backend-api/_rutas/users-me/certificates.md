---
resource: users-me-certificates
methods: [GET]
auth: Required
consumers:
  - src/graphql/resolvers/certificates.ts
source_legacy: "§5, §11"
contract_version: v1.3.1
---

# GET /users/me/certificates

Certificados emitidos al usuario autenticado.

## Autenticación

`Required`.

## Respuesta

`BackendCertificate[]`:

| Campo               | Tipo             |
| :------------------ | :--------------- |
| `id`                | `string`         |
| `courseId`          | `string`         |
| `courseTitle`       | `string`         |
| `certificateNumber` | `string`         |
| `issuedAt`          | `string` (ISO 8601) |
| `downloadUrl`       | `string`         |

`downloadUrl` es `String!`: una URL absoluta firmada con expiración.

El backend decide el TTL de la URL. La UI trata la URL como de un solo uso y la abre en nueva pestaña; no la cachea.

## Autorización por rol

`403 FORBIDDEN` para `teacher` y `admin`.

El BFF bloquea con `403` si `session.user.role !== 'student'`, sin llamar al backend. El backend también responde `403` como defensa en profundidad.

## Errores

| HTTP  | Código            | Cuándo                     |
| ----: | ----------------- | -------------------------- |
| `401` | `UNAUTHENTICATED` | Token inválido o vencido   |
| `403` | `FORBIDDEN`       | `teacher` / `admin`        |

Códigos generales en [`_convenciones/errores.md`](../../_convenciones/errores.md).
