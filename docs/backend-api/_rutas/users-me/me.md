---
resource: users-me
methods: [GET]
auth: Required
consumers:
  - src/graphql/resolvers/user.ts
  - src/components/layout/dashboard/sidebar/useSidebarData.ts
  - src/app/[locale]/(web)/dashboard/user-settings/ProfileSection.tsx
source_legacy: "§3.1, §3.9, §10"
contract_version: v1.3.1
---

# GET /users/me

Devuelve el usuario autenticado. Es la fuente de `id`, `name`, `email`, `image`, `role` y `profile` para el dashboard.

## Autenticación

`Required`. El backend identifica al usuario por el Access Token. Nunca acepta un `userId` para decidir quién es el usuario actual (ver [`_convenciones/reglas-transversales.md`](../../_convenciones/reglas-transversales.md), regla 1).

## Respuesta

`BackendUser`:

| Campo     | Tipo                 | Descripción                                  |
| --------- | -------------------- | -------------------------------------------- |
| `id`      | `string`             | Identificador único del usuario              |
| `name`    | `string`             | Nombre completo (derivado de `firstName` + `lastName`) |
| `email`   | `string`             | Correo electrónico                           |
| `image`   | `string \| null`     | URL o data URI de la imagen de perfil        |
| `role`    | `string`             | `student` \| `teacher` \| `admin`            |
| `profile` | `BackendProfile`     | Bio e intereses del usuario                  |

`BackendProfile`:

| Campo       | Tipo                  | Descripción                          |
| ----------- | --------------------- | ------------------------------------ |
| `bio`       | `BackendBio \| null`  | Título y descripción biográfica      |
| `interests` | `string[]`            | Lista de intereses                   |

`BackendBio`:

| Campo         | Tipo             |
| ------------- | ---------------- |
| `title`       | `string \| null` |
| `description` | `string \| null` |

`id` debe coincidir con el que devuelve `POST /auth/login` en `data.id` (ver [`../auth/login.md`](../auth/login.md)).

## Relación con otros archivos

- [`profile.md`](profile.md) documenta la actualización de `image`, `bio` e `interests`.
- [`public-profile.md`](public-profile.md) documenta la vista pública de un usuario por `userId`.
- [`subscription.md`](subscription.md) documenta el plan del usuario (usado por el sidebar).
- [`account.md`](account.md) documenta el estado de cuenta (usado por el sidebar).

## Errores

| HTTP  | Código            | Cuándo                                |
| ----: | ----------------- | ------------------------------------- |
| `401` | `UNAUTHENTICATED` | Token ausente, inválido o vencido     |

Códigos generales en [`_convenciones/errores.md`](../../_convenciones/errores.md).
