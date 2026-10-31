---
resource: users-me-account
methods: [GET, POST, DELETE]
auth: Required
consumers:
  - src/graphql/resolvers/account.ts
  - src/components/layout/dashboard/sidebar/useSidebarData.ts
source_legacy: "§5, §11"
contract_version: v1.3.1
---

# /users/me/account

Estado de la cuenta del usuario autenticado y gestión de su desactivación.

## Autenticación

`Required` en los tres endpoints.

## GET /users/me/account

Devuelve `BackendAccount`:

| Campo                     | Tipo                  |
| :------------------------ | :-------------------- |
| `status`                  | `AccountStatus`       |
| `deactivationScheduledAt` | `string \| null` (ISO 8601) |

`AccountStatus` es el enum cerrado:

```text
active
pending_deactivation
suspended
inactive
```

Significado:

| Estado                 | Significado                                                          | Autoasignable desde User Settings             |
| :--------------------- | :------------------------------------------------------------------- | :-------------------------------------------- |
| `active`               | Cuenta operativa.                                                    | —                                             |
| `pending_deactivation` | Desactivación solicitada; dentro del período de gracia.              | ✅ vía `POST .../deactivation`.               |
| `suspended`            | Suspendida por un administrador. El usuario no puede iniciar sesión. | ❌ La asigna un admin.                        |
| `inactive`             | Cuenta cerrada definitivamente tras el período de gracia.            | ❌ La asigna el backend (proceso automático). |

`deactivationScheduledAt` es la fecha exacta en que la cuenta pasará a `inactive`. El usuario necesita saber cuándo para poder cancelar a tiempo.

El sidebar consume `myAccount.status` para el estado de la cuenta (ver [`me.md`](me.md), sección "Relación con otros archivos").

## POST /users/me/account/deactivation

Solicita la desactivación de la cuenta.

- Cambia la cuenta a `pending_deactivation`.
- Devuelve `deactivationScheduledAt`.
- Si la cuenta no está `active`, responde `409 CONFLICT`.

La duración del período de gracia la determina el backend.

### Autorización por rol

`403 FORBIDDEN` para `teacher` y `admin`.

Motivo: `teacher` y `admin` son perfiles operativos. Su baja la gestiona un administrador o el área de TI, no el propio usuario.

El BFF bloquea con `403` si `session.user.role !== 'student'`, sin llamar al backend. El backend también responde `403` como defensa en profundidad.

## DELETE /users/me/account/deactivation

Cancela la desactivación.

- Devuelve la cuenta a `active`.
- Solo funciona mientras la cuenta esté en `pending_deactivation`.
- En cualquier otro estado responde `409 CONFLICT`.

### Autorización por rol

`403 FORBIDDEN` para `teacher` y `admin`, con el mismo criterio que `POST`.

## Respuesta

Los tres endpoints devuelven `BackendAccount` completo.

## Errores

| Endpoint                                | HTTP  | Código             | Cuándo                                                     |
| :-------------------------------------- | ----: | ------------------ | ---------------------------------------------------------- |
| `GET /users/me/account`                 | `401` | `UNAUTHENTICATED`  | Token inválido o vencido                                   |
| `POST /users/me/account/deactivation`   | `401` | `UNAUTHENTICATED`  | Token inválido o vencido                                   |
| `POST /users/me/account/deactivation`   | `403` | `FORBIDDEN`        | `teacher` / `admin`                                        |
| `POST /users/me/account/deactivation`   | `409` | `CONFLICT`         | La cuenta no está `active`                                 |
| `DELETE /users/me/account/deactivation` | `401` | `UNAUTHENTICATED`  | Token inválido o vencido                                   |
| `DELETE /users/me/account/deactivation` | `403` | `FORBIDDEN`        | `teacher` / `admin`                                        |
| `DELETE /users/me/account/deactivation` | `409` | `CONFLICT`         | La cuenta no está `pending_deactivation`                   |

Códigos generales en [`_convenciones/errores.md`](../../_convenciones/errores.md).
