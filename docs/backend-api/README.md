---
kind: index
source_legacy: '§10, §13'
contract_version: v2.0
---

# Contrato interno de métodos — v2.0

Este directorio es el **contrato formal** de las operaciones internas del monolito. Define qué operaciones expone la capa de dominio, con qué tipos, qué códigos de error y qué reglas aplican a cada una.

Es la **fuente de verdad única** del contrato. Cualquier cambio debe reflejarse primero aquí y después en el código (`src/lib/backend/types.ts`, `src/lib/domain/`, el schema GraphQL y `LocalBackendClient`).

El contrato puede implementarse en dos modos: contra la base de datos PostgreSQL del monolito (`local`) o contra una implementación en memoria que no requiere base de datos (`mock`). Ambos modos deben cumplir exactamente este contrato. Ver [`_convenciones/arquitectura.md`](_convenciones/arquitectura.md).

---

## Mapa jerárquico

```
docs/backend-api/
├── README.md                              ← este archivo
│
├── _convenciones/
│   ├── arquitectura.md
│   ├── autenticacion.md
│   ├── errores.md
│   ├── reglas-transversales.md
│   └── regex.md
│
├── _rutas/
│   ├── auth/
│   │   ├── login.md                       (interno, consumido por Auth.js)
│   │   ├── register.md
│   │   ├── forgot-password.md
│   │   ├── validate-reset-token.md
│   │   └── reset-password.md
│   │
│   ├── contact.md
│   │
│   └── users-me/
│       ├── me.md
│       ├── public-profile.md
│       ├── profile.md
│       ├── personal-data.md
│       ├── privacy.md
│       ├── preferences.md
│       ├── security/
│       │   ├── index.md
│       │   ├── email-change.md
│       │   ├── password.md
│       │   └── two-factor.md
│       ├── account.md
│       ├── courses.md
│       ├── certificates.md
│       ├── subscription.md
│       ├── payment-methods.md
│       └── invoices.md
│
└── _historico/
    ├── historial-cambios.md
    └── migracion.md
```

---

## Resumen de los 31 métodos de dominio

La columna `Categoría` distingue `query` (lectura) de `mutation` (escritura). La columna `Ruta` es el identificador estable del método en el contrato (`docs/backend-api/_rutas/`).

|   # | Categoría | Ruta                                         | Auth     | Archivo                                                                                |
| --: | --------- | -------------------------------------------- | -------- | -------------------------------------------------------------------------------------- |
|   1 | mutation  | `/auth/register`                             | None     | [`_rutas/auth/register.md`](_rutas/auth/register.md)                                   |
|   2 | mutation  | `/auth/forgot-password`                      | None     | [`_rutas/auth/forgot-password.md`](_rutas/auth/forgot-password.md)                     |
|   3 | mutation  | `/auth/validate-reset-token`                 | None     | [`_rutas/auth/validate-reset-token.md`](_rutas/auth/validate-reset-token.md)           |
|   4 | mutation  | `/auth/reset-password`                       | None     | [`_rutas/auth/reset-password.md`](_rutas/auth/reset-password.md)                       |
|   5 | mutation  | `/contact`                                   | None     | [`_rutas/contact.md`](_rutas/contact.md)                                               |
|   6 | query     | `/users/me`                                  | Required | [`_rutas/users-me/me.md`](_rutas/users-me/me.md)                                       |
|   7 | query     | `/users/:userId/profile`                     | Optional | [`_rutas/users-me/public-profile.md`](_rutas/users-me/public-profile.md)               |
|   8 | mutation  | `/users/me/profile`                          | Required | [`_rutas/users-me/profile.md`](_rutas/users-me/profile.md)                             |
|   9 | query     | `/users/me/personal-data`                    | Required | [`_rutas/users-me/personal-data.md`](_rutas/users-me/personal-data.md)                 |
|  10 | mutation  | `/users/me/personal-data`                    | Required | [`_rutas/users-me/personal-data.md`](_rutas/users-me/personal-data.md)                 |
|  11 | query     | `/users/me/privacy`                          | Required | [`_rutas/users-me/privacy.md`](_rutas/users-me/privacy.md)                             |
|  12 | mutation  | `/users/me/privacy`                          | Required | [`_rutas/users-me/privacy.md`](_rutas/users-me/privacy.md)                             |
|  13 | query     | `/users/me/security`                         | Required | [`_rutas/users-me/security/index.md`](_rutas/users-me/security/index.md)               |
|  14 | mutation  | `/users/me/security/email-change`            | Required | [`_rutas/users-me/security/email-change.md`](_rutas/users-me/security/email-change.md) |
|  15 | mutation  | `/users/me/security/password`                | Required | [`_rutas/users-me/security/password.md`](_rutas/users-me/security/password.md)         |
|  16 | mutation  | `/users/me/security/two-factor/setup`        | Required | [`_rutas/users-me/security/two-factor.md`](_rutas/users-me/security/two-factor.md)     |
|  17 | mutation  | `/users/me/security/two-factor/verify`       | Required | [`_rutas/users-me/security/two-factor.md`](_rutas/users-me/security/two-factor.md)     |
|  18 | mutation  | `/users/me/security/two-factor/disable`      | Required | [`_rutas/users-me/security/two-factor.md`](_rutas/users-me/security/two-factor.md)     |
|  19 | query     | `/users/me/preferences`                      | Required | [`_rutas/users-me/preferences.md`](_rutas/users-me/preferences.md)                     |
|  20 | mutation  | `/users/me/preferences`                      | Required | [`_rutas/users-me/preferences.md`](_rutas/users-me/preferences.md)                     |
|  21 | query     | `/users/me/account`                          | Required | [`_rutas/users-me/account.md`](_rutas/users-me/account.md)                             |
|  22 | mutation  | `/users/me/account/deactivation`             | Required | [`_rutas/users-me/account.md`](_rutas/users-me/account.md)                             |
|  23 | mutation  | `/users/me/account/deactivation`             | Required | [`_rutas/users-me/account.md`](_rutas/users-me/account.md)                             |
|  24 | query     | `/users/me/courses`                          | Required | [`_rutas/users-me/courses.md`](_rutas/users-me/courses.md)                             |
|  25 | query     | `/users/me/certificates`                     | Required | [`_rutas/users-me/certificates.md`](_rutas/users-me/certificates.md)                   |
|  26 | query     | `/users/me/subscription`                     | Required | [`_rutas/users-me/subscription.md`](_rutas/users-me/subscription.md)                   |
|  27 | mutation  | `/users/me/subscription/plan`                | Required | [`_rutas/users-me/subscription.md`](_rutas/users-me/subscription.md)                   |
|  28 | mutation  | `/users/me/subscription/cancellation`        | Required | [`_rutas/users-me/subscription.md`](_rutas/users-me/subscription.md)                   |
|  29 | query     | `/users/me/payment-methods`                  | Required | [`_rutas/users-me/payment-methods.md`](_rutas/users-me/payment-methods.md)             |
|  30 | mutation  | `/users/me/payment-methods/:paymentMethodId` | Required | [`_rutas/users-me/payment-methods.md`](_rutas/users-me/payment-methods.md)             |
|  31 | query     | `/users/me/invoices`                         | Required | [`_rutas/users-me/invoices.md`](_rutas/users-me/invoices.md)                           |

---

## Autorización por rol

La columna `Auth` indica el nivel de autenticación, no de autorización. La autorización por rol se aplica en el backend y se refuerza en el BFF:

| Endpoint(s)                                  | Roles permitidos              | Respuesta para roles no permitidos |
| :------------------------------------------- | :---------------------------- | :--------------------------------- |
| `POST/DELETE /users/me/account/deactivation` | `student`                     | `403 FORBIDDEN`                    |
| `GET /users/me/courses`                      | `student`                     | `403 FORBIDDEN`                    |
| `GET /users/me/certificates`                 | `student`                     | `403 FORBIDDEN`                    |
| Billing (todas las rutas)                    | `student`                     | `403 FORBIDDEN`                    |
| `POST /users/me/security/two-factor/disable` | `student`                     | `403 FORBIDDEN`                    |
| Resto de endpoints de settings               | `student`, `teacher`, `admin` | —                                  |

El BFF bloquea con `403` antes de llamar al backend cuando corresponde. El backend vuelve a validar como defensa en profundidad. Ver [`_convenciones/errores.md`](_convenciones/errores.md).

---

## Relación con el frontend

La fuente de verdad es este contrato ([`docs/backend-api/`](README.md), `v1.3.1`).

```
docs/backend-api/ (este directorio)
      ↓
Contrato REST
      ↓
src/lib/backend/types.ts
      ↓
Representación TypeScript del contrato
      ↓
RestBackendClient
```

- Este directorio define el contrato.
- `src/lib/backend/types.ts` representa ese contrato en TypeScript.
- `RestBackendClient` implementa las llamadas al contrato.
- Los resolvers GraphQL consumen `BackendClient`, no conocen directamente los detalles de REST.

Los tipos `Backend*` **no son la fuente de verdad del contrato**.

---

## Versionado

- **v1.3.1** — versión actual. Ver [`_historico/historial-cambios.md`](_historico/historial-cambios.md).
- Cualquier cambio incompatible debe generar una nueva versión.
- El historial completo de v1 a v1.3.1 está en [`_historico/historial-cambios.md`](_historico/historial-cambios.md).
- La migración desde el backend previo está en [`_historico/migracion.md`](_historico/migracion.md).
