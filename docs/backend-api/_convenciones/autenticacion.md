---
kind: convention
source_legacy: '§2'
contract_version: v1.3.1
---

# Autenticación

Hay dos tokens:

- **Access Token:** autentica las peticiones. Se envía como `Authorization: Bearer <token>`.
- **Refresh Token:** sirve únicamente para pedir un nuevo par de tokens en `POST /auth/refresh`. Nunca se usa en endpoints de negocio.

---

## Niveles de autenticación

| Nivel      | Qué significa                                                                              |
| ---------- | ------------------------------------------------------------------------------------------ |
| `None`     | No se lee el header `Authorization`.                                                       |
| `Optional` | Si llega un Bearer válido, el backend lo usa. Si no llega, trata la petición como anónima. |
| `Required` | El Bearer es obligatorio. Si falta o no es válido, responder `401`.                        |

---

## Modo `mock`

En modo `mock` (ver [`arquitectura.md`](arquitectura.md)), los tokens son valores sintéticos generados por la implementación controlada. No se validan contra el backend. Las reglas de autenticación de este documento aplican al modo `rest`.

---

## Alcance de la sesión del frontend

La sesión gestionada por Auth.js (`session.user`) se limita a tres campos:

| Campo   | Uso                                                      |
| ------- | -------------------------------------------------------- |
| `id`    | Ancla del JWT.                                           |
| `role`  | Autorización en el guard de rutas y en el BFF.           |
| `error` | Notificación de sesión expirada (no es parte de `user`). |

No forman parte de la sesión: nombre, correo, imagen, suscripción. Estos datos provienen del BFF vía GraphQL, que a su vez los obtiene de:

- [`GET /users/me`](../_rutas/users-me/me.md) (nombre, correo, imagen, rol).
- [`GET /users/me/subscription`](../_rutas/users-me/subscription.md) (plan).

Reglas:

- Los tokens de acceso y refresco viven en el JWT gestionado por Auth.js. Nunca se exponen al cliente vía `session.user`.
- Auth.js es responsable de autenticar. No es la fuente de datos de presentación.
- El BFF es la fuente de verdad para todo dato que la UI del dashboard necesite mostrar.
