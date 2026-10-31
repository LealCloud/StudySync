---
kind: history
source_legacy: "§14"
contract_version: v1.3.1
---

# Apéndice: migración desde el backend previo

El backend previo usaba nombres de campos en español y una ruta distinta a la del contrato `v1`.

## Nombres de campos

### Respuesta de `POST /auth/login` (dentro de `data`)

| Antes       | Ahora       |
| ----------- | ----------- |
| `nombre`    | `firstName` |
| `apellidos` | `lastName`  |
| `uuid`      | `id`        |
| `rol`       | `role`      |

Los campos del par de tokens no cambian: `token`, `refreshToken`, `expiresIn` y `refreshExpiresIn`.

Nota v1.2: `firstName`, `lastName`, `subscription` e `image` dejan de formar parte de la respuesta de login. Ver [`../_rutas/auth/login.md`](../_rutas/auth/login.md) y [`../_convenciones/autenticacion.md`](../_convenciones/autenticacion.md).

### Cuerpo de `POST /auth/register`

| Antes        | Ahora       |
| ------------ | ----------- |
| `nombre`     | `firstName` |
| `apellidos`  | `lastName`  |
| `contrasena` | `password`  |

`email` no cambia.

## Rutas

| Antes               | Ahora           |
| :------------------ | :-------------- |
| `POST /api/contact` | `POST /contact` |

## Despliegue

Estos cambios **no son compatibles hacia atrás**.

El frontend y el backend deben desplegarse a la vez. El frontend rechaza una respuesta de login que no use los nombres nuevos, así que si solo se despliega uno de los dos nadie podrá iniciar sesión ni registrarse.

Nota v1.2: los cambios de v1.2 sí son compatibles hacia atrás para el backend. Un backend que siga respondiendo `firstName`, `lastName`, `subscription` e `image` en login funciona igual: el frontend los ignora. El único requisito es que los seis campos obligatorios de login sigan presentes.
