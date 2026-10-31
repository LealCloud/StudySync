---
resource: users-me-preferences
methods: [GET, PATCH]
auth: Required
consumers:
  - src/graphql/resolvers/preferences.ts
source_legacy: "§8, §8.1, §11"
contract_version: v1.3.1
---

# GET/PATCH /users/me/preferences

Consulta y actualiza las preferencias del usuario autenticado.

## Autenticación

`Required`.

## GET

Devuelve `BackendPreferences`:

| Campo           | Tipo                        |
| :-------------- | :-------------------------- |
| `language`      | `string`                    |
| `theme`         | `Theme`                     |
| `timezone`      | `string`                    |
| `notifications` | `NotificationPreferences`   |
| `accessibility` | `AccessibilityPreferences`  |

Valores válidos:

| Campo      | Valores                                                   |
| ---------- | --------------------------------------------------------- |
| `language` | `es`, `en`                                                |
| `theme`    | `system`, `light`, `dark`                                 |
| `timezone` | Cualquier zona horaria IANA, por ejemplo `America/Bogota` |

Un valor no soportado responde `422 VALIDATION_ERROR`.

## PATCH

Recibe `BackendUpdatePreferencesInput` y devuelve el `BackendPreferences` completo actualizado.

| Campo           | Tipo                        |
| :-------------- | :-------------------------- |
| `language`      | `string`                    |
| `theme`         | `Theme`                     |
| `timezone`      | `string`                    |
| `notifications` | `NotificationPreferences`   |
| `accessibility` | `AccessibilityPreferences`  |

### Excepción: no admite `null`

A diferencia del resto del contrato, `PATCH /users/me/preferences` **no admite `null` en ningún campo**. Todos los campos de `Preferences` son obligatorios en la respuesta y no tienen un estado "vacío" válido:

- `language: String!`
- `theme: Theme!`
- `timezone: String!`
- `notifications: NotificationPreferences!`
- `accessibility: AccessibilityPreferences!`

Enviar `null` en cualquier campo de `UpdatePreferencesInput` (incluidos `notifications` y `accessibility`) responde `422 VALIDATION_ERROR`.

Para no modificar un campo, se omite (`undefined`). Enviar `notifications: {}` (objeto vacío) equivale a omitirlo: no modifica ningún subcampo.

### Validación adicional

- `language` debe ser uno de los locales soportados por el frontend (`es`, `en`). Un valor fuera de esa lista responde `422 VALIDATION_ERROR`.
- `theme` debe ser `system`, `light` o `dark`.
- `timezone` debe ser una zona horaria IANA válida.

El BFF (`src/graphql/resolvers/preferences.ts`) valida `null` y `language` antes de llamar al backend. El backend vuelve a validar como defensa en profundidad.

## Errores

| HTTP  | Código             | Cuándo                                                               |
| ----: | ------------------ | -------------------------------------------------------------------- |
| `401` | `UNAUTHENTICATED`  | Token ausente, inválido o vencido                                    |
| `422` | `VALIDATION_ERROR` | Idioma, tema o zona horaria no soportados; `null` en cualquier campo |

Códigos generales en [`_convenciones/errores.md`](../../_convenciones/errores.md).
