---
kind: convention
source_legacy: '§15'
contract_version: v1.3.1
---

# Regex de referencia

Tabla consolidada de los regex que el backend debe implementar. Fuente de verdad: `src/lib/schemas/primitives.ts`. Si hay divergencia entre esta tabla y el código, el código manda y el contrato debe actualizarse. Las secciones de cada ruta ([`_rutas/**`](../README.md#resumen-de-los-36-endpoints)) son la fuente de verdad por endpoint.

Los regex que contienen pipes (`|`) o barras invertidas (`\`) se presentan en bloques de código para que sean copiables sin ambigüedad de Markdown.

| Campo / Regla                   | Regex                                                  | Notas                            |
| :------------------------------ | :----------------------------------------------------- | :------------------------------- |
| `firstName`, `lastName`         | `^[\p{L}\s'.-]+$`                                      | Flag `u`. Acepta letras Unicode. |
| `email`                         | `^[^\s@]+@[^\s@]+\.[^\s@]+$`                           | Tras `trim()` + `toLowerCase()`. |
| `password`, `newPassword`       | ver bloque de código debajo                            | Combinado con longitud 6-15.     |
| `contactNumber` / `phone`       | `^\+[1-9]\d{1,14}$`                                    | Longitud total 8-16 caracteres.  |
| `documentId`                    | `^[A-Za-z0-9-]+$`                                      | Longitud 1-30.                   |
| `country`                       | `^[A-Z]{2}$`                                           | ISO 3166-1 alpha-2.              |
| `address`                       | `^[\p{L}\p{N}\s.,\-/#°]+$`                             | Flag `u`.                        |
| `subject` (contacto)            | `^[^<>{}]*$`                                           | Longitud 5-150.                  |
| `message` (contacto)            | `^[^<>]*$`                                             | Longitud 20-2000.                |
| `image` — URL absoluta          | `^https?:\/\/[^\s]+$`                                  | Flag `i`.                        |
| `image` — URL protocol-relative | `^\/\/[^\s]+$`                                         |                                  |
| `image` — data URI              | `^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$` | Exige `;base64,` explícito.      |
| `code` (2FA)                    | `^\d{6}$`                                              |                                  |
| `language`                      | ver bloque de código debajo                            |                                  |
| `theme`                         | ver bloque de código debajo                            |                                  |

---

## Regex de `password` / `newPassword`

```regex
^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+=\-[\]{};:'",.<>/?\\|`~])
```

Combinado con longitud entre 6 y 15 caracteres. El conjunto exacto de caracteres especiales aceptados es:

`!@#$%^&*()_+-=[]{};:'",.<>/?\|` `` ` `` `~`

---

## Regex de `language`

```regex
^(es|en)$
```

---

## Regex de `theme`

```regex
^(system|light|dark)$
```

---

## Nota

Esta tabla es informativa. Las secciones de cada ruta ([`_rutas/**`](../README.md#resumen-de-los-36-endpoints)) son la fuente de verdad por endpoint.
