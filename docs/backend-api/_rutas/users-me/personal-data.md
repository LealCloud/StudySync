---
resource: users-me-personal-data
methods: [GET, PATCH]
auth: Required
consumers:
  - src/graphql/resolvers/personal-data.ts
source_legacy: "§3.7, §11"
contract_version: v1.3.1
---

# GET/PATCH /users/me/personal-data

Consulta y actualiza los datos personales del usuario autenticado.

## Autenticación

`Required`.

## GET

Devuelve `BackendPersonalData`:

| Campo            | Tipo                   | Descripción                                         |
| :--------------- | :--------------------- | :-------------------------------------------------- |
| `firstName`      | `string`               | Nombre.                                             |
| `lastName`       | `string`               | Apellido.                                           |
| `documentType`   | `DocumentType \| null` | Tipo: `passport` o `dni`.                           |
| `documentId`     | `string \| null`       | Número de documento.                                |
| `phone`          | `string \| null`       | Teléfono en formato E.164.                          |
| `country`        | `string \| null`       | País ISO 3166-1 alpha-2 mayúsculas.                 |
| `address`        | `string \| null`       | Dirección.                                          |
| `identityLocked` | `boolean`              | Indica si los campos de identidad están bloqueados. |

`DocumentType` es el enum cerrado `passport | dni`. Es nullable en la respuesta.

`identityLocked` es solo lectura. Nunca lo envía el cliente (ver [`_convenciones/reglas-transversales.md`](../../_convenciones/reglas-transversales.md), regla 4).

## PATCH

Recibe `BackendUpdatePersonalDataInput` y devuelve el `BackendPersonalData` completo actualizado.

| Campo          | Tipo                   | Descripción                         |
| :------------- | :--------------------- | :---------------------------------- |
| `firstName`    | `string`               | Nombre.                             |
| `lastName`     | `string`               | Apellido.                           |
| `documentType` | `DocumentType \| null` | Tipo: `passport` o `dni`.           |
| `documentId`   | `string \| null`       | Número de documento.                |
| `phone`        | `string \| null`       | Teléfono en formato E.164.          |
| `country`      | `string \| null`       | País ISO 3166-1 alpha-2 mayúsculas. |
| `address`      | `string \| null`       | Dirección.                          |

### Semántica PATCH

Semántica general en [`_convenciones/reglas-transversales.md`](../../_convenciones/reglas-transversales.md):

- Omitir un campo (`undefined`) → no se modifica.
- Enviar `null` → se borra el valor del campo nullable.
- Enviar un valor → se asigna el nuevo valor, sujeto a validación.

### Reglas de validación

Se aplican solo si el campo se envía:

| Campo          | Regla                                                                                       |
| :------------- | :------------------------------------------------------------------------------------------ |
| `firstName`    | 2-100 caracteres. Regex: `^[\p{L}\s'.-]+$` (flag `u`). No acepta `null`.                    |
| `lastName`     | 2-100 caracteres. Regex: `^[\p{L}\s'.-]+$` (flag `u`). No acepta `null`.                    |
| `documentType` | Enum cerrado: `passport` o `dni`.                                                           |
| `documentId`   | 1-30 caracteres. Regex: `^[A-Za-z0-9-]+$`.                                                  |
| `phone`        | Formato E.164 estricto. Regex: `^\+[1-9]\d{1,14}$`. Longitud total entre 8 y 16 caracteres. |
| `country`      | ISO 3166-1 alpha-2 en mayúsculas. Regex: `^[A-Z]{2}$`.                                      |
| `address`      | 1-200 caracteres. Regex: `^[\p{L}\p{N}\s.,\-/#°]+$` (flag `u`).                             |

`phone` exige que el primer dígito tras el `+` no sea `0` (lo impone `^\+[1-9]\d{1,14}$`).

El conjunto exacto de regex está en [`_convenciones/regex.md`](../../_convenciones/regex.md).

### Excepciones

- `firstName` y `lastName` no aceptan `null`; responden `422 VALIDATION_ERROR`.
- `identityLocked` es solo lectura y no se puede modificar mediante este endpoint.

## Bloqueo por `identityLocked`

Cuando `identityLocked` es `true`, quedan bloqueados `firstName`, `lastName`, `documentType` y `documentId`. Los campos `phone`, `country` y `address` siguen siendo editables.

Si el PATCH incluye al menos un campo de identidad bloqueado, el backend rechaza atómicamente toda la operación con `403 FORBIDDEN`; no se aplica ningún campo, incluidos los campos de contacto enviados en el mismo payload. Si solo incluye campos de contacto, se aplica normalmente.

## Errores

| HTTP  | Código             | Cuándo                                                                          |
| ----: | ------------------ | ------------------------------------------------------------------------------- |
| `401` | `UNAUTHENTICATED`  | Token ausente, inválido o vencido                                               |
| `403` | `FORBIDDEN`        | PATCH con campo de identidad e `identityLocked === true`                        |
| `409` | `CONFLICT`         | Reservado por si el backend introduce validaciones de unicidad                  |
| `422` | `VALIDATION_ERROR` | Longitudes, formatos, `null` en `firstName`/`lastName`, `documentType` inválido |

Códigos generales en [`_convenciones/errores.md`](../../_convenciones/errores.md).
