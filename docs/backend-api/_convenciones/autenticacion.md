---
kind: convention
source_legacy: '§2'
contract_version: v2.0
---

# Autenticación

**No hay tokens externos.** Auth.js firma su propio JWT. La sesión es el JWT
firmado, con `maxAge` y renovación automática. No hay access token, refresh
token ni rotación de tokens.

---

## Cómo se llega a la sesión

1. **`authorize()`** (en `src/auth.ts`) recibe las credenciales del formulario
   de login, aplica rate limit, valida con `loginSchema` y llama a
   `authenticateUser(email, password)` en la capa de dominio.
2. **`callbacks.jwt`** copia `id` y `role` al JWT firmado por Auth.js. Este
   callback se ejecuta solo en el primer login (cuando `user` está presente).
3. **`callbacks.session`** copia `id` y `role` desde el JWT a `session.user`.
   Se ejecuta en cada petición.

`session.user` **nunca** contiene nombre, correo, imagen ni suscripción. Esos
datos viven en la capa de presentación (BFF vía GraphQL), no en la sesión.

---

## TTL de la sesión

`SESSION_MAX_AGE = 60 * 60 * 24 * 7` segundos = **7 días**.

Coincide con el TTL del refresh token del backend anterior. Se conserva el
mismo valor para no cambiar el comportamiento de los usuarios. Auth.js
renueva el JWT automáticamente mientras la sesión esté activa.

---

## Niveles de autenticación

| Nivel      | Qué significa                                                                         |
| ---------- | ------------------------------------------------------------------------------------- |
| `None`     | No se lee `session`. La operación es pública.                                         |
| `Optional` | Si hay sesión, se usa. Si no, la operación se trata como anónima.                     |
| `Required` | La sesión es obligatoria. Si falta o no es válida, se responde `401 UNAUTHENTICATED`. |

Los mismos nombres se usan en el contrato (`docs/backend-api/_rutas/`) y en
los helpers del BFF (`requireAuth`, `requireRole`).

---

## Modo `mock`

En modo `mock` (ver [`arquitectura.md`](arquitectura.md)), el usuario
autenticado es un **usuario simulado** que devuelve
`MockPublicBackendClient.auth.login(...)` con un `id` y `role` fijos
(`test-user-001`, `student`). No hay validación real de credenciales contra
ninguna base de datos; `invalid@example.com` y `wrong-password` simulan
credenciales incorrectas.

Las reglas de autenticación de este documento aplican tanto al modo `local`
como al modo `mock`. El modo `mock` no cambia la forma de la sesión ni los
niveles de autenticación.

---

## Alcance de la sesión del frontend

La sesión gestionada por Auth.js (`session.user`) se limita a dos campos:

| Campo  | Uso                                               |
| ------ | ------------------------------------------------- |
| `id`   | Ancla del JWT. Identifica al usuario autenticado. |
| `role` | Autorización en el guard de rutas y en el BFF.    |

**No forman parte de la sesión:**

- nombre, correo, imagen, suscripción (los entrega el BFF vía GraphQL);
- `error` (se eliminó en v2.0; Auth.js redirige solo);
- access token, refresh token (no existen en este modelo).

Los datos de presentación provienen del BFF vía GraphQL, que a su vez los
obtiene de:

- [`GET /users/me`](../_rutas/users-me/me.md) (nombre, correo, imagen, rol).
- [`GET /users/me/subscription`](../_rutas/users-me/subscription.md) (plan).

Reglas:

- Auth.js es responsable de autenticar. No es la fuente de datos de
  presentación.
- El BFF es la fuente de verdad para todo dato que la UI del dashboard
  necesite mostrar.
- Ningún componente cliente puede leer `session` directamente para mostrar
  datos de presentación. Siempre pasa por GraphQL.
