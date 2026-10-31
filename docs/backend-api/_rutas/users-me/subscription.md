---
resource: users-me-subscription
methods: [GET, PUT, POST]
auth: Required
consumers:
  - src/graphql/resolvers/billing.ts
  - src/components/layout/dashboard/sidebar/useSidebarData.ts
source_legacy: "§6, §11"
contract_version: v1.3.1
---

# /users/me/subscription

Suscripción del usuario autenticado y gestión de su plan.

## Autenticación

`Required` en los tres endpoints.

## GET /users/me/subscription

Devuelve `BackendSubscription | null`.

`null` si el usuario no tiene suscripción.

`BackendSubscription`:

| Campo              | Tipo                       |
| :----------------- | :------------------------- |
| `id`               | `string`                   |
| `plan`             | `SubscriptionPlan`         |
| `status`           | `SubscriptionStatus`       |
| `startedAt`        | `string` (ISO 8601)        |
| `currentPeriodEnd` | `string \| null` (ISO 8601) |
| `cancelAtPeriodEnd`| `boolean`                  |

`SubscriptionPlan`: `free | premium | enterprise`.

`SubscriptionStatus`: `trialing | active | past_due | canceled | expired`.

El sidebar consume `mySubscription.plan` para el `PlanCard`.

## PUT /users/me/subscription/plan

Cambia el plan de la suscripción.

### Cuerpo

```json
{
  "plan": "premium"
}
```

### Transiciones permitidas

| Desde        | Hacia        | Resultado                                                                                     |
| ------------ | ------------ | --------------------------------------------------------------------------------------------- |
| `free`       | `premium`    | Permitido. Exige al menos un método de pago; si no, `409 PAYMENT_METHOD_REQUIRED`.            |
| `premium`    | `free`       | Permitido.                                                                                    |
| cualquiera   | `enterprise` | No se permite por API. Responder `403`. Enterprise se contrata por el formulario de contacto. |
| `enterprise` | cualquiera   | No se permite por API. Responder `403`.                                                       |
| cualquiera   | mismo plan   | Responder `409`.                                                                              |

### Semántica

- **Upgrade** (`free → premium`): aplica **inmediatamente**. El backend cobra prorrateado si corresponde.
- **Downgrade** (`premium → free`): aplica **a fin de período** (`currentPeriodEnd`). El usuario mantiene acceso premium hasta esa fecha.
- **`enterprise`**: no se gestiona por API.

Devuelve el `BackendSubscription` completo actualizado.

## POST /users/me/subscription/cancellation

Cancela la suscripción.

### Semántica

- **Detiene cobros futuros**. Setea `cancelAtPeriodEnd: true`.
- **Mantiene `status: 'active'`** hasta `currentPeriodEnd`. El usuario conserva acceso al plan hasta el fin del período pagado.
- Después de `currentPeriodEnd`, el backend transiciona a `canceled` y luego a `expired`.
- Responder `404` si no hay suscripción activa. `409` si ya está cancelada (`cancelAtPeriodEnd: true`).

Devuelve el `BackendSubscription` completo actualizado.

## Autorización por rol

`403 FORBIDDEN` para `teacher` y `admin` en los tres endpoints.

El BFF bloquea con `403` si `session.user.role !== 'student'`, sin llamar al backend. El backend también responde `403` como defensa en profundidad.

## Errores

| Endpoint                                   | HTTP  | Código                    | Cuándo                                                     |
| :----------------------------------------- | ----: | ------------------------- | ---------------------------------------------------------- |
| `GET /users/me/subscription`               | `401` | `UNAUTHENTICATED`         | Token inválido o vencido                                   |
| `GET /users/me/subscription`               | `403` | `FORBIDDEN`               | `teacher` / `admin`                                        |
| `PUT /users/me/subscription/plan`          | `401` | `UNAUTHENTICATED`         | Token inválido o vencido                                   |
| `PUT /users/me/subscription/plan`          | `403` | `FORBIDDEN`               | Enterprise o `teacher` / `admin`                           |
| `PUT /users/me/subscription/plan`          | `409` | `CONFLICT`                | Mismo plan                                                 |
| `PUT /users/me/subscription/plan`          | `409` | `PAYMENT_METHOD_REQUIRED` | `free → premium` sin método de pago                        |
| `PUT /users/me/subscription/plan`          | `422` | `VALIDATION_ERROR`        | Plan inválido                                              |
| `POST /users/me/subscription/cancellation` | `401` | `UNAUTHENTICATED`         | Token inválido o vencido                                   |
| `POST /users/me/subscription/cancellation` | `403` | `FORBIDDEN`               | `teacher` / `admin`                                        |
| `POST /users/me/subscription/cancellation` | `404` | `NOT_FOUND`               | Sin suscripción activa                                     |
| `POST /users/me/subscription/cancellation` | `409` | `CONFLICT`                | Ya cancelada (`cancelAtPeriodEnd: true`)                   |

Códigos generales en [`_convenciones/errores.md`](../../_convenciones/errores.md).
