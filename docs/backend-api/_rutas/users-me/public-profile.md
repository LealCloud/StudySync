---
resource: users-userid-profile
methods: [GET]
auth: Optional
consumers:
  - src/graphql/resolvers/user.ts
  - src/graphql/resolvers/profile.ts
source_legacy: "§3.5, §11"
contract_version: v1.3.1
---

# GET /users/:userId/profile

Devuelve el perfil público de un usuario.

## Autenticación

`Optional`. Si llega un Bearer válido, el backend puede utilizar la identidad autenticada para aplicar las reglas de privacidad:

- `profileVisibility`
- `emailVisibility`
- `phoneVisibility`

## Comportamiento

Si el usuario no existe o su perfil no puede mostrarse al solicitante, el backend debe responder:

```text
404
```

El backend no debe responder `200` con `null` en este caso.

El BFF es responsable de traducir ese `404` al comportamiento GraphQL correspondiente, que en este caso es devolver `null`.

## Respuesta

`BackendPublicProfile`:

| Campo                 | Tipo                 |
| --------------------- | -------------------- |
| `id`                  | `string`             |
| `name`                | `string`             |
| `image`               | `string \| null`     |
| `bio`                 | `BackendBio \| null` |
| `interests`           | `string[]`           |
| `email`               | `string \| null`     |
| `phone`               | `string \| null`     |
| `allowDirectMessages` | `boolean`            |

`BackendBio` es el mismo tipo que en [`me.md`](me.md).

## Matriz de visibilidad

Los campos de `BackendPublicProfile` se filtran según la configuración de `PrivacySettings` del usuario consultado (ver [`privacy.md`](privacy.md)):

| Campo de `publicProfile` | Control de visibilidad | Comportamiento                                                                                                         |
| ------------------------ | ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `id`, `name`, `image`    | `profileVisibility`    | Si el solicitante no cumple → `404` (perfil no visible).                                                               |
| `bio`, `interests`       | `profileVisibility`    | Ídem.                                                                                                                  |
| `email`                  | `emailVisibility`      | `everyone` → visible. `authenticated` → visible solo con Bearer válido. `nobody` → `null`.                             |
| `phone`                  | `phoneVisibility`      | Ídem `email`.                                                                                                          |
| `allowDirectMessages`    | —                      | Siempre visible si el perfil es visible.                                                                               |

Reglas:

- `profileVisibility: nobody` → el perfil entero responde `404` (salvo que el solicitante sea el propio usuario; ver [`_convenciones/reglas-transversales.md`](../../_convenciones/reglas-transversales.md), regla 1).
- `emailVisibility: nobody` → `email: null` en la respuesta.
- `phoneVisibility: nobody` → `phone: null` en la respuesta.
- `allowDirectMessages` no se filtra por visibilidad individual. Si el perfil es visible, el campo se expone.

## Errores

| HTTP  | Código      | Cuándo                                                  |
| ----: | ----------- | ------------------------------------------------------- |
| `404` | `NOT_FOUND` | Usuario inexistente o perfil no visible para el solicitante |

Códigos generales en [`_convenciones/errores.md`](../../_convenciones/errores.md).
