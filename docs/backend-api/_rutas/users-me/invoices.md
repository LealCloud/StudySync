---
resource: users-me-invoices
methods: [GET]
auth: Required
consumers:
  - src/graphql/resolvers/billing.ts
source_legacy: "§7, §11"
contract_version: v1.3.1
---

# GET /users/me/invoices

Facturas del usuario autenticado.

## Autenticación

`Required`.

## Respuesta

`BackendInvoice[]`:

| Campo         | Tipo              |
| :------------ | :---------------- |
| `id`          | `string`          |
| `number`      | `string`          |
| `amount`      | `number` (Int)    |
| `currency`    | `string`          |
| `status`      | `InvoiceStatus`   |
| `issuedAt`    | `string` (ISO 8601) |
| `downloadUrl` | `string \| null`  |

`InvoiceStatus`: `draft | open | paid | void | uncollectible`.

## Semántica de `amount`

`amount` es un entero expresado en la unidad menor de la moneda.

Ejemplo:

```text
COP 49.900,00 → 4990000
```

El backend no debe devolver cantidades monetarias como valores de punto flotante si el contrato define el campo como entero.

El schema GraphQL del BFF expone `amount` como `Int!`, coherente con el tipo entero del contrato REST.

## Autorización por rol

`403 FORBIDDEN` para `teacher` y `admin`.

El BFF bloquea con `403` si `session.user.role !== 'student'`, sin llamar al backend. El backend también responde `403` como defensa en profundidad.

## Errores

| HTTP  | Código            | Cuándo                     |
| ----: | ----------------- | -------------------------- |
| `401` | `UNAUTHENTICATED` | Token inválido o vencido   |
| `403` | `FORBIDDEN`       | `teacher` / `admin`        |

Códigos generales en [`_convenciones/errores.md`](../../_convenciones/errores.md).
