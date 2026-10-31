---
resource: users-me-privacy
methods: [GET, PATCH]
auth: Required
consumers:
  - src/graphql/resolvers/privacy.ts
source_legacy: "§5.5, §11"
contract_version: v1.3.1
---

# GET/PATCH /users/me/privacy

Consulta y actualiza la configuración de privacidad del usuario autenticado.

## Autenticación

`Required`.

## GET

Devuelve `BackendPrivacySettings`:

| Campo                 | Tipo                |
| :-------------------- | :------------------ |
| `profileVisibility`   | `ProfileVisibility` |
| `emailVisibility`     | `ProfileVisibility` |
| `phoneVisibility`     | `ProfileVisibility` |
| `allowDirectMessages` | `boolean`           |

`ProfileVisibility` es el enum cerrado `everyone | authenticated | nobody`.

## PATCH

Recibe `BackendUpdatePrivacySettingsInput` y devuelve el `BackendPrivacySettings` completo actualizado.

| Campo                 | Tipo                |
| :-------------------- | :------------------ |
| `profileVisibility`   | `ProfileVisibility` |
| `emailVisibility`     | `ProfileVisibility` |
| `phoneVisibility`     | `ProfileVisibility` |
| `allowDirectMessages` | `boolean`           |

### Semántica PATCH

| Valor enviado               | Efecto                                                                  |
| :-------------------------- | :---------------------------------------------------------------------- |
| Campo omitido (`undefined`) | No se modifica.                                                         |
| `null`                      | **Rechazado con `422 VALIDATION_ERROR`**. Excepción a la regla general. |
| Valor concreto              | Se asigna.                                                              |

Motivo de la excepción: todos los campos de `PrivacySettings` son obligatorios en la respuesta (`ProfileVisibility!`, `Boolean!`) y no tienen estado vacío válido. Regla general en [`_convenciones/reglas-transversales.md`](../../_convenciones/reglas-transversales.md).

### Reglas

| Campo                 | Regla                                                   |
| :-------------------- | :------------------------------------------------------ |
| `profileVisibility`   | Enum cerrado `everyone` \| `authenticated` \| `nobody`. |
| `emailVisibility`     | Ídem.                                                   |
| `phoneVisibility`     | Ídem.                                                   |
| `allowDirectMessages` | Boolean. `null` → `422`.                                |

### Efecto en `publicProfile`

Esta configuración determina la matriz de visibilidad de `GET /users/:userId/profile` (ver [`public-profile.md`](public-profile.md)).

`allowDirectMessages` se expone también en `BackendPublicProfile` para que otros usuarios sepan si pueden escribir.

## Errores

| HTTP  | Código             | Cuándo                                           |
| ----: | ------------------ | ------------------------------------------------ |
| `401` | `UNAUTHENTICATED`  | Token ausente, inválido o vencido                |
| `422` | `VALIDATION_ERROR` | Visibilidad inválida o `null` en cualquier campo |

Códigos generales en [`_convenciones/errores.md`](../../_convenciones/errores.md).
