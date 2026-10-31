---
resource: users-me-security-two-factor
methods: [POST]
auth: Required
consumers:
  - src/graphql/resolvers/security.ts
source_legacy: "§3.8, §11"
contract_version: v1.3.1
---

# 2FA — setup, verify, disable

Tres endpoints que conforman el flujo de autenticación de dos factores (2FA).

## Autenticación

`Required` en los tres.

## Medio soportado

El único medio soportado actualmente es el correo electrónico del usuario.

El código recibido y enviado a `verify` o `disable` es un string de exactamente 6 dígitos numéricos (`/^\d{6}$/`). El regex está en [`_convenciones/regex.md`](../../../_convenciones/regex.md).

Fuera de alcance: múltiples medios de 2FA, 2FA en login.

## Restricciones por rol

- `student`: 2FA opcional. Puede activarlo y desactivarlo.
- `teacher` / `admin`: 2FA obligatorio. Pueden activarlo, pero no desactivarlo. `POST /users/me/security/two-factor/disable` responde `403 FORBIDDEN` para esos roles.

El BFF bloquea `disable` con `403 FORBIDDEN` si `session.user.role !== 'student'`, sin llamar al backend. El backend vuelve a validar como defensa en profundidad.

La UI debe ocultar o deshabilitar la acción de desactivar cuando `twoFactorRequired === true` (ver [`index.md`](index.md)).

---

## POST /users/me/security/two-factor/setup

Inicia el setup de 2FA. Envía un código de 6 dígitos al correo del usuario.

### Cuerpo

Sin cuerpo.

### Respuesta

`BackendTwoFactorSetup`:

| Campo    | Tipo     |
| -------- | -------- |
| `secret` | `string` |
| `qrCode` | `string` |

`secret` y `qrCode` son sensibles. No se guardan en logs, no se envían a analítica, no se incluyen en otras respuestas (ver [`_convenciones/reglas-transversales.md`](../../../_convenciones/reglas-transversales.md), regla 6).

### Errores

| HTTP  | Código            | Cuándo                          |
| ----: | ----------------- | ------------------------------- |
| `401` | `UNAUTHENTICATED` | Token inválido o vencido        |
| `409` | `CONFLICT`        | 2FA ya activo                   |

---

## POST /users/me/security/two-factor/verify

Confirma el setup de 2FA con el código recibido.

### Cuerpo

```json
{
  "code": "123456"
}
```

### Respuesta

`BackendSecurityOperationResult`:

```json
{
  "success": true,
  "message": "Two factor enabled"
}
```

### Errores

| HTTP  | Código             | Cuándo                            |
| ----: | ------------------ | --------------------------------- |
| `401` | `UNAUTHENTICATED`  | Token inválido o vencido          |
| `409` | `CONFLICT`         | Setup no iniciado o 2FA ya activo |
| `422` | `VALIDATION_ERROR` | Formato del código inválido       |
| `422` | `INVALID_CODE`     | Código incorrecto                 |

---

## POST /users/me/security/two-factor/disable

Desactiva 2FA. Solo disponible para `student`.

### Cuerpo

```json
{
  "code": "123456"
}
```

### Respuesta

`BackendSecurityOperationResult`:

```json
{
  "success": true,
  "message": "Two factor disabled"
}
```

### Errores

| HTTP  | Código             | Cuándo                                        |
| ----: | ------------------ | --------------------------------------------- |
| `401` | `UNAUTHENTICATED`  | Token inválido o vencido                      |
| `403` | `FORBIDDEN`        | 2FA obligatorio para este rol (teacher/admin) |
| `422` | `VALIDATION_ERROR` | Formato del código inválido                   |
| `422` | `INVALID_CODE`     | Código incorrecto                             |

Códigos generales en [`_convenciones/errores.md`](../../../_convenciones/errores.md).
