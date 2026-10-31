---
resource: users-me-payment-methods
methods: [GET, DELETE]
auth: Required
consumers:
  - src/graphql/resolvers/billing.ts
source_legacy: "§7, §11"
contract_version: v1.3.1
---

# /users/me/payment-methods

Métodos de pago del usuario autenticado.

## Autenticación

`Required` en ambos endpoints.

## GET /users/me/payment-methods

Devuelve `BackendPaymentMethod[]`:

| Campo             | Tipo             |
| :---------------- | :--------------- |
| `id`              | `string`         |
| `brand`           | `string \| null` |
| `last4`           | `string \| null` |
| `expirationMonth` | `number \| null` |
| `expirationYear`  | `number \| null` |

Solo se exponen `id`, `brand`, `last4`, `expirationMonth` y `expirationYear`. Nunca se devuelven número completo de tarjeta, CVV ni equivalentes (ver [`_convenciones/reglas-transversales.md`](../../_convenciones/reglas-transversales.md), regla 5).

## DELETE /users/me/payment-methods/:paymentMethodId

Elimina un método de pago.

### Comportamiento

- `404 NOT_FOUND` si el método no existe.
- `409 CONFLICT` si es el último método de una suscripción premium `active`.

Devuelve `boolean`.

## Autorización por rol

`403 FORBIDDEN` para `teacher` y `admin` en ambos endpoints.

El BFF bloquea con `403` si `session.user.role !== 'student'`, sin llamar al backend. El backend también responde `403` como defensa en profundidad.

## Errores

| Endpoint                                     | HTTP  | Código            | Cuándo                              |
| :------------------------------------------- | ----: | ----------------- | ----------------------------------- |
| `GET /users/me/payment-methods`              | `401` | `UNAUTHENTICATED` | Token inválido o vencido            |
| `GET /users/me/payment-methods`              | `403` | `FORBIDDEN`       | `teacher` / `admin`                 |
| `DELETE /users/me/payment-methods/:id`       | `401` | `UNAUTHENTICATED` | Token inválido o vencido            |
| `DELETE /users/me/payment-methods/:id`       | `403` | `FORBIDDEN`       | `teacher` / `admin`                 |
| `DELETE /users/me/payment-methods/:id`       | `404` | `NOT_FOUND`       | Método inexistente                  |
| `DELETE /users/me/payment-methods/:id`       | `409` | `CONFLICT`        | Último método de suscripción activa |

Códigos generales en [`_convenciones/errores.md`](../../_convenciones/errores.md).
