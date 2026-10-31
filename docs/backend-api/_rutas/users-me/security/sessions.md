---
resource: users-me-security-sessions
methods: [DELETE]
auth: Required
consumers:
  - src/graphql/resolvers/security.ts
source_legacy: "§3.5, §3.8, §11"
contract_version: v1.3.1
---

# DELETE /users/me/security/sessions

Dos endpoints para revocar sesiones del usuario autenticado.

## Autenticación

`Required` en ambos.

---

## DELETE /users/me/security/sessions/:sessionId

Revoca una sesión específica.

### Parámetros

`sessionId` identifica la sesión que debe revocarse.

### Comportamiento

- Si la sesión indicada no existe o no pertenece al usuario autenticado → `404 NOT_FOUND`.
- Revocar la sesión actual (`sessionId === sesión actual`) → `409 SESSION_IS_CURRENT`.

La UI oculta la acción para la sesión actual (`Session.current === true`). Motivo: revocar la sesión actual cerraría la sesión activa del usuario y lo dejaría sin acceso; el flujo correcto es "cerrar sesión", no "revocar sesión".

### Respuesta

`BackendSecurityOperationResult`:

```json
{
  "success": true,
  "message": "Session revoked"
}
```

### Errores

| HTTP  | Código               | Cuándo                                |
| ----: | -------------------- | ------------------------------------- |
| `401` | `UNAUTHENTICATED`    | Token inválido o vencido              |
| `404` | `NOT_FOUND`          | Sesión inexistente o de otro usuario  |
| `409` | `SESSION_IS_CURRENT` | Intento de revocar la sesión actual   |

---

## DELETE /users/me/security/sessions

Revoca todas las sesiones del usuario autenticado, excepto la actual.

### Comportamiento

El backend identifica al usuario a partir del Access Token y revoca las demás sesiones activas asociadas a ese usuario.

La sesión utilizada para realizar la petición no debe revocarse.

### Respuesta

`BackendSecurityOperationResult`:

```json
{
  "success": true,
  "message": "Other sessions revoked"
}
```

### Errores

| HTTP  | Código            | Cuándo                   |
| ----: | ----------------- | ------------------------ |
| `401` | `UNAUTHENTICATED` | Token inválido o vencido |

Códigos generales en [`_convenciones/errores.md`](../../../_convenciones/errores.md).
