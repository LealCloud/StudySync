---
kind: index
source_legacy: '§10, §13'
contract_version: v1.3.1
---

# Contrato de API del backend — v1.3.1

Este directorio es el **contrato formal de integración** entre el frontend/BFF y el backend. Define lo que ambas partes deben implementar y cómo deben interactuar.

Es la **fuente de verdad única** del contrato. Cualquier cambio debe reflejarse primero aquí y después en el código del frontend (`src/lib/backend/types.ts`, el schema GraphQL y `RestBackendClient`).

El contrato puede implementarse en dos modos: contra un backend real (`rest`) o contra una implementación controlada que no requiere backend (`mock`). Ambos modos deben cumplir exactamente este contrato. Ver [`_convenciones/arquitectura.md`](_convenciones/arquitectura.md).

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
│   │   ├── login.md
│   │   ├── refresh.md
│   │   ├── logout.md
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
│       │   ├── two-factor.md
│       │   └── sessions.md
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

## Resumen de los 36 endpoints

|   # | Método | Ruta                                         | Auth     | Archivo                                                                                |
| --: | ------ | -------------------------------------------- | -------- | -------------------------------------------------------------------------------------- |
|   1 | POST   | `/auth/login`                                | None     | [`_rutas/auth/login.md`](_rutas/auth/login.md)                                         |
|   2 | POST   | `/auth/refresh`                              | None     | [`_rutas/auth/refresh.md`](_rutas/auth/refresh.md)                                     |
|   3 | POST   | `/auth/logout`                               | None     | [`_rutas/auth/logout.md`](_rutas/auth/logout.md)                                       |
|   4 | POST   | `/auth/register`                             | None     | [`_rutas/auth/register.md`](_rutas/auth/register.md)                                   |
|   5 | POST   | `/auth/forgot-password`                      | None     | [`_rutas/auth/forgot-password.md`](_rutas/auth/forgot-password.md)                     |
|   6 | POST   | `/auth/validate-reset-token`                 | None     | [`_rutas/auth/validate-reset-token.md`](_rutas/auth/validate-reset-token.md)           |
|   7 | POST   | `/auth/reset-password`                       | None     | [`_rutas/auth/reset-password.md`](_rutas/auth/reset-password.md)                       |
|   8 | POST   | `/contact`                                   | None     | [`_rutas/contact.md`](_rutas/contact.md)                                               |
|   9 | GET    | `/users/me`                                  | Required | [`_rutas/users-me/me.md`](_rutas/users-me/me.md)                                       |
|  10 | GET    | `/users/:userId/profile`                     | Optional | [`_rutas/users-me/public-profile.md`](_rutas/users-me/public-profile.md)               |
|  11 | PATCH  | `/users/me/profile`                          | Required | [`_rutas/users-me/profile.md`](_rutas/users-me/profile.md)                             |
|  12 | GET    | `/users/me/personal-data`                    | Required | [`_rutas/users-me/personal-data.md`](_rutas/users-me/personal-data.md)                 |
|  13 | PATCH  | `/users/me/personal-data`                    | Required | [`_rutas/users-me/personal-data.md`](_rutas/users-me/personal-data.md)                 |
|  14 | GET    | `/users/me/privacy`                          | Required | [`_rutas/users-me/privacy.md`](_rutas/users-me/privacy.md)                             |
|  15 | PATCH  | `/users/me/privacy`                          | Required | [`_rutas/users-me/privacy.md`](_rutas/users-me/privacy.md)                             |
|  16 | GET    | `/users/me/security`                         | Required | [`_rutas/users-me/security/index.md`](_rutas/users-me/security/index.md)               |
|  17 | POST   | `/users/me/security/email-change`            | Required | [`_rutas/users-me/security/email-change.md`](_rutas/users-me/security/email-change.md) |
|  18 | PUT    | `/users/me/security/password`                | Required | [`_rutas/users-me/security/password.md`](_rutas/users-me/security/password.md)         |
|  19 | POST   | `/users/me/security/two-factor/setup`        | Required | [`_rutas/users-me/security/two-factor.md`](_rutas/users-me/security/two-factor.md)     |
|  20 | POST   | `/users/me/security/two-factor/verify`       | Required | [`_rutas/users-me/security/two-factor.md`](_rutas/users-me/security/two-factor.md)     |
|  21 | POST   | `/users/me/security/two-factor/disable`      | Required | [`_rutas/users-me/security/two-factor.md`](_rutas/users-me/security/two-factor.md)     |
|  22 | DELETE | `/users/me/security/sessions/:sessionId`     | Required | [`_rutas/users-me/security/sessions.md`](_rutas/users-me/security/sessions.md)         |
|  23 | DELETE | `/users/me/security/sessions`                | Required | [`_rutas/users-me/security/sessions.md`](_rutas/users-me/security/sessions.md)         |
|  24 | GET    | `/users/me/preferences`                      | Required | [`_rutas/users-me/preferences.md`](_rutas/users-me/preferences.md)                     |
|  25 | PATCH  | `/users/me/preferences`                      | Required | [`_rutas/users-me/preferences.md`](_rutas/users-me/preferences.md)                     |
|  26 | GET    | `/users/me/account`                          | Required | [`_rutas/users-me/account.md`](_rutas/users-me/account.md)                             |
|  27 | POST   | `/users/me/account/deactivation`             | Required | [`_rutas/users-me/account.md`](_rutas/users-me/account.md)                             |
|  28 | DELETE | `/users/me/account/deactivation`             | Required | [`_rutas/users-me/account.md`](_rutas/users-me/account.md)                             |
|  29 | GET    | `/users/me/courses`                          | Required | [`_rutas/users-me/courses.md`](_rutas/users-me/courses.md)                             |
|  30 | GET    | `/users/me/certificates`                     | Required | [`_rutas/users-me/certificates.md`](_rutas/users-me/certificates.md)                   |
|  31 | GET    | `/users/me/subscription`                     | Required | [`_rutas/users-me/subscription.md`](_rutas/users-me/subscription.md)                   |
|  32 | PUT    | `/users/me/subscription/plan`                | Required | [`_rutas/users-me/subscription.md`](_rutas/users-me/subscription.md)                   |
|  33 | POST   | `/users/me/subscription/cancellation`        | Required | [`_rutas/users-me/subscription.md`](_rutas/users-me/subscription.md)                   |
|  34 | GET    | `/users/me/payment-methods`                  | Required | [`_rutas/users-me/payment-methods.md`](_rutas/users-me/payment-methods.md)             |
|  35 | DELETE | `/users/me/payment-methods/:paymentMethodId` | Required | [`_rutas/users-me/payment-methods.md`](_rutas/users-me/payment-methods.md)             |
|  36 | GET    | `/users/me/invoices`                         | Required | [`_rutas/users-me/invoices.md`](_rutas/users-me/invoices.md)                           |

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
