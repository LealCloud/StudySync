---
resource: users-me-profile
methods: [PATCH]
auth: Required
consumers:
  - src/graphql/resolvers/profile.ts
  - src/app/[locale]/(web)/dashboard/user-settings/ProfileAvatarSettings.tsx
source_legacy: "§3.6, §11"
contract_version: v1.3.1
---

# PATCH /users/me/profile

Actualiza parcialmente el perfil del usuario autenticado.

## Autenticación

`Required`.

## Cuerpo

`BackendUpdateProfileInput`, una actualización parcial con los siguientes campos opcionales:

| Campo       | Tipo                 | Descripción                                                                                   |
| :---------- | :------------------- | :-------------------------------------------------------------------------------------------- |
| `bio`       | `BackendBio \| null` | Objeto con el título y la descripción biográfica del usuario, o `null` si no tiene biografía. |
| `interests` | `string[] \| null`   | Lista de intereses. Se reemplaza completa cuando se envía.                                    |
| `image`     | `string \| null`     | URL o data URI de la imagen de perfil del usuario.                                            |

## Semántica PATCH

Semántica general en [`_convenciones/reglas-transversales.md`](../../_convenciones/reglas-transversales.md):

- Omitir el campo (`undefined`) → no se modifica.
- Enviar `null` → se borra el valor, según el nivel del campo.
- Enviar un valor → se asigna el nuevo valor.

### Dentro de `bio`

`bio` es un objeto cuyos campos `title` y `description` son nullable (`string | null`). Ambos siguen la semántica PATCH parcial de forma individual.

Para `title`:

- Omitir `title` → no se modifica el título actual.
- Enviar `title: null` → el título queda sin valor.
- Enviar `title: "..."` → se asigna el nuevo título.

Para `description`: mismo comportamiento.

El objeto `bio` completo también admite `null`:

- Omitir `bio` → no se modifica la biografía.
- Enviar `bio: null` → se elimina la biografía completa.
- Enviar un objeto `bio` → se actualizan únicamente los campos enviados, respetando la semántica PATCH individual.

## Reglas de validación

Se aplican solo si el campo se envía. Si el campo se omite, no se modifica.

| Campo             | Regla                                                                                                                                     |
| :---------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| `bio.title`       | Entre 1 y 100 caracteres cuando no es `null`.                                                                                             |
| `bio.description` | Entre 1 y 500 caracteres cuando no es `null`.                                                                                             |
| `interests`       | Máximo 20 elementos. Cada elemento debe tener entre 1 y 40 caracteres.                                                                    |
| `image`           | Ver "Formato de `image`" abajo.                                                                                                           |

## Formato de `image`

El campo `image` acepta:

- Una URL absoluta `http` o `https`. Regex: `^https?:\/\/[^\s]+$` (flag `i`).
- Una URL protocol-relative (`//…`). Regex: `^\/\/[^\s]+$`.
- Un data URI de imagen con payload base64 explícito. Regex: `^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$`.
- `null` para indicar que el usuario no tiene imagen.

Un data URI sin `;base64,` explícito **no** es válido según este contrato. Un data URI con payload no base64 **no** es válido.

El backend decide cómo persistir el valor (CDN, almacenamiento propio, base64). El contrato no impone un mecanismo de subida específico.

Si el cliente necesita subir un archivo binario, debe resolverlo antes de llamar a este endpoint; por ejemplo, subir el archivo a un servicio de almacenamiento y enviar la URL resultante aquí.

> **Nota (mejora futura, no bloquea):** el flujo actual acepta data URIs en
> el campo `image`. Esto implica payloads potencialmente grandes (una imagen
> de 4 MB en base64 ≈ 5.3 MB de body). A futuro se recomienda exponer un
> endpoint de subida dedicado (`POST /users/me/avatar` o similar) que
> devuelva una URL, y dejar `image` en este endpoint limitado a URLs.

## Ejemplos

**Actualizar únicamente la biografía**, sin modificar la imagen ni los intereses:

```json
{
  "bio": {
    "title": "Nuevo título",
    "description": "Nueva descripción"
  }
}
```

**Actualizar solo el título**, sin modificar la descripción:

```json
{
  "bio": {
    "title": "Título actualizado"
  }
}
```

**Borrar únicamente el título**, conservando la descripción:

```json
{
  "bio": {
    "title": null
  }
}
```

**Borrar la biografía completa:**

```json
{
  "bio": null
}
```

**Borrar la imagen de perfil:**

```json
{
  "image": null
}
```

**Borrar todos los intereses:**

```json
{
  "interests": null
}
```

La respuesta es `BackendUser` con el perfil completo actualizado (ver [`me.md`](me.md)).

## Errores

| HTTP  | Código             | Cuándo                                    |
| ----: | ------------------ | ----------------------------------------- |
| `401` | `UNAUTHENTICATED`  | Token ausente, inválido o vencido         |
| `422` | `VALIDATION_ERROR` | Longitudes, formatos o `image` no válidos |

Códigos generales en [`_convenciones/errores.md`](../../_convenciones/errores.md).
